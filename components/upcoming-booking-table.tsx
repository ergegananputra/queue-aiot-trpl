import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GLOBAL_DATE_FORMAT } from "@/lib/date-format";
import { format } from "date-fns";

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
            <TableCell>{format(new Date(b.start_time), GLOBAL_DATE_FORMAT)}</TableCell>
            <TableCell>{format(new Date(b.end_time), GLOBAL_DATE_FORMAT)}</TableCell>
            <TableCell>{b.notes || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
