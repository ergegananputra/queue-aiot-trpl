"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface QueueEntry {
  id: string;
  user_id: string;
  position: number;
  status: string;
  joined_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface Computer {
  id: string;
  name: string;
  status: string;
}

interface StreamData {
  queuePosition: {
    position: number;
    totalInQueue: number;
    status: "waiting" | "ready" | "called" | "expired";
    joinedAt: string;
  } | null;
  notifications: Notification[];
  computers: Computer[];
}

interface UseQueueStreamOptions {
  enabled?: boolean;
  onNotification?: (notification: Notification) => void;
}

export function useQueueStream(options: UseQueueStreamOptions = {}) {
  const { enabled = true, onNotification } = options;
  const [data, setData] = useState<StreamData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchInitialData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch queue entries
      const { data: queueEntries } = await supabase
        .from("queue")
        .select("*")
        .eq("status", "waiting")
        .order("position");

      const userEntry = queueEntries?.find(e => e.user_id === user.id);

      // Fetch notifications
      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch computers
      const { data: computers } = await supabase
        .from("computers")
        .select("*")
        .order("name");

      setData({
        queuePosition: userEntry ? {
          position: userEntry.position,
          totalInQueue: queueEntries?.length ?? 0,
          status: userEntry.status,
          joinedAt: userEntry.joined_at,
        } : null,
        notifications: notifications ?? [],
        computers: computers ?? [],
      });

      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load data");
    }
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;

    let channels: RealtimeChannel[] = [];

    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Initial data fetch
      await fetchInitialData();

      // Subscribe to queue changes
      const queueChannel = supabase
        .channel("queue-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "queue" },
          () => {
            fetchInitialData();
          }
        )
        .subscribe();
      channels.push(queueChannel);

      // Subscribe to computer changes
      const computersChannel = supabase
        .channel("computers-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "computers" },
          () => {
            fetchInitialData();
          }
        )
        .subscribe();
      channels.push(computersChannel);

      // Subscribe to notifications for this user
      const notificationsChannel = supabase
        .channel("notifications-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            if (onNotification) {
              onNotification(newNotification);
            }
            fetchInitialData();
          }
        )
        .subscribe();
      channels.push(notificationsChannel);

      // Subscribe to reservation changes
      const reservationsChannel = supabase
        .channel("reservations-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reservations" },
          () => {
            fetchInitialData();
          }
        )
        .subscribe();
      channels.push(reservationsChannel);
    };

    setupSubscriptions();

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [enabled, supabase, fetchInitialData, onNotification]);

  const refetch = useCallback(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    data,
    isConnected,
    error,
    refetch,
  };
}
