import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH - Release reservation early
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Get the reservation
    const { data: reservation } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Check ownership (unless admin)
    if (reservation.user_id !== user.id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if reservation is active
    if (reservation.status !== "active" && reservation.status !== "pending") {
      return NextResponse.json(
        { error: "Only active or pending reservations can be released early" },
        { status: 400 }
      );
    }

    // Update reservation
    const { data: updated, error: updateError } = await supabase
      .from("reservations")
      .update({ status: "completed" })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Notify users in queue
    const { data: queueEntries } = await supabase
      .from("queue")
      .select("*")
      .eq("status", "waiting")
      .order("position")
      .limit(3);

    // Create notifications for queue users
    if (queueEntries) {
      for (const entry of queueEntries) {
        await supabase.from("notifications").insert({
          user_id: entry.user_id,
          type: "success",
          title: "Computer Available!",
          message: "A computer slot has been released. Book now before it's taken!",
        });
      }
    }

    return NextResponse.json({
      reservation: updated,
      message: "Reservation released successfully",
      notifiedUsers: queueEntries?.length ?? 0,
    });
  } catch (error) {
    console.error("Error releasing reservation:", error);
    return NextResponse.json(
      { error: "Failed to release reservation" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel reservation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Get the reservation
    const { data: reservation } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Check ownership (unless admin)
    if (reservation.user_id !== user.id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if reservation can be cancelled
    if (reservation.status === "completed" || reservation.status === "cancelled") {
      return NextResponse.json(
        { error: "Reservation is already completed or cancelled" },
        { status: 400 }
      );
    }

    // Update reservation status
    const { data: updated, error: updateError } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      reservation: updated,
      message: "Reservation cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return NextResponse.json(
      { error: "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}
