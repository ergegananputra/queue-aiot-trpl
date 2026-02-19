"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BookingForm } from "@/components/booking-form";
import type { ComputerStatus } from "@/types";

function BookPageContent() {
  const searchParams = useSearchParams();
  const computerId = searchParams.get("computer");
  const [computers, setComputers] = useState<ComputerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComputers = async () => {
      try {
        const response = await fetch("/api/computers");
        if (response.ok) {
          const data = await response.json();
          setComputers(data.computers);
        }
      } catch (error) {
        console.error("Error fetching computers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComputers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Book a Computer</h1>
        <p className="text-muted-foreground">
          Reserve a workstation for your training session
        </p>
      </div>

      <BookingForm
        computers={computers}
        selectedComputerId={computerId || undefined}
      />
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
