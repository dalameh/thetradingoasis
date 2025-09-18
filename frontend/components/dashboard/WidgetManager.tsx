// components/dashboard/WidgetManager.tsx
'use client';

import React, { useMemo, useState } from "react";
import { AVAILABLE_WIDGETS, AvailableWidget } from "@/components/dashboard/availableWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Settings } from "lucide-react";

interface WidgetManagerProps {
  activeWidgets: string[]; // currently active ids for this section
  allActiveWidgets: string[]; // widgets used anywhere (stats + main)
  onToggleWidget: (widgetId: string) => void;
  onToggleManager: () => void;
  allowedCategory?: string | null; // for stats row, only Analytics
}

export function WidgetManager({
  activeWidgets,
  allActiveWidgets,
  onToggleWidget,
  onToggleManager,
  allowedCategory = null
}: WidgetManagerProps) {
  // compute all categories
  const allCategories = useMemo(() => {
    const cats = Array.from(new Set(AVAILABLE_WIDGETS.map(w => w.category)));
    return ["All", ...cats];
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>(allowedCategory ?? "All");

  const filteredWidgets = useMemo(() => {
    // base list
    let base = allowedCategory
      ? AVAILABLE_WIDGETS.filter(w => w.category === allowedCategory)
      : AVAILABLE_WIDGETS;

    // filter by selected category if not "All"
    if (selectedCategory !== "All") base = base.filter(w => w.category === selectedCategory);

    return base;
  }, [allowedCategory, selectedCategory]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <Card 
        className="w-full max-w-2xl min-h-[80vh] overflow-hidden rounded-2xl shadow-2xl border border-gray-200 bg-white">
        <div className="overflow-y-auto max-h-[80vh]">

          <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-200 px-6 py-4">
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <Settings className="mr-2 h-5 w-5 text-gray-700" />
              Add / Remove Widgets
            </CardTitle>
            <button 
              onClick={onToggleManager} className="text-red-400 hover:text-red-500">
              <X className="h-5 w-5" />
            </button>
          </CardHeader>

          <CardContent className="px-6 py-6">
            {/* Category selector */}
            <div className="mb-4 flex flex-wrap gap-2">
              {allCategories.map(cat => {
                const disabled = !!allowedCategory && cat !== allowedCategory && cat !== "All";
                return (
                  <button
                    key={cat}
                    onClick={() => !disabled && setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${selectedCategory === cat ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
                      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Widgets grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredWidgets.map((w: AvailableWidget) => {
                const inCurrentSection = activeWidgets.includes(w.id);
                const usedElsewhere = allActiveWidgets.includes(w.id) && !inCurrentSection;

                // Determine button classes
                let classes = "w-full text-left p-4 rounded-xl border transition-all group cursor-pointer";
                if (inCurrentSection) classes += " bg-green-50 border-green-400 hover:shadow-md";
                else if (usedElsewhere) classes += " bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed";
                else classes += " bg-white border-gray-200 hover:border-green-300 hover:shadow-sm";

                return (
                  <button
                    key={w.id}
                    onClick={() => !usedElsewhere && onToggleWidget(w.id)}
                    disabled={usedElsewhere}
                    className={`${classes} relative`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">{w.title}</h4>
                          <div className="text-xs text-gray-400">{w.category}</div>
                        </div>
                        <p className="text-xs text-gray-600">{w.description}</p>
                      </div>
                      <div className="ml-4 flex items-center">
                        {inCurrentSection ? (
                          <div className="text-red-600 text-xs font-medium flex items-center">
                            <X className="mr-1 h-4 w-4" /> Remove
                          </div>
                        ) : (
                          !usedElsewhere && (
                            <div className="text-green-600 text-xs font-medium flex items-center">
                              <Plus className="mr-1 h-4 w-4" /> Add
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="absolute bottom-1 right-2 text-[10px] text-gray-400/70 select-none">
                      {w.span}x{w.rowSpan ?? 1}
                    </div>
                  </button>
                );
              })}

              {filteredWidgets.length === 0 && (
                <div className="text-center text-gray-500 col-span-full p-6">No widgets in this category</div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
