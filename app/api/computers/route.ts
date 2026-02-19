import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { ComputerStatus } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Get all computers
    const { data: allComputers, error: computersError } = await supabase
      .from("computers")
      .select("*")
      .order("name");

    if (computersError) throw computersError;

    // Get active reservations for each computer
    const computersWithStatus: ComputerStatus[] = await Promise.all(
      (allComputers ?? []).map(async (computer) => {
        // Find current active reservation
        const { data: activeReservations } = await supabase
          .from("reservations")
          .select("*")
          .eq("computer_id", computer.id)
          .lte("start_time", now)
          .gte("end_time", now)
          .in("status", ["active", "pending"])
          .limit(1);

        // Find next reservation
        const { data: nextReservations } = await supabase
          .from("reservations")
          .select("*")
          .eq("computer_id", computer.id)
          .gte("start_time", now)
          .in("status", ["pending", "active"])
          .order("start_time")
          .limit(1);

        const currentReservation = activeReservations?.[0] || null;
        const isOccupied = !!currentReservation || computer.status === "maintenance";

        return {
          ...computer,
          currentReservation,
          isOccupied,
          nextAvailableAt: currentReservation
            ? currentReservation.end_time
            : nextReservations?.[0]?.start_time || null,
        };
      })
    );

    return NextResponse.json({ computers: computersWithStatus });
  } catch (error) {
    console.error("Error fetching computers:", error);
    return NextResponse.json(
      { error: "Failed to fetch computers" },
      { status: 500 }
    );
  }
}
