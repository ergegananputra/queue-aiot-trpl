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

      toast.success("Reservation created successfully!");
      router.push("/dashboard/my-session");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create reservation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
                      {computer.isOccupied && (
                        <span className="text-xs text-muted-foreground">
                          (Currently occupied)
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
  );
}
