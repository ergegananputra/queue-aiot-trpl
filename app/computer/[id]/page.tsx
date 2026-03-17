import { notFound } from "next/navigation";
import { getComputerByIdAndAccessCode, getComputerBookings } from "@/lib/supabase/computer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarCheck2 } from "lucide-react";
import BookingHistoryTable from "@/components/booking-history-table";
import UpcomingBookingTable from "@/components/upcoming-booking-table";
import { formatJakarta } from "@/lib/date-tz-format";
import { GLOBAL_DATE_FORMAT } from "@/lib/date-format";
import ClockCard from "@/components/ClockCard";

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
    <main className="max-w-5xl mx-auto py-8 px-4">
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="col-span-3">
          <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/30 transition-shadow group-hover:shadow-lg group-active:shadow-md cursor-pointer h-full">
            <CardContent className="py-4 flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                <CalendarCheck2 size={24} />
              </div>
              <div className="flex-1">
                <div className="text-base font-medium mb-1">Ingin booking komputer?</div>
                <div className="text-sm text-muted-foreground mb-2">Klik di mana saja pada card ini atau tombol di bawah untuk melakukan booking komputer lab.</div>
                {/* Fallback hardcode text instruction to go the specific url */}
                <div className="text-xs text-muted-foreground mt-2">
                  kunjungi: <code className="bg-gray-100 px-1 py-0.5 rounded">{`https://queue.aiot.project-trpl.com/dashboard/book`}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <ClockCard />
        </div>
      </div>

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
                <span>{formatJakarta(currentBooking.start_time, GLOBAL_DATE_FORMAT)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Waktu Selesai:</span>
                <span>{formatJakarta(currentBooking.end_time, GLOBAL_DATE_FORMAT)}</span>
              </div>
              {currentBooking.notes && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Catatan:</span>
                  <span className="text-base text-muted-foreground">{currentBooking.notes}</span>
                </div>
              )}
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
