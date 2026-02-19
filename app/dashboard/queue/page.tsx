"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QueueStatus } from "@/components/queue-status";
import { useQueueStream } from "@/hooks/use-queue-stream";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ComputerStatus, QueuePosition, QueueEntryWithRelations } from "@/types";
import type { User } from "@supabase/supabase-js";

export default function QueuePage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const [computers, setComputers] = useState<ComputerStatus[]>([]);
  const [queuePosition, setQueuePosition] = useState<QueuePosition | null>(null);
  const [queueList, setQueueList] = useState<QueueEntryWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase.auth]);

  const stream = useQueueStream({
    enabled: !!user,
    onNotification: (notification) => {
      toast.info(notification.title, {
        description: notification.message,
      });
    },
  });

  const fetchData = async () => {
    try {
      const [computersRes, queueRes] = await Promise.all([
        fetch("/api/computers"),
        fetch("/api/queue"),
      ]);

      if (computersRes.ok) {
        const data = await computersRes.json();
        setComputers(data.computers);
      }

      if (queueRes.ok) {
        const data = await queueRes.json();
        setQueuePosition(data.userPosition);
        setQueueList(data.queue);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (stream.data?.queuePosition) {
      setQueuePosition(stream.data.queuePosition);
    }
  }, [stream.data?.queuePosition]);

  const handleJoinQueue = async (preferredComputerId?: string) => {
    const response = await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ computerId: preferredComputerId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error);
    }

    const data = await response.json();
    setQueuePosition({
      position: data.position,
      totalInQueue: data.position,
      status: "waiting",
    });
    fetchData();
  };

  const handleLeaveQueue = async () => {
    const response = await fetch("/api/queue", { method: "DELETE" });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error);
    }

    setQueuePosition(null);
    fetchData();
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleString("id-ID", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const availableCount = computers.filter(
    (c) => !c.isOccupied && c.status !== "maintenance"
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Queue</h1>
        <p className="text-muted-foreground">
          Wait for a computer to become available
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Computer Availability</CardTitle>
              <CardDescription>
                {availableCount} of {computers.length} computers available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {computers.map((computer) => (
                  <Badge
                    key={computer.id}
                    variant={
                      computer.status === "maintenance"
                        ? "outline"
                        : computer.isOccupied
                        ? "secondary"
                        : "default"
                    }
                    className={
                      !computer.isOccupied && computer.status !== "maintenance"
                        ? "bg-green-600"
                        : ""
                    }
                  >
                    {computer.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Queue List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Queue</CardTitle>
              <CardDescription>
                {queueList.length} {queueList.length === 1 ? "person" : "people"}{" "}
                waiting
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queueList.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No one in queue
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Preferred</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queueList.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className={
                          entry.user_id === user?.id
                            ? "bg-primary/5"
                            : ""
                        }
                      >
                        <TableCell className="font-bold">
                          {entry.position}
                        </TableCell>
                        <TableCell>
                          {entry.user?.name || "Anonymous"}
                          {entry.user_id === user?.id && (
                            <Badge variant="outline" className="ml-2">
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.preferredComputer?.name || "Any"}
                        </TableCell>
                        <TableCell>{formatTime(entry.joined_at)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.status === "ready"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <QueueStatus
            position={queuePosition}
            computers={computers}
            onJoin={handleJoinQueue}
            onLeave={handleLeaveQueue}
          />
        </div>
      </div>
    </div>
  );
}
