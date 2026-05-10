"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

const PALETTE = ["#ff6f00", "#1a1a1a", "#0d4d92", "#0d8b3e", "#7c3a13", "#5d3d72", "#b91c1c"];

interface FamilyDatum {
  family: string;
  total: number;
  receipts: number;
  points: number;
}

interface WholesalerDatum {
  name: string;
  total: number;
  receipts: number;
}

interface MonthlyDatum {
  month: string;
  total: number;
  points: number;
  receipts: number;
}

interface Labels {
  empty: string;
  emptyBody: string;
  monthly: string;
  spendByFamily: string;
  topWhole: string;
  spendEur: string;
  points: string;
  eurApproved: string;
}

export function IntelligenceCharts({
  families,
  wholesalers,
  monthly,
  labels,
  dateLocale,
}: {
  families: FamilyDatum[];
  wholesalers: WholesalerDatum[];
  monthly: MonthlyDatum[];
  labels: Labels;
  dateLocale: string;
}) {
  if (families.length === 0 && wholesalers.length === 0 && monthly.length === 0) {
    return (
      <div className="v-card text-center py-10">
        <div className="font-semibold text-sm">{labels.empty}</div>
        <div className="text-xs text-[var(--vie-ink-muted)] mt-1">{labels.emptyBody}</div>
      </div>
    );
  }

  const fmtEur = (v: unknown) => `€${Number(v).toLocaleString(dateLocale, { maximumFractionDigits: 0 })}`;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {monthly.length > 0 && (
        <div className="v-card md:col-span-2">
          <div className="text-sm font-bold mb-3">{labels.monthly}</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={monthly} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ececea" />
                <XAxis dataKey="month" stroke="#9a9a9a" fontSize={11} />
                <YAxis stroke="#9a9a9a" fontSize={11} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={fmtEur} contentStyle={{ borderRadius: 12, border: "1px solid #ececea", fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="total" name={labels.spendEur} stroke="#ff6f00" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="points" name={labels.points} stroke="#1a1a1a" strokeWidth={1.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {families.length > 0 && (
        <div className="v-card">
          <div className="text-sm font-bold mb-3">{labels.spendByFamily}</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={families} dataKey="total" nameKey="family" cx="50%" cy="50%" outerRadius={80} label={(p) => {
                  const e = p as { family?: string; percent?: number };
                  return `${e.family ?? ""} ${((e.percent ?? 0) * 100).toFixed(0)}%`;
                }}>
                  {families.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={fmtEur} contentStyle={{ borderRadius: 12, border: "1px solid #ececea", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {wholesalers.length > 0 && (
        <div className="v-card">
          <div className="text-sm font-bold mb-3">{labels.topWhole}</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={wholesalers} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ececea" />
                <XAxis dataKey="name" stroke="#9a9a9a" fontSize={11} />
                <YAxis stroke="#9a9a9a" fontSize={11} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={fmtEur} contentStyle={{ borderRadius: 12, border: "1px solid #ececea", fontSize: 12 }} />
                <Bar dataKey="total" name={labels.eurApproved} fill="#ff6f00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
