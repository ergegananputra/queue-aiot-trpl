"use client";
import { useState } from "react";
import BookingHistoryTable from "@/components/booking-history-table";

export default function CollapsibleHistory({ bookings }: { bookings: any[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-8">
      <button
        className="flex items-center gap-2 text-lg font-semibold mb-2 focus:outline-none hover:underline"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "▼" : "►"} History Pemakaian (1 Bulan Terakhir)
      </button>
      {open && <BookingHistoryTable bookings={bookings} />}
    </section>
  );
}