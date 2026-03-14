"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/system/card";
import type { DashboardAgingBucket } from "@/lib/services/workspace";

type ARAgingChartProps = {
  data: DashboardAgingBucket[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ARAgingChart({ data }: ARAgingChartProps) {
  return (
    <AppCard className="overflow-hidden border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(238,248,255,0.78))]">
      <AppCardHeader className="border-b border-border/60 px-6 py-5">
        <AppCardTitle className="text-xl">A/R aging</AppCardTitle>
        <AppCardDescription>
          Outstanding claim balance grouped by age bucket.
        </AppCardDescription>
      </AppCardHeader>
      <AppCardContent className="px-6 py-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barSize={36}
              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
              accessibilityLayer
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.32)"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickFormatter={(value: number) => formatCurrency(value)}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={88}
              />
              <Tooltip
                cursor={{ fill: "rgba(56, 189, 248, 0.08)" }}
                contentStyle={{
                  borderRadius: 20,
                  border: "1px solid rgba(203, 213, 225, 0.75)",
                  boxShadow: "0 24px 60px -32px rgba(15, 23, 42, 0.45)",
                  background: "rgba(255, 255, 255, 0.94)",
                }}
                formatter={(value, name) => {
                  const numericValue =
                    typeof value === "number" ? value : Number(value ?? 0);

                  if (name === "amount") {
                    return [formatCurrency(numericValue), "Outstanding"];
                  }

                  return [numericValue, "Claims"];
                }}
                labelFormatter={(label) => `Bucket: ${label}`}
              />
              <Bar
                dataKey="amount"
                name="amount"
                fill="#0f6ecd"
                radius={[10, 10, 4, 4]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AppCardContent>
    </AppCard>
  );
}
