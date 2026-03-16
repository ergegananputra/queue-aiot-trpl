import { notFound } from "next/navigation";
import { getComputerByIdAndAccessCode, getComputerBookings } from "@/lib/supabase/computer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";
import BookingHistoryTable from "@/components/booking-history-table";
import UpcomingBookingTable from "@/components/upcoming-booking-table";

interface ComputerPageProps {
  params: { id: string };
  searchParams: { access_code?: string };
}


export default async function ComputerPage(props: ComputerPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;
  const access_code = searchParams.access_code || "";

  // Validasi access_code dan ambil data komputer
  const computer = await getComputerByIdAndAccessCode(id, access_code);
  if (!computer) return notFound();

  // Ambil data booking (aktif, history, upcoming)
  const { currentBooking, historyBookings, upcomingBookings } = await getComputerBookings(id);

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">

      {/* Info booking: card kecil dengan icon dan button */}
      <Link href="/dashboard/book" className="block mb-8 group" tabIndex={-1} style={{ textDecoration: 'none' }}>
        <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30 transition-shadow group-hover:shadow-lg group-active:shadow-md cursor-pointer">
          <CardContent className="py-4 flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
              <CalendarCheck2 size={24} />
            </div>
            <div className="flex-1">
              <div className="text-base font-medium mb-1">Ingin booking komputer?</div>
              <div className="text-sm text-muted-foreground mb-2">Klik di mana saja pada card ini atau tombol di bawah untuk melakukan booking komputer lab.</div>
              <Button variant="primary" className="w-full sm:w-auto mt-1 pointer-events-none group-hover:ring-2 group-hover:ring-blue-300" tabIndex={-1} aria-hidden>
                Booking Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Card status pemakaian komputer - lebih menarik dan mudah dibedakan */}
      <Card
        className={`mb-8 border-2 ${currentBooking ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30" : "border-green-400 bg-green-50 dark:bg-green-950/30"}`}
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {computer.name}
            {currentBooking ? (
              <span className="inline-block px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold ml-2">Sedang Dipakai</span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full bg-green-600 text-white text-xs font-semibold ml-2">Tersedia</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentBooking ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Pengguna:</span>
                <span className="text-base">{currentBooking.user?.name || currentBooking.user?.email || currentBooking.user_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Waktu Mulai:</span>
                <span>{new Date(currentBooking.start_time).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Waktu Selesai:</span>
                <span>{new Date(currentBooking.end_time).toLocaleString("id-ID")}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <span className="text-base text-green-700">Komputer tersedia untuk digunakan</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tukar urutan: Upcoming Booking di bawah, History di atas */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Upcoming Booking</h2>
        <UpcomingBookingTable bookings={upcomingBookings} />
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">History Pemakaian (1 Bulan Terakhir)</h2>
        <BookingHistoryTable bookings={historyBookings} />
      </section>
    </main>
  );
}
