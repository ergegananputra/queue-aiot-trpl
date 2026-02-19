import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Get queue status
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all waiting queue entries
    const { data: queueEntries, error } = await supabase
      .from("queue")
      .select(`
        *,
        user:profiles(id, name, email),
        computer:computers(*)
      `)
      .eq("status", "waiting")
      .order("position");

    if (error) throw error;

    // Get user's position if they're in queue
    const userEntry = queueEntries?.find((e) => e.user_id === user.id);

    return NextResponse.json({
      queue: queueEntries?.map((e) => ({
        ...e,
        user: e.user,
        preferredComputer: e.computer,
      })) ?? [],
      userPosition: userEntry
        ? {
            position: userEntry.position,
            totalInQueue: queueEntries?.length ?? 0,
            status: userEntry.status,
            joinedAt: userEntry.joined_at,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}

// POST - Join queue
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { computerId } = body;

    // Check if user is already in queue
    const { data: existingEntry } = await supabase
      .from("queue")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "waiting")
      .limit(1);

    if (existingEntry && existingEntry.length > 0) {
      return NextResponse.json(
        { error: "You are already in the queue" },
        { status: 400 }
      );
    }

    // Get the current max position
    const { data: maxPositionData } = await supabase
      .from("queue")
      .select("position")
      .eq("status", "waiting")
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = (maxPositionData?.[0]?.position || 0) + 1;

    // Validate preferred computer if provided
    if (computerId) {
      const { data: computer } = await supabase
        .from("computers")
        .select("*")
        .eq("id", computerId)
        .single();

      if (!computer) {
        return NextResponse.json(
          { error: "Preferred computer not found" },
          { status: 400 }
        );
      }
    }

    // Add to queue
    const { data: newEntry, error: insertError } = await supabase
      .from("queue")
      .insert({
        user_id: user.id,
        position: nextPosition,
        computer_id: computerId || null,
        status: "waiting",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(
      {
        queueEntry: newEntry,
        position: nextPosition,
        message: `You are now #${nextPosition} in the queue`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error joining queue:", error);
    return NextResponse.json({ error: "Failed to join queue" }, { status: 500 });
  }
}

// DELETE - Leave queue
export async function DELETE() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's queue entry
    const { data: entry } = await supabase
      .from("queue")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "waiting")
      .limit(1);

    if (!entry || entry.length === 0) {
      return NextResponse.json(
        { error: "You are not in the queue" },
        { status: 400 }
      );
    }

    // Delete the entry
    const { error: deleteError } = await supabase
      .from("queue")
      .delete()
      .eq("id", entry[0].id);

    if (deleteError) throw deleteError;

    // Reorder positions for remaining entries
    const { data: remainingEntries } = await supabase
      .from("queue")
      .select("*")
      .eq("status", "waiting")
      .order("position");

    // Update positions
    if (remainingEntries) {
      for (let i = 0; i < remainingEntries.length; i++) {
        await supabase
          .from("queue")
          .update({ position: i + 1 })
          .eq("id", remainingEntries[i].id);
      }
    }

    return NextResponse.json({ message: "Left the queue successfully" });
  } catch (error) {
    console.error("Error leaving queue:", error);
    return NextResponse.json({ error: "Failed to leave queue" }, { status: 500 });
  }
}
