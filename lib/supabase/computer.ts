import { createClient } from "@/lib/supabase/server";


export async function getComputerByIdAndAccessCode(id: string, access_code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("computers")
    .select("*")
    .eq("id", id)
    .eq("access_code", access_code)
    .single();
  if (error || !data) return null;
  return data;
}


export async function getComputerBookings(id: string) {
  const supabase = await createClient();
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);

  // Ambil data komputer
  const { data: computer } = await supabase
    .from("computers")
    .select("status, current_user_id")
    .eq("id", id)
    .single();

  // Ambil semua reservation yang mungkin aktif
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, user:profiles(id, name, email)")
    .eq("computer_id", id)
    .order("start_time", { ascending: false });

  // Tentukan currentBooking: reservation dengan status 'active' ATAU waktu sekarang di antara start_time-end_time
  let currentBooking = null;
  if (reservations && reservations.length > 0) {
    currentBooking = reservations.find(r =>
      (r.status === "active") ||
      (new Date(r.start_time) <= now && new Date(r.end_time) > now)
    ) || null;
  }

  // History 1 bulan terakhir: status 'completed', end_time dalam 1 bulan terakhir
  const historyBookings = (reservations || []).filter(r =>
    r.status === "completed" &&
    new Date(r.end_time) >= oneMonthAgo &&
    new Date(r.end_time) < now
  );

  // Upcoming: status 'pending' atau 'active', start_time > sekarang
  const upcomingBookings = (reservations || []).filter(r =>
    ["pending", "active"].includes(r.status) &&
    new Date(r.start_time) > now
  ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return {
    currentBooking,
    historyBookings,
    upcomingBookings,
  };
}
