"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ActiveSession } from "@/components/active-session";
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
import { Button } from "@/components/ui/button";
import type { ReservationWithRelations } from "@/types";

export default function MySessionPage() {
  const router = useRouter();
  const [activeReservations, setActiveReservations] = useState<
    ReservationWithRelations[]
  >([]);
  const [pastReservations, setPastReservations] = useState<
    ReservationWithRelations[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      const response = await fetch("/api/reservations");
      if (response.ok) {
        const data = await response.json();
        const reservations = data.reservations as ReservationWithRelations[];

        // Separate active/pending from past
        const active = reservations.filter(
          (r) => r.status === "active" || r.status === "pending"
        );
        const past = reservations.filter(
          (r) => r.status !== "active" && r.status !== "pending"
        );

        setActiveReservations(active);
        setPastReservations(past);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "released":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDateTime = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy 'at' HH:mm");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Session</h1>
          <p className="text-muted-foreground">
            Manage your current and past reservations
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/book")}>
          New Booking
        </Button>
      </div>

      {/* Active Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Active Reservations ({activeReservations.length})
        </h2>
        {activeReservations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No active reservations. Book a computer to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeReservations.map((reservation) => (
              <ActiveSession key={reservation.id} reservation={reservation} />
            ))}
          </div>
        )}
      </div>

      {/* Past Reservations */}
      <Card>
        <CardHeader>
          <CardTitle>Reservation History</CardTitle>
          <CardDescription>Your past computer reservations</CardDescription>
        </CardHeader>
        <CardContent>
          {pastReservations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No past reservations
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Computer</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      {reservation.computer?.name ||
                        `Computer #${reservation.computer_id}`}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(reservation.start_time)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(reservation.end_time)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(reservation.status)}>
                        {reservation.status}
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
  );
}
