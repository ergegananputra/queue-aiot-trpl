"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ComputerGrid } from "@/components/computer-grid";
import { QueueStatus } from "@/components/queue-status";
import { ActiveSession } from "@/components/active-session";
import { useQueueStream } from "@/hooks/use-queue-stream";
import { toast } from "sonner";
import type { ComputerStatus, ReservationWithRelations, QueuePosition } from "@/types";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const [computers, setComputers] = useState<ComputerStatus[]>([]);
  const [myReservation, setMyReservation] = useState<ReservationWithRelations | null>(null);
  const [queuePosition, setQueuePosition] = useState<QueuePosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase.auth]);

  // Real-time updates via Supabase
  const stream = useQueueStream({
    enabled: !!user,
    onNotification: (notification) => {
      toast.info(notification.title, {
        description: notification.message,
      });
    },
  });

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [computersRes, reservationsRes, queueRes] = await Promise.all([
        fetch("/api/computers"),
        fetch("/api/reservations"),
        fetch("/api/queue"),
      ]);

      if (computersRes.ok) {
        const data = await computersRes.json();
        setComputers(data.computers);
      }

      if (reservationsRes.ok) {
        const data = await reservationsRes.json();
        // Find active or pending reservation
        const activeRes = data.reservations.find(
          (r: ReservationWithRelations) =>
            r.status === "active" || r.status === "pending"
        );
        setMyReservation(activeRes || null);
      }

      if (queueRes.ok) {
        const data = await queueRes.json();
        setQueuePosition(data.userPosition);
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

  // Update queue position from stream
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
  };

  const handleLeaveQueue = async () => {
    const response = await fetch("/api/queue", { method: "DELETE" });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error);
    }

    setQueuePosition(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.email}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ComputerGrid computers={computers} onRefresh={fetchData} />
        </div>
        <div className="space-y-6">
          <ActiveSession reservation={myReservation} />
          {!myReservation && (
            <QueueStatus
              position={queuePosition}
              computers={computers}
              onJoin={handleJoinQueue}
              onLeave={handleLeaveQueue}
            />
          )}
        </div>
      </div>

      {stream.error && (
        <div className="text-sm text-yellow-600 dark:text-yellow-400">
          {stream.error}
        </div>
      )}
    </div>
  );
}
