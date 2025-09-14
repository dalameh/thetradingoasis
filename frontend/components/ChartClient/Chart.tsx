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
  // Normalize: uppercase, remove spaces & special chars
    const clean = ticker.toUpperCase().replace(/[\s\-\&]/g, "");

    const mapping: Record<string, string> = {
      "SP500": "^GSPC",
      "NASDAQ": "^IXIC",
      "NASDAQ100": "^IXIC",
      "DOWJONES": "^DJI",
      "DOWJONESINDUSTRIALAVERAGE": "^DJI",
      "RUSSELL2000": "^RUT",
    };

    return mapping[clean] || ticker; // fallback to original input if not found
}

const intervals = ["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"] as const;
type Interval = typeof intervals[number];
const options = intervals.map(i => ({ value: i, label: i }));

function toUnixTimestamp(time: Time): number {
  if (typeof time === 'number') return time;

  if (typeof time === 'string') {
    const timestamp = Date.parse(time);
    return Math.floor(timestamp / 1000);
  }

  // BusinessDay (only year, month, day)
  if ('year' in time && 'month' in time && 'day' in time) {
    const d = new Date(time.year, time.month - 1, time.day, 0, 0, 0);
    return Math.floor(d.getTime() / 1000);
  }

  console.warn('Invalid time format:', time);
  return 0;
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

  const [isLoading, setIsLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState<Interval>(interval as Interval);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [candleData, setCandleData] = useState<CandleData[]>([]);

  const entryUnix = entry ? toUnixTimestamp(entry) : undefined;
  const exitUnix = exit ? toUnixTimestamp(exit) : undefined;

  // --- CREATE CHART ONCE ---
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: { textColor: 'black', background: { color: 'white' } },
      width: container.clientWidth,
      height,
      localization: {
        timeFormatter: (time: number | string) => {
          const d = new Date(typeof time === 'number' ? time * 1000 : time);
          const intraday = ['1m', '5m', '15m', '30m', '1h'];
          if (intraday.includes(selectedInterval)) {
            // Include weekday for intraday
            return d.toLocaleString([], {
              weekday: 'short', // Mon, Tue, etc
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
          } else {
            // Include weekday for daily or higher intervals
            return d.toLocaleDateString([], {
              weekday: 'short', // Mon, Tue, etc
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });
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
    
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [height, width, selectedInterval]);

  // --- FETCH DATA AND UPDATE CHART ---
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

        // Diary Page
        if (page === "diary") {
          // --- VISIBLE RANGE LOGIC ---
          const allTimes = data.map(d => toUnixTimestamp(d.time));
          const minTime = Math.min(...allTimes);
          const maxTime = Math.max(...allTimes);

          const startOfDay = (t: number) => Math.floor(new Date(t * 1000).setHours(0,0,0,0)/1000);
          const endOfDay = (t: number) => Math.floor(new Date(t * 1000).setHours(23,59,59,999)/1000);

          let fromTime = minTime;
          let toTime = maxTime;

          if (entryUnix && !exitUnix) {
            if (['1d','1wk','1mo'].includes(selectedInterval)) {
              fromTime = startOfDay(entryUnix);
              toTime = endOfDay(entryUnix);

              const idx = allTimes.findIndex(t => t >= entryUnix);
              if (idx !== -1) {
                fromTime = allTimes[Math.max(idx - 10, 0)];
                toTime   = allTimes[Math.min(idx + 2, allTimes.length - 1)];
              }
            } else {
              const idx = allTimes.findIndex(t => t >= entryUnix);
              if (idx !== -1) {
                fromTime = allTimes[Math.max(idx - 10, 0)];
                toTime   = allTimes[Math.min(idx + 10, allTimes.length - 1)];
              }
            }
          } else if (entryUnix && exitUnix) {
            const idxStart = allTimes.findIndex(t => t >= entryUnix);
            const idxEnd   = allTimes.findIndex(t => t >= exitUnix);

            if (idxStart !== -1 && idxEnd !== -1) {
              fromTime = allTimes[Math.max(idxStart - 10, 0)];
              toTime   = allTimes[Math.min(idxEnd + 10, allTimes.length - 1)];
            }
          }

          // --- MAX BARS LOGIC ---
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
          const toIdx   = allTimes.findIndex(t => t >= toTime);

          if (fromIdx !== -1 && toIdx !== -1) {
            const visibleBars = toIdx - fromIdx + 1;

            if (visibleBars > maxBars) {
              if (entryUnix) {
                const idx = allTimes.findIndex(t => t >= entryUnix);
                if (idx !== -1) {
                  const half = Math.floor(maxBars/2);
                  fromTime = allTimes[Math.max(idx - half, 0)];
                  toTime   = allTimes[Math.min(idx + half, allTimes.length - 1)];
                }
              } else {
                fromTime = allTimes[Math.max(allTimes.length - maxBars, 0)];
                toTime   = allTimes[allTimes.length - 1];
              }
            }
          }

          // --- SAFETY CHECK to avoid assertion failure ---
          if (fromTime && toTime && fromTime <= toTime) {
            chartRef.current!.timeScale().setVisibleRange({
              from: fromTime as Time,
              to: toTime as Time,
            });
          }

          chartRef.current?.timeScale().setVisibleRange({ from: fromTime as Time, to: toTime as Time });

        } 
        
        // Chart page
        if (page === "chart" || !entryUnix) {
        
          const maxTime = Math.max(...data.map(d => toUnixTimestamp(d.time))); 
          let visibleRangeSeconds; 
          if (["1m", "5m", "15m", "30m"].includes(selectedInterval)) 
              visibleRangeSeconds = 2 * 24 * 60 * 60; 
          else if (["1h", "1d"].includes(selectedInterval)) 
            visibleRangeSeconds = 10 * 24 * 60 * 60; 
          else 
            visibleRangeSeconds = 91.5 * 24 * 60 * 60; 
          
          chartRef.current?.timeScale().setVisibleRange
          ({ from: maxTime - visibleRangeSeconds as Time, to: maxTime as Time});
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

  
  useEffect(() => {
    if (!chartRef.current) return;

    const intraday = ['1m','5m','15m','30m','1h'];

    // create a new formatter for the selected interval
    const timeFormatter = (time: number) => {
      const d = new Date(time * 1000);
      if (intraday.includes(selectedInterval)) {
        return d.toLocaleString([], {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        return d.toLocaleDateString([], {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }
    };

    // Apply the new formatter
    chartRef.current.applyOptions({
      localization: { timeFormatter },
    });

    // Force redraw of the X-axis labels
    const ts = chartRef.current.timeScale();
    const visibleRange = ts.getVisibleRange();
    if (visibleRange) {
      ts.setVisibleRange(visibleRange); // triggers redraw with new formatter
    }
  }, [selectedInterval]);


  // Markets
  useEffect(() => {
    if (!candleSeriesRef.current || !candleData.length) return;

    // --- CLEAR PREVIOUS MARKERS ---
    createSeriesMarkers(candleSeriesRef.current, []);

    const markers: SeriesMarker<Time>[] = [];

    const entryBar = entryUnix
    ? [...candleData].reverse().find(d => toUnixTimestamp(d.time) <= entryUnix)
    : undefined;

  const exitBar = exitUnix
    ? [...candleData].reverse().find(d => toUnixTimestamp(d.time) <= exitUnix)
    : undefined;


    if (entryBar && exitBar && toUnixTimestamp(entryBar.time) === toUnixTimestamp(exitBar.time)) {
      markers.push({
        time: toUnixTimestamp(entryBar.time) as Time,
        position: 'aboveBar',
        color: 'blue',
        shape: 'circle',
        text: 'Trade',
        price: entryBar.close,
      });
    } else {
      if (entryBar) {
        markers.push({
          time: toUnixTimestamp(entryBar.time) as Time,
          position: 'aboveBar',
          shape: 'arrowDown',           // use circle
          color: '#08aa08ff',          // light green fill
          text: 'Buy',
          price: entryBar.close,
        });
      }
      if (exitBar) {
        markers.push({
          time: toUnixTimestamp(exitBar.time) as Time,
          position: 'aboveBar',
          color: 'red',
          shape: 'arrowDown',
          text: 'Sell',
          price: exitBar.close,
        });
      }
    }

    // --- APPLY NEW MARKERS ---
    createSeriesMarkers(candleSeriesRef.current, markers);
  }, [entryUnix, exitUnix, selectedInterval, candleData]);

  return (
    <div className="flex justify-center">
      <div className="p-4 rounded-xl shadow bg-white border w-full" style={{ maxWidth: width ?? '100%' }}>
        <div className="mb-3 flex items-center space-x-2">
        <label
          htmlFor="interval-select"
          className="text-black font-semibold whitespace-nowrap"
        >
          Interval:
        </label>
        <ReactSelect
          inputId="interval-select"
          options={options}
          value={options.find(o => o.value === selectedInterval)}
          onChange={option => setSelectedInterval(option?.value as Interval)}
          className="text-gray-700"
          classNamePrefix="react-select"
          isSearchable
          styles={{
            menu: (provided) => ({
              ...provided,
              zIndex: 1000,
              fontSize: "0.8rem",
              minHeight: "20px",
            }),
            option: (provided) => ({
              ...provided,
              fontSize: "0.8rem",
              padding: "4px 8px",
            }),
            control: (provided) => ({
              ...provided,
              minHeight: "28px",
              fontSize: "1rem",
            }),
            valueContainer: (provided) => ({ ...provided, padding: "0 6px" }),
            indicatorsContainer: (provided) => ({ ...provided, padding: "0 4px" }),
          }}
        />
      </div>
        
        <div className="flex flex-col w-full">
          {/* Error message above chart */}
          {errorMessage && (
            <p className="text-gray-600 mb-2">{errorMessage}</p>
          )}

          {/* Chart container */}
          <div className="relative w-full" style={{ height: `${height}px` }}>
            <div 
              ref={chartContainerRef} 
              className="w-full h-full overflow-hidden"
            />

            {/* Loading overlay on top of chart */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                <ChartLine className="w-24 h-24 text-gray-300 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
