"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequestV2, getStoredAccessToken } from "@/lib/queryClient";
import { xpTypeLabel } from "@/lib/xpTags";
import AnalyticsBackground from "@/components/AnalyticsBackground";

type XpHistoryItem = {
  _id: string;
  address: string;
  username?: string;
  amount: number;
  status: "success" | "failed";
  type: string;
  timestamp: string;
};

const MotionTableRow = motion(TableRow);

export default function XpHistory() {
  const [history, setHistory] = useState<XpHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { userXpHistory } = await apiRequestV2("GET", "/api/user/xp-history");
        const items: XpHistoryItem[] = userXpHistory ?? [];
        items.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setHistory(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return null;

  /*
  return (
    <div className="bg-black text-white relative min-h-full overflow-hidden">
      <AnalyticsBackground />
      <motion.div
        className="max-w-6xl mx-auto space-y-6 relative z-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-[40px] font-bold leading-tight">
            <span className="text-white">XP </span>
            <span className="bg-gradient-to-r from-[#c9b3ff] to-[#8b3efe] bg-clip-text text-transparent">
              History
            </span>
          </h1>
          <p className="text-sm font-semibold text-white/50">
            Track every XP reward you&apos;ve earned across the platform.
          </p>
        </div>

        <div className="rounded-[40px] border border-white/15 bg-[#0f0d22] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-[#00e5c0]" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 text-white/30">No XP history yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-[38px] border-white/10 bg-[#050318]/80 hover:bg-[#050318]/80 [&>th]:py-0">
                  <TableHead className="px-6 text-[12px] font-bold uppercase tracking-wider text-white/50">
                    XP earned
                  </TableHead>
                  <TableHead className="px-6 text-[12px] font-bold uppercase tracking-wider text-white/50">
                    Category
                  </TableHead>
                  <TableHead className="px-6 text-[12px] font-bold uppercase tracking-wider text-white/50">
                    Status
                  </TableHead>
                  <TableHead className="px-6 text-[12px] font-bold uppercase tracking-wider text-white/50 text-right">
                    Date &amp; time
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item, index) => (
                  <MotionTableRow
                    key={item._id}
                    className="h-[44px] border-white/10 hover:bg-white/[0.03] [&>td]:py-1.5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.4) }}
                  >
                    <TableCell
                      className={`px-6 text-base font-bold ${
                        item.amount < 0 ? "text-[#ff4d6d]" : "text-[#00e5c0]"
                      }`}
                    >
                      {item.amount < 0 ? "" : "+"}
                      {item.amount.toLocaleString()} XP
                    </TableCell>
                    <TableCell className="px-6">
                      <span className="inline-flex items-center rounded-full border border-[#8b3efe] bg-[#8b3efe]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#8b3efe]">
                        {xpTypeLabel(item.type)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6">
                      {item.status === "success" ? (
                        <span className="text-sm font-bold text-[#00e5c0]">Success</span>
                      ) : (
                        <span className="text-sm font-bold text-red-400">Failed</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      <div className="text-sm font-semibold text-white/70">
                        {new Date(item.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs font-medium text-white/30">
                        {new Date(item.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                          hour12: true,
                        })}{" "}
                        (UTC)
                      </div>
                    </TableCell>
                  </MotionTableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>
    </div>
  );
  */
}
