import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List user's reservations or all (for admin)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const computerId = searchParams.get("computerId");
    const status = searchParams.get("status");
    const all = searchParams.get("all") === "true";

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("reservations")
      .select(`
        *,
        computer:computers(*),
        user:profiles(id, name, email)
      `)
      .order("start_time", { ascending: false });

    // Non-admin users can only see their own reservations
    if (!all || profile?.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    if (computerId) {
      query = query.eq("computer_id", computerId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: reservations, error } = await query;

    if (error) throw error;

    return NextResponse.json({ reservations: reservations ?? [] });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

// POST - Create a new reservation
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { computerId, notes, startTime, endTime } = body;

    // Validate required fields
    if (!computerId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: computerId, startTime, endTime" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate dates
    if (start >= end) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: "Cannot book in the past" },
        { status: 400 }
      );
    }

    // Check if computer exists and is available
    const { data: computer } = await supabase
      .from("computers")
      .select("*")
      .eq("id", computerId)
      .single();

    if (!computer) {
      return NextResponse.json({ error: "Computer not found" }, { status: 404 });
    }

    if (computer.status === "maintenance") {
      return NextResponse.json(
        { error: "Computer is under maintenance" },
        { status: 400 }
      );
    }

    // Check for overlapping reservations
    const { data: overlapping } = await supabase
      .from("reservations")
      .select("*")
      .eq("computer_id", computerId)
      .lt("start_time", end.toISOString())
      .gt("end_time", start.toISOString())
      .in("status", ["pending", "active"]);

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        {
          error: "Time slot conflicts with existing reservation",
          conflictingReservation: {
            startTime: overlapping[0].start_time,
            endTime: overlapping[0].end_time,
          },
        },
        { status: 409 }
      );
    }

    // Check if user already has an active reservation
    const now = new Date().toISOString();
    const { data: userActiveReservation } = await supabase
      .from("reservations")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["pending", "active"])
      .gte("end_time", now)
      .limit(1);

    if (userActiveReservation && userActiveReservation.length > 0) {
      return NextResponse.json(
        {
          error: "You already have an active or pending reservation. Please complete or cancel it first.",
        },
        { status: 400 }
      );
    }

    // Create reservation
    const { data: newReservation, error: insertError } = await supabase
      .from("reservations")
      .insert({
        user_id: user.id,
        computer_id: computerId,
        notes: notes || null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: start <= new Date() ? "active" : "pending",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ reservation: newReservation }, { status: 201 });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
