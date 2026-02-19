"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ComputerStatus } from "@/types";
import Link from "next/link";

interface ComputerGridProps {
  computers: ComputerStatus[];
  onRefresh?: () => void;
}

export function ComputerGrid({ computers, onRefresh }: ComputerGridProps) {
  const getStatusColor = (computer: ComputerStatus) => {
    if (computer.status === "maintenance") return "bg-yellow-500";
    if (computer.isOccupied) return "bg-red-500";
    return "bg-green-500";
  };

  const getStatusText = (computer: ComputerStatus) => {
    if (computer.status === "maintenance") return "Maintenance";
    if (computer.isOccupied) return "Occupied";
    return "Available";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Computer Status</h2>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {computers.map((computer) => (
          <Card key={computer.id} className="relative overflow-hidden">
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(computer)}`}
            />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{computer.name}</CardTitle>
                <Badge
                  variant={computer.isOccupied || computer.status === "maintenance" ? "secondary" : "default"}
                  className={computer.isOccupied || computer.status === "maintenance" ? "" : "bg-green-600"}
                >
                  {getStatusText(computer)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {computer.description && (
                <p className="text-sm text-muted-foreground">
                  {computer.description}
                </p>
              )}

              {computer.isOccupied && computer.nextAvailableAt && (
                <p className="text-xs text-muted-foreground">
                  Available: {formatDate(computer.nextAvailableAt)}
                </p>
              )}

              {!computer.isOccupied && computer.status !== "maintenance" && (
                <Link href={`/dashboard/book?computer=${computer.id}`}>
                  <Button size="sm" className="w-full mt-2">
                    Book Now
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {computers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No computers available
        </div>
      )}
    </div>
  );
}
