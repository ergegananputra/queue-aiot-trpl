import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BookingHistoryTableProps {
  bookings: any[];
}

export default function BookingHistoryTable({ bookings }: BookingHistoryTableProps) {
  if (!bookings.length) return <div className="text-muted-foreground">Tidak ada history pemakaian.</div>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Mulai</TableHead>
          <TableHead>Selesai</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => (
          <TableRow key={b.id}>
            <TableCell>{b.user?.name || b.user?.email || b.user_id}</TableCell>
            <TableCell>{new Date(b.start_time).toLocaleString("id-ID")}</TableCell>
            <TableCell>{new Date(b.end_time).toLocaleString("id-ID")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
