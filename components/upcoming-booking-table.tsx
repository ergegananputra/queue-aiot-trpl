import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UpcomingBookingTableProps {
  bookings: any[];
}

export default function UpcomingBookingTable({ bookings }: UpcomingBookingTableProps) {
  if (!bookings.length) return <div className="text-muted-foreground">Tidak ada upcoming booking.</div>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Mulai</TableHead>
          <TableHead>Selesai</TableHead>
          <TableHead>Catatan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => (
          <TableRow key={b.id}>
            <TableCell>{b.user?.name || b.user?.email || b.user_id}</TableCell>
            <TableCell>{new Date(b.start_time).toLocaleString("id-ID", { hour12: false, year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</TableCell>
            <TableCell>{new Date(b.end_time).toLocaleString("id-ID", { hour12: false, year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</TableCell>
            <TableCell>{b.notes || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
