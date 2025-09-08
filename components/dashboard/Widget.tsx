import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onRemove?: (id: string) => void;
  className?: string;
}

export function Widget({ id, title, children, onRemove, className }: WidgetProps) {
  return (
    <Card 
      className={`bg-gradient-to-br from-blue-500 to-indigo-400 border ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {onRemove && (
          <Button
            onClick={() => onRemove(id)}
            className="h-6 w-6 p-0 hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}