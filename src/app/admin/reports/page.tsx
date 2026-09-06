"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatMoney } from "@/lib/money";

type Report = {
  orderCount: number;
  revenueCents: number;
  avgTicketCents: number;
  byMethod: { cash: number; card: number; other: number };
  topItems: { name: string; qty: number; cents: number }[];
};

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    const res = await fetch(`/api/reports?date=${date}`);
    const data = await res.json();
    if (res.ok) setReport(data);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell title="营业报表">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="date"
          className="min-h-11 rounded-lg border border-black/15 bg-white px-3"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="button" className="min-h-11 rounded-lg bg-black/5 px-3" onClick={load}>
          查询
        </button>
      </div>

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["营收", formatMoney(report.revenueCents)],
              ["订单数", String(report.orderCount)],
              ["桌均", formatMoney(report.avgTicketCents)],
              [
                "支付构成",
                `现 ${formatMoney(report.byMethod.cash)} / 卡 ${formatMoney(report.byMethod.card)}`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-black/10 bg-white/75 p-4">
                <p className="text-sm text-[var(--brand-muted)]">{label}</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-2xl">{value}</p>
              </div>
            ))}
          </div>

          <section className="mt-6 rounded-xl border border-black/10 bg-white/75 p-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl">热销菜品</h2>
            <ul className="mt-3 space-y-2">
              {report.topItems.map((item, i) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-2"
                >
                  <span>
                    {i + 1}. {item.name} × {item.qty}
                  </span>
                  <span>{formatMoney(item.cents)}</span>
                </li>
              ))}
              {!report.topItems.length ? (
                <li className="text-[var(--brand-muted)]">当日暂无已结账订单</li>
              ) : null}
            </ul>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
