"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, RefreshCw, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AnimatedBackground from "@/components/AnimatedBackground";
import { apiRequestV2, getStoredAccessToken } from "@/lib/queryClient";
import { xpTypeLabel } from "@/lib/xpTags";

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

  return (
    <div className="bg-black text-white relative">
      <AnimatedBackground />

      <motion.div
        className="max-w-5xl mx-auto space-y-8 relative z-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            <span className="text-white">XP </span>
            <span className="bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              History
            </span>
          </h1>
          <p className="text-sm text-white/50">
            Track every XP reward you&apos;ve earned across the platform.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 text-white/30">No XP history yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider text-white/40">
                    XP Earned
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-white/40">
                    Category
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-white/40">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-white/40 text-right">
                    Date &amp; Time
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item, index) => (
                  <MotionTableRow
                    key={item._id}
                    className="border-white/5 hover:bg-white/5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.4) }}
                  >
                    <TableCell className="font-bold text-cyan-400">
                      +{item.amount.toLocaleString()} XP
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border border-purple-400/40 bg-purple-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                        {xpTypeLabel(item.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.status === "success" ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <Check className="w-4 h-4" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-500">
                          <X className="w-4 h-4" />
                          Failed
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        {new Date(item.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-white/50">
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
}
