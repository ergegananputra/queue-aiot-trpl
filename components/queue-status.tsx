"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { QueuePosition, ComputerStatus } from "@/types";

interface QueueStatusProps {
  position: QueuePosition | null;
  computers?: ComputerStatus[];
  onJoin?: (preferredComputerId?: string) => Promise<void>;
  onLeave?: () => Promise<void>;
}

export function QueueStatus({
  position,
  computers = [],
  onJoin,
  onLeave,
}: QueueStatusProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!onJoin) return;
    setIsLoading(true);
    try {
      await onJoin();
      toast.success("Joined the queue!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join queue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!onLeave) return;
    setIsLoading(true);
    try {
      await onLeave();
      toast.success("Left the queue");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to leave queue");
    } finally {
      setIsLoading(false);
    }
  };

  const availableCount = computers.filter(
    (c) => !c.isOccupied && c.status !== "maintenance"
  ).length;

  // Calculate estimated wait time based on when computers will be free
  const getEstimatedWaitTime = () => {
    if (!position) return null;
    
    const occupiedComputers = computers
      .filter((c) => c.isOccupied && c.nextAvailableAt && c.status !== "maintenance")
      .map((c) => new Date(c.nextAvailableAt!).getTime())
      .sort((a, b) => a - b);

    if (occupiedComputers.length === 0) return "Soon";

    // Get the Nth computer that will be free (based on queue position)
    const targetIndex = Math.min(position.position - 1, occupiedComputers.length - 1);
    const targetTime = occupiedComputers[targetIndex];
    const now = Date.now();
    const waitMinutes = Math.max(0, Math.round((targetTime - now) / 60000));

    if (waitMinutes < 1) return "< 1 min";
    if (waitMinutes < 60) return `~${waitMinutes} min`;
    const hours = Math.floor(waitMinutes / 60);
    const mins = waitMinutes % 60;
    return `~${hours}h ${mins}m`;
  };

  // Get next available time for display
  const getNextFreeTime = () => {
    const nextFree = computers
      .filter((c) => c.isOccupied && c.nextAvailableAt && c.status !== "maintenance")
      .map((c) => ({ name: c.name, time: new Date(c.nextAvailableAt!) }))
      .sort((a, b) => a.time.getTime() - b.time.getTime())[0];

    if (!nextFree) return null;
    return nextFree;
  };

  const nextFree = getNextFreeTime();

  if (!position) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join the Queue</CardTitle>
          <CardDescription>
            No computers available? Join the queue to be notified when one opens up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Available computers:</span>
            <Badge variant={availableCount > 0 ? "default" : "secondary"}>
              {availableCount} / {computers.length}
            </Badge>
          </div>

          {availableCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              Computers are available! You can book one directly.
            </p>
          ) : (
            <>
              {nextFree && (
                <p className="text-sm text-muted-foreground">
                  Next available: <strong>{nextFree.name}</strong> at{" "}
                  {nextFree.time.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <Button onClick={handleJoin} disabled={isLoading} className="w-full">
                {isLoading ? "Joining..." : "Join Queue"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Queue Position</CardTitle>
        <CardDescription>
          You&apos;ll be notified when a computer becomes available
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center py-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary">
              #{position.position}
            </div>
            <p className="text-muted-foreground mt-2">
              of {position.totalInQueue} in queue
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge
              variant={position.status === "ready" || position.status === "called" ? "default" : "secondary"}
            >
              {position.status === "waiting"
                ? "Waiting"
                : position.status === "ready"
                ? "Ready!"
                : position.status === "called"
                ? "Called!"
                : position.status}
            </Badge>
          </div>

          {position.estimatedWaitTime && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated wait:</span>
              <span>{position.estimatedWaitTime} minutes</span>
            </div>
          )}

          {!position.estimatedWaitTime && getEstimatedWaitTime() && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated wait:</span>
              <span>{getEstimatedWaitTime()}</span>
            </div>
          )}

          {nextFree && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next free:</span>
              <span>
                {nextFree.name} at{" "}
                {nextFree.time.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          onClick={handleLeave}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Leaving..." : "Leave Queue"}
        </Button>
      </CardContent>
    </Card>
  );
}
