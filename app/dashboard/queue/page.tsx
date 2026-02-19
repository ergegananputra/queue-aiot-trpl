"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import type { ComputerStatus } from "@/types";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

interface UpcomingReservation {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: string;
  computer: { id: string; name: string };
  user: { name: string | null; email: string };
}

export default function QueuePage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const [computers, setComputers] = useState<ComputerStatus[]>([]);
  const [upcomingReservations, setUpcomingReservations] = useState<UpcomingReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase.auth]);

  const fetchData = async () => {
    try {
      const [computersRes, reservationsRes] = await Promise.all([
        fetch("/api/computers"),
        fetch("/api/reservations?upcoming=true"),
      ]);

      if (computersRes.ok) {
        const data = await computersRes.json();
        setComputers(data.computers);
      }

      if (reservationsRes.ok) {
        const data = await reservationsRes.json();
        setUpcomingReservations(data.reservations);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (date: string) => {
    return format(new Date(date), "MMM d, HH:mm");
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

  // Group reservations by computer
  const reservationsByComputer = computers.map((computer) => {
    const computerReservations = upcomingReservations
      .filter((r) => r.computer?.id === computer.id)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    return {
      computer,
      reservations: computerReservations,
      currentReservation: computerReservations.find((r) => r.status === "active"),
      nextReservation: computerReservations.find((r) => r.status === "pending"),
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Computer Status & Schedule</h1>
          <p className="text-muted-foreground">
            See who&apos;s using the computers and upcoming bookings
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/book">Book a Computer</Link>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            <p className="text-xs text-muted-foreground">of {computers.length} computers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Currently In Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {computers.filter((c) => c.isOccupied && c.status !== "maintenance").length}
            </div>
            <p className="text-xs text-muted-foreground">computers occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingReservations.length}</div>
            <p className="text-xs text-muted-foreground">scheduled reservations</p>
          </CardContent>
        </Card>
      </div>

      {/* Computer Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reservationsByComputer.map(({ computer, currentReservation, nextReservation, reservations }) => (
          <Card key={computer.id} className={computer.isOccupied ? "border-orange-200" : "border-green-200"}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{computer.name}</CardTitle>
                <Badge
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
                  {computer.status === "maintenance"
                    ? "Maintenance"
                    : computer.isOccupied
                    ? "In Use"
                    : "Available"}
                </Badge>
              </div>
              {computer.description && (
                <CardDescription>{computer.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {currentReservation && (
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                  <div className="text-xs text-muted-foreground mb-1">Currently using:</div>
                  <div className="font-medium text-sm">
                    {currentReservation.user?.email}
                    {/* {currentReservation.user?.name || "Anonymous"} */}
                  </div>
                  {/* <div className="text-xs text-muted-foreground">
                    {currentReservation.user?.email}
                  </div> */}
                  <div className="text-xs mt-1">
                    Until {formatDateTime(currentReservation.end_time)}
                  </div>
                </div>
              )}

              {nextReservation && !currentReservation && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-muted-foreground mb-1">Next booking:</div>
                  <div className="font-medium text-sm">
                    {nextReservation.user?.email || "Anonymous"}
                  </div>
                  <div className="text-xs">
                    {formatDateTime(nextReservation.start_time)} - {formatDateTime(nextReservation.end_time)}
                  </div>
                </div>
              )}

              {reservations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No upcoming bookings
                </p>
              )}

              {reservations.length > 1 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    {reservations.length - 1} more booking{reservations.length > 2 ? "s" : ""}
                  </summary>
                  <div className="mt-2 space-y-2">
                    {reservations.slice(1).map((res) => (
                      <div key={res.id} className="text-xs p-2 rounded bg-muted">
                        <div className="font-medium">{res.user?.email || "Anonymous"}</div>
                        <div className="text-muted-foreground">
                          {formatDateTime(res.start_time)} - {formatDateTime(res.end_time)}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {!computer.isOccupied && computer.status !== "maintenance" && (
                <Button asChild size="sm" className="w-full">
                  <Link href={`/dashboard/book?computer=${computer.id}`}>
                    Book Now
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Upcoming Bookings</CardTitle>
          <CardDescription>
            Complete schedule of reservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingReservations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming bookings. All computers are available!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Computer</TableHead>
                  <TableHead>Booked By</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingReservations
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .map((reservation) => (
                    <TableRow
                      key={reservation.id}
                      className={reservation.user_id === user?.id ? "bg-primary/5" : ""}
                    >
                      <TableCell className="font-medium">
                        {reservation.computer?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            {reservation.user?.email || "Anonymous"}
                            {reservation.user_id === user?.id && (
                              <Badge variant="outline">You</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(reservation.start_time)}</TableCell>
                      <TableCell>{formatDateTime(reservation.end_time)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={reservation.status === "active" ? "default" : "secondary"}
                        >
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
