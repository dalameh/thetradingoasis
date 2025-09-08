"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Define widget type
interface Widget {
  id: string;
  href: string;
  emoji: string;
  label: string;
  bgColor: string;
  hoverColor: string;
}

interface SortableItemProps extends Widget {
  disabled?: boolean;
}

const initialWidgets: Widget[] = [
  { id: "charts", href: "/charts", emoji: "📊", label: "Charts", bgColor: "bg-blue-50", hoverColor: "hover:bg-blue-100" },
  { id: "addTrade", href: "/diary?add=true", emoji: "📝", label: "Add Trade", bgColor: "bg-green-50", hoverColor: "hover:bg-green-100" },
  { id: "watchlist", href: "/watchlist", emoji: "👁️", label: "Add to Watchlist", bgColor: "bg-purple-50", hoverColor: "hover:bg-purple-100" },
  { id: "addSetup", href: "/playbook?create=true", emoji: "📋", label: "Add Setup", bgColor: "bg-orange-50", hoverColor: "hover:bg-orange-100" },
];


function SortableItem({ id, href, emoji, label, bgColor, hoverColor, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const router = useRouter();

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
    cursor: disabled ? "default" : "grab",
  };

  const handleClick = () => router.push(href);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!disabled && listeners)}
      onClick={handleClick}
      className={`flex items-center justify-center rounded-lg
        ${bgColor} ${hoverColor} ${isDragging ? "shadow-lg scale-105" : ""} ${disabled ? "cursor-default" : "cursor-pointer"}`}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(href)}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="font-medium text-black text-center text-sm sm:text-base md:text-md">
        {label}
      </div>
    </div>
  );
}

export function QuickActionsWidget({ editing = false }: { editing?: boolean }) {
  const [widgets, setWidgets] = useState(initialWidgets);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!editing) return;
    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      setWidgets((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <main>
      <DndContext
        key={editing ? "edit" : "view"} // force remount on editing change
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-3 w-full">
            {widgets.map((widget) => (
              <SortableItem
                key={widget.id} // you no longer need editing in key
                {...widget}
                disabled={!editing}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </main>
  );
}