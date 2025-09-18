'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactSelect from "react-select";
import { ChartLine } from "lucide-react";

import {
  createChart,
  CandlestickSeries,
  IChartApi,
  ISeriesApi,
  Time,
  SeriesMarker,
  createSeriesMarkers,
} from 'lightweight-charts';

interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ChartProps {
  ticker: string;
  start?: string;
  end?: string;
  entry?: Time;
  exit?: Time;
  interval?: string;
  height?: number;
  width?: number;
  page?: string;
}

export function getTicker(ticker: string): string {
  const clean = ticker.toUpperCase().replace(/[\s\-\&]/g, "");
  const mapping: Record<string, string> = {
    SP500: "^GSPC",
    NASDAQ: "^IXIC",
    NASDAQ100: "^IXIC",
    DOWJONES: "^DJI",
    DOWJONESINDUSTRIALAVERAGE: "^DJI",
    RUSSELL2000: "^RUT",
  };
  return mapping[clean] || ticker;
}

const intervals = ["1m","5m","15m","30m","1h","1d","1wk","1mo"] as const;
type Interval = typeof intervals[number];
const options = intervals.map(i => ({ value: i, label: i }));

function toUnixTimestamp(time: Time): number {
  if (typeof time === 'number') return time;
  if (typeof time === 'string') return Math.floor(Date.parse(time)/1000);
  if ('year' in time && 'month' in time && 'day' in time) {
    const d = new Date(time.year, time.month-1, time.day, 9, 30, 0);
    return Math.floor(d.getTime()/1000);
  }
  console.warn("Invalid time format:", time);
  return 0;
}

interface TooltipData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time: Time;
  x: number;
  y: number;
}

export default function Chart({
  ticker,
  start,
  end,
  interval = "1d",
  entry,
  exit,
  height = 400,
  width,
  page,
}: ChartProps) {

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [selectedInterval, setSelectedInterval] = useState<Interval>(interval as Interval);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const entryUnix = entry ? toUnixTimestamp(entry) : undefined;
  const exitUnix = exit ? toUnixTimestamp(exit) : undefined;

  // --- CREATE CHART ---
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { textColor: 'black', background: { color: 'white' } },
      width: chartContainerRef.current.clientWidth,
      height,
      localization: {
        timeFormatter: (time: number | string) => {
          const d = new Date(typeof time === 'number' ? time * 1000 : time);
          const intraday = ['1m', '5m', '15m', '30m', '1h'];
          if (intraday.includes(selectedInterval)) {
            return d.toLocaleString([], { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
          } else {
            return d.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' });
          }
        },
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const resizeObserver = new ResizeObserver(() => {
      if (!chartRef.current || !chartContainerRef.current) return;
      const containerWidth = chartContainerRef.current.clientWidth;
      const newWidth = width && containerWidth > width ? width : containerWidth;
      chartRef.current.applyOptions({ width: newWidth, height });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [height, width, selectedInterval]);

  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || !chartContainerRef.current) return;

    const chart = chartRef.current;
    const container = chartContainerRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;

      // Convert pixel to time
      const clickedTime = chart.timeScale().coordinateToTime(x);
      if (!clickedTime) return;

      // Find the closest candle
      const closest = candleData.reduce((prev, curr) =>
        Math.abs(toUnixTimestamp(curr.time) - toUnixTimestamp(clickedTime)) <
        Math.abs(toUnixTimestamp(prev.time) - toUnixTimestamp(clickedTime))
          ? curr
          : prev
      );

      // Map price to Y coordinate
      const priceRange = chart.priceScale('right').getVisibleRange();
      let y = rect.height / 2;
      if (priceRange) {
        y = ((priceRange.to - closest.close) / (priceRange.to - priceRange.from)) * rect.height;
      }

      // Temporarily set tooltip so we can measure its size
      setTooltip({ ...closest, x, y });

      // Delay to next tick to ensure tooltip element exists in DOM
      requestAnimationFrame(() => {
        const tooltipEl = container.querySelector('.tooltip') as HTMLDivElement;
        if (!tooltipEl) return;

        let tooltipX = x;
        let tooltipY = y;
        const ttRect = tooltipEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Clamp tooltip inside container
        if (tooltipX + ttRect.width > containerRect.width) tooltipX = containerRect.width - ttRect.width - 4;
        if (tooltipX < 0) tooltipX = 4;
        if (tooltipY + ttRect.height > containerRect.height) tooltipY = containerRect.height - ttRect.height - 4;
        if (tooltipY < 0) tooltipY = 4;

        setTooltip(prev => prev ? { ...prev, x: tooltipX, y: tooltipY } : null);
      });

      const handleMouseUp = () => {
        setTooltip(null);
        container.removeEventListener('mouseup', handleMouseUp);
      };

      container.addEventListener('mouseup', handleMouseUp);
    };

    container.addEventListener('mousedown', handleMouseDown);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
    };
  }, [candleData]);


  // --- FETCH DATA ---
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const url = new URL('/api/yfinance', window.location.origin);
        url.searchParams.append('ticker', ticker);
        url.searchParams.append('interval', selectedInterval);
        if (start) url.searchParams.append('start', start);
        if (end) url.searchParams.append('end', end);

        const res = await fetch(url.toString());
        if (!res.ok) {
          if (!isMounted) return;
          setErrorMessage(`ticker "${ticker}" not found`);
          candleSeriesRef.current?.setData([]);
          return;
        }

        const data: CandleData[] = await res.json();
        if (!isMounted) return;
        if (!Array.isArray(data) || !data.length) {
          candleSeriesRef.current?.setData([]);
          return;
        }

        setCandleData(data);
        candleSeriesRef.current?.setData(data);

        const allTimes = data.map(d => toUnixTimestamp(d.time));
        const minTime = Math.min(...allTimes);
        const maxTime = Math.max(...allTimes);

        let fromTime = minTime;
        let toTime = maxTime;

        // --- DIARY PAGE VISIBLE RANGE ---
        if (page === "diary") {
          const startOfDay = (t: number) => Math.floor(new Date(t * 1000).setHours(0,0,0,0)/1000);
          const endOfDay = (t: number) => Math.floor(new Date(t * 1000).setHours(23,59,59,999)/1000);

          if (entryUnix && !exitUnix) {
            if (['1d','1wk','1mo'].includes(selectedInterval)) {
              fromTime = startOfDay(entryUnix);
              toTime = endOfDay(entryUnix);
              const idx = allTimes.findIndex(t => t >= entryUnix);
              if (idx !== -1) {
                fromTime = allTimes[Math.max(idx-10,0)];
                toTime = allTimes[Math.min(idx+2, allTimes.length-1)];
              }
            } else {
              const idx = allTimes.findIndex(t => t >= entryUnix);
              if (idx !== -1) {
                fromTime = allTimes[Math.max(idx-10,0)];
                toTime = allTimes[Math.min(idx+10, allTimes.length-1)];
              }
            }
          } else if (entryUnix && exitUnix) {
            const idxStart = allTimes.findIndex(t => t >= entryUnix);
            const idxEnd = allTimes.findIndex(t => t >= exitUnix);
            if (idxStart !== -1 && idxEnd !== -1) {
              fromTime = allTimes[Math.max(idxStart-10,0)];
              toTime = allTimes[Math.min(idxEnd+10, allTimes.length-1)];
            }
          }

          // --- MAX BARS ---
          const maxBarsMap: Record<string, number> = {
            '1m': 390,
            '5m': 78*6,
            '15m': 26*20,
            '30m': 13*40,
            '1h': 7*80,
            '1d': Infinity,
            '1wk': Infinity,
            '1mo': Infinity,
          };
          const maxBars = maxBarsMap[selectedInterval] ?? Infinity;

          const fromIdx = allTimes.findIndex(t => t >= fromTime);
          const toIdx = allTimes.findIndex(t => t >= toTime);

          if (fromIdx !== -1 && toIdx !== -1) {
            const visibleBars = toIdx - fromIdx + 1;
            if (visibleBars > maxBars) {
              if (entryUnix) {
                const idx = allTimes.findIndex(t => t >= entryUnix);
                if (idx !== -1) {
                  const half = Math.floor(maxBars/2);
                  fromTime = allTimes[Math.max(idx-half,0)];
                  toTime = allTimes[Math.min(idx+half, allTimes.length-1)];
                }
              } else {
                fromTime = allTimes[Math.max(allTimes.length-maxBars,0)];
                toTime = allTimes[allTimes.length-1];
              }
            }
          }

          if (fromTime <= toTime) {
            chartRef.current?.timeScale().setVisibleRange({ from: fromTime as Time, to: toTime as Time });
          }
        }

        // --- CHART PAGE ---
        if (page === "chart" || !entryUnix) {
          const maxTime = Math.max(...data.map(d => toUnixTimestamp(d.time)));
          let visibleRangeSeconds;
          if (["1m","5m"].includes(selectedInterval)) visibleRangeSeconds = 2*24*60*30;
          else if (["15m","30m"].includes(selectedInterval)) visibleRangeSeconds = 2*24*60*60;
          else if (["1h","1d"].includes(selectedInterval)) visibleRangeSeconds = 10*24*60*60;
          else visibleRangeSeconds = 91.5*24*60*60;

          chartRef.current?.timeScale().setVisibleRange({ from: maxTime - visibleRangeSeconds as Time, to: maxTime as Time });
        }

      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load chart data', error);
        setErrorMessage('Failed to load chart data');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [ticker, start, end, selectedInterval, entryUnix, exitUnix, page]);

  // --- Interval formatter update ---
  useEffect(() => {
    if (!chartRef.current) return;
    const intraday = ['1m','5m','15m','30m','1h'];
    chartRef.current.applyOptions({
      localization: {
        timeFormatter: (time: number) => {
          const d = new Date(time*1000);
          if (intraday.includes(selectedInterval)) {
            return d.toLocaleString([], { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
          } else {
            return d.toLocaleDateString([], { year:'numeric', month:'2-digit', day:'2-digit' });
          }
        }
      }
    });
    const ts = chartRef.current.timeScale();
    const vr = ts.getVisibleRange();
    if (vr) ts.setVisibleRange(vr);
  }, [selectedInterval]);

  // --- MARKERS ---
  useEffect(() => {
    if (!candleSeriesRef.current || !candleData.length) return;
    const findClosestBar = (targetUnix: number) =>
      candleData.reduce<CandleData | undefined>((closest, curr) => {
        if (!closest) return curr;
        const diffCurr = Math.abs(toUnixTimestamp(curr.time) - targetUnix);
        const diffClosest = Math.abs(toUnixTimestamp(closest.time) - targetUnix);
        return diffCurr < diffClosest ? curr : closest;
      }, undefined);

    const entryBar = entryUnix ? findClosestBar(entryUnix) : undefined;
    const exitBar = exitUnix ? findClosestBar(exitUnix) : undefined;

    const markers: SeriesMarker<Time>[] = [];

    if (entryBar && exitBar && toUnixTimestamp(entryBar.time) === toUnixTimestamp(exitBar.time)) {
      markers.push({ time: toUnixTimestamp(entryBar.time) as Time, position:'aboveBar', shape:'circle', color:'blue', text:'Trade', price: entryBar.close });
    } else {
      if (entryBar) markers.push({ time: toUnixTimestamp(entryBar.time) as Time, position:'aboveBar', shape:'arrowDown', color:'#08aa08ff', text:'Buy', price: entryBar.close });
      if (exitBar) markers.push({ time: toUnixTimestamp(exitBar.time) as Time, position:'belowBar', shape:'arrowUp', color:'red', text:'Sell', price: exitBar.close });
    }

    createSeriesMarkers(candleSeriesRef.current, markers);
  }, [entryUnix, exitUnix, candleData]);

  // --- RENDER ---
  return (
    <div className="flex justify-center">
      <div className="p-4 rounded-xl shadow bg-white border w-full" style={{ maxWidth: width ?? '100%' }}>
        <div className="mb-3 flex items-center space-x-2">
          <label htmlFor="interval-select" className="text-black font-semibold whitespace-nowrap">Interval:</label>
          <ReactSelect
            inputId="interval-select"
            options={options}
            value={options.find(o => o.value === selectedInterval)}
            onChange={option => setSelectedInterval(option?.value as Interval)}
            className="text-gray-700"
            classNamePrefix="react-select"
            isSearchable
            styles={{
              menu: (p) => ({ ...p, zIndex:1000, fontSize:"0.8rem", minHeight:"20px" }),
              option: (p) => ({ ...p, fontSize:"0.8rem", padding:"4px 8px" }),
              control: (p) => ({ ...p, minHeight:"28px", fontSize:"1rem" }),
              valueContainer: (p) => ({ ...p, padding:"0 6px" }),
              indicatorsContainer: (p) => ({ ...p, padding:"0 4px" }),
            }}
          />
        </div>

        <div className="flex flex-col w-full relative" style={{ height:`${height}px` }}>
          {errorMessage && <p className="text-gray-600 mb-2">{errorMessage}</p>}
          <div ref={chartContainerRef} className="w-full h-full overflow-hidden relative">
            {tooltip && (
              <div
                className="tooltip absolute border shadow rounded p-2 text-xs z-20 pointer-events-none"
                style={{
                  left: tooltip.x,  // will be adjusted in JS
                  top: tooltip.y,   // will be adjusted in JS
                  whiteSpace: 'nowrap',
                  backgroundColor: 'black',
                  color: 'white',
                }}
              >
  <strong>Time:</strong> {new Date(toUnixTimestamp(tooltip.time) * 1000).toLocaleString()}
                <div>
                  <strong>Open:</strong>{' '}
                  <span className = "font-semibold" style={{ color: tooltip.close >= tooltip.open ? '#26a69a' : '#ef5350' }}>
                    {Number(tooltip.open).toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong>High:</strong>{' '}
                  <span className = "font-semibold" style={{ color: tooltip.close >= tooltip.open ? '#26a69a' : '#ef5350' }}>
                    {Number(tooltip.high).toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong>Low:</strong>{' '}
                  <span className = "font-semibold" style={{ color: tooltip.close >= tooltip.open ? '#26a69a' : '#ef5350' }}>
                    {Number(tooltip.low).toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong>Close:</strong>{' '}
                  <span className = "font-semibold" style={{ color: tooltip.close >= tooltip.open ? '#26a69a' : '#ef5350' }}>
                    {Number(tooltip.close).toFixed(2)}
                  </span>
                </div>
                {/* {tooltip.volume !== undefined && (
                  <div>
                    <strong className = "font-semibold">V:</strong> {Number(tooltip.volume).toLocaleString()}
                  </div>
                )} */}
              </div>
            )}



            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                <ChartLine className="w-24 h-24 text-gray-300 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
