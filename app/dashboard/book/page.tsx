"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { BookingForm } from "@/components/booking-form";
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

interface UpcomingReservation {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  computer: { id: string; name: string };
  user: { name: string | null; email: string };
}

function BookPageContent() {
  const searchParams = useSearchParams();
  const computerId = searchParams.get("computer");
  const [computers, setComputers] = useState<ComputerStatus[]>([]);
  const [upcomingReservations, setUpcomingReservations] = useState<UpcomingReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), "MMM d, HH:mm");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Book a Computer</h1>
        <p className="text-muted-foreground">
          Reserve a workstation for your training session
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <BookingForm
            computers={computers}
            selectedComputerId={computerId || undefined}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>
              See scheduled reservations to find available times
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingReservations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No upcoming bookings. All computers are free!
              </p>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Computer</TableHead>
                      <TableHead>Booked By</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">
                          {reservation.computer?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {reservation.user?.email}
                            </div>
                            {/* <div className="text-muted-foreground text-xs">
                              {reservation.user?.email}
                            </div> */}
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(reservation.start_time)}</TableCell>
                        <TableCell>{formatDateTime(reservation.end_time)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              reservation.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {reservation.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <BookPageContent />
    </Suspense>
  );
}
