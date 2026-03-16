"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ReservationWithRelations } from "@/types";

interface ActiveSessionProps {
  reservation: ReservationWithRelations | null;
}

export function ActiveSession({ reservation }: ActiveSessionProps) {
  const router = useRouter();
  const [isReleasing, setIsReleasing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);

  if (!reservation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Session</CardTitle>
          <CardDescription>
            You don&apos;t have any active or upcoming reservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <a href="/dashboard/book">Book a Computer</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const startTime = new Date(reservation.start_time);
  const endTime = new Date(reservation.end_time);
  const isActive = startTime <= now && endTime > now;
  const isPending = startTime > now;

  const handleRelease = async () => {
    setIsReleasing(true);
    try {
      const response = await fetch(`/api/reservations/${reservation.id}/release`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to release reservation");
      }

      toast.success("Session released! The remaining time is now available for others.");
      setShowReleaseDialog(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to release session");
    } finally {
      setIsReleasing(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/reservations/${reservation.id}/release`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel reservation");
      }

      toast.success("Reservation cancelled");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel reservation");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reservation</CardTitle>
            <CardDescription>
              {reservation.computer?.name || `Computer #${reservation.computer_id}`}
            </CardDescription>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : isPending ? "Upcoming" : reservation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reservation.notes && (
          <p className="text-sm text-muted-foreground">{reservation.notes}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start:</span>
            <span>
              {format(startTime, "PPP 'at' p")}
              {isPending && (
                <span className="text-muted-foreground ml-1">
                  ({formatDistanceToNow(startTime, { addSuffix: true })})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">End:</span>
            <span>
              {format(endTime, "PPP 'at' p")}
              {isActive && (
                <span className="text-muted-foreground ml-1">
                  ({formatDistanceToNow(endTime, { addSuffix: true })})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span>
              {formatDistanceToNow(startTime, { includeSeconds: false })}
            </span>
          </div>
        </div>
        {/* Card instruksi penggunaan jika ada active reservation */}
        {(isActive || true) && (
          <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30">
            <CardHeader>
              <CardTitle>Instruksi Penggunaan Komputer Lab</CardTitle>
              <CardDescription>Petunjuk akses komputer secara langsung maupun remote</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 text-sm space-y-2">
                <li>
                  <span className="font-medium">Akses langsung di lab:</span> Silakan hadir ke laboratorium sesuai waktu reservasi dan gunakan komputer yang telah Anda booking.
                </li>
                <li>
                  <span className="font-medium">Akses remote via AnyDesk:</span>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Unduh dan instal aplikasi <span className="font-medium">AnyDesk</span> dari <a href="https://anydesk.com/id/downloads" target="_blank" rel="noopener" className="underline text-blue-600">anydesk.com/id/downloads</a>.</li>
                    <li>Buka aplikasi AnyDesk di perangkat Anda.</li>
                    {isActive ? (
                      <li>Masukkan ID AnyDesk: <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">{reservation.computer?.access_code}</span> pada kolom "Remote Desk".</li>
                    ) : (
                      <li>Kode AnyDesk akan diberikan di laman ini pada waktu reservasi Anda dimulai.</li>
                    )}
                    <li>Klik tombol <span className="font-medium">Connect</span> untuk memulai koneksi.</li>
                    <li>Jika diminta password, gunakan password lab seperti biasanya.</li>
                    <li>Pastikan koneksi internet Anda stabil selama sesi remote.</li>
                  </ul>
                </li>
              </ol>
              <div className="text-xs text-muted-foreground mt-2">
                Jika Anda belum mengetahui password akses, silakan menghubungi laboran atau dosen penanggung jawab untuk informasi lebih lanjut.
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex gap-2 pt-4">
          {isActive && (
            <Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
              <DialogTrigger asChild>
                <Button variant="default" className="flex-1">
                  Finish Early
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Finish Early?</DialogTitle>
                  <DialogDescription>
                    This will release the computer for other users. The remaining
                    time until {format(endTime, "PPP 'at' p")} will become available
                    for booking.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowReleaseDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleRelease} disabled={isReleasing}>
                    {isReleasing ? "Releasing..." : "Yes, Finish Early"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {isPending && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex-1"
            >
              {isCancelling ? "Cancelling..." : "Cancel Reservation"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
