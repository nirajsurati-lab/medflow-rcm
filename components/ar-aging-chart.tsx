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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="border-white/80 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle>A/R aging</CardTitle>
        <CardDescription>
          Outstanding claim balance grouped by age bucket.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barSize={36}
              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
              accessibilityLayer
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
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
                fill="#0f766e"
                radius={[10, 10, 4, 4]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
