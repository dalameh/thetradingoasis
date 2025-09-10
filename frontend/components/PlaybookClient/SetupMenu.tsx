import React from "react";
import { Edit, X } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

type SetupMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export default function SetupMenu({ onEdit, onDelete }: SetupMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 rounded text-white text-xl select-none" aria-label="Options menu">⋮</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem onClick={onEdit} className="flex items-center gap-2">
          <Edit className="h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="flex items-center gap-2 text-red-600">
          <X className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}