import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { GLOBAL_DATE_FORMAT } from "@/lib/date-format";

interface ComputerStatusProps {
  currentBooking: any | null;
}

export default function ComputerStatus({ currentBooking }: ComputerStatusProps) {
  const isActive = !!currentBooking;
  return (
    <div className="flex items-center gap-2">
      <span>Status:</span>
      <Badge variant={isActive ? "destructive" : "default"}>
        {isActive ? "Sedang Dipakai" : "Tersedia"}
      </Badge>
      {isActive && (
        <>
          <span className="ml-2 text-sm text-muted-foreground">
            Pengguna: {currentBooking.user?.name || currentBooking.user?.email || currentBooking.user_id}
          </span>
          <span className="ml-2 text-sm text-muted-foreground">
            Sampai: {format(new Date(currentBooking.end_time), GLOBAL_DATE_FORMAT)}
          </span>
        </>
      )}
    </div>
  );
}
