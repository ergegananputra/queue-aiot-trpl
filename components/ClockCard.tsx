"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatJakarta } from "@/lib/date-tz-format";
import { useEffect, useState } from "react";

export default function ClockCard() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);
    return (
        <Card className="border-white-300 bg-white-50 dark:bg-white-950/30 h-full flex items-center justify-center">
            <CardContent className="flex flex-col items-center justify-center py-4">
                <div className="text-3xl font-bold">
                    {formatJakarta(now, "HH:mm:ss")}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                    {formatJakarta(now, "PPP")}
                </div>
            </CardContent>
        </Card>
    );
}
