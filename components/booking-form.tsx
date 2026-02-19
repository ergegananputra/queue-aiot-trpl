"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ComputerStatus } from "@/types";

interface BookingFormProps {
  computers: ComputerStatus[];
  selectedComputerId?: string;
}

export function BookingForm({ computers, selectedComputerId }: BookingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    computerId: selectedComputerId || "",
    notes: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  const availableComputers = computers.filter(
    (c) => c.status !== "maintenance"
  );

  // Set default start time to now
  const now = new Date();
  const defaultStartDate = format(now, "yyyy-MM-dd");
  const defaultStartTime = format(now, "HH:mm");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use actual values or defaults
      const actualStartDate = formData.startDate || defaultStartDate;
      const actualStartTime = formData.startTime || defaultStartTime;
      
      // Combine date and time
      const startTime = new Date(`${actualStartDate}T${actualStartTime}`);
      const endTime = new Date(`${formData.endDate}T${formData.endTime}`);

      if (startTime >= endTime) {
        toast.error("End time must be after start time");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          computerId: formData.computerId,
          notes: formData.notes || undefined,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create reservation");
      }

      toast.success("Reservation created! You can book another or view your sessions.", {
        action: {
          label: "View Sessions",
          onClick: () => router.push("/dashboard/my-session"),
        },
      });
      
      // Reset form for another booking
      setFormData({
        computerId: "",
        notes: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create reservation");
    } finally {
      setIsLoading(false);
    }
  };

  const availableNow = availableComputers.filter(c => !c.isOccupied);
  const occupiedComputers = availableComputers.filter(c => c.isOccupied && c.nextAvailableAt);

  return (
    <>
      {/* Availability Summary */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Computer Availability</CardTitle>
          <CardDescription>
            {availableNow.length} available now, {occupiedComputers.length} occupied
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {availableNow.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableNow.map((c) => (
                  <span key={c.id} className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {c.name} - Available
                  </span>
                ))}
              </div>
            )}
            {occupiedComputers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {occupiedComputers.map((c) => (
                  <span key={c.id} className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {c.name} - Free at {format(new Date(c.nextAvailableAt!), "MMM d, HH:mm")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Book a Computer</CardTitle>
          <CardDescription>
            Reserve a computer for your training session. You can book for any duration.
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="computer">Select Computer</Label>
            <Select
              value={formData.computerId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, computerId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a computer" />
              </SelectTrigger>
              <SelectContent>
                {availableComputers.map((computer) => (
                  <SelectItem key={computer.id} value={computer.id}>
                    <div className="flex items-center gap-2">
                      <span>{computer.name}</span>
                      {computer.isOccupied ? (
                        <span className="text-xs text-muted-foreground">
                          (Free at {computer.nextAvailableAt 
                            ? format(new Date(computer.nextAvailableAt), "MMM d, HH:mm")
                            : "unknown"})
                        </span>
                      ) : (
                        <span className="text-xs text-green-600">
                          (Available now)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Brief description of your work"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate || defaultStartDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                min={defaultStartDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.startTime || defaultStartTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                min={formData.startDate || defaultStartDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Note: If you finish early, you can release the remaining time for other users.
          </p>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Reservation"}
          </Button>
        </form>
      </CardContent>
    </Card>
    </>
  );
}
