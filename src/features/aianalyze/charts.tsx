import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { isFpsDip } from "./rules";
import type { Point } from "./types";
export function TrendChart({
  points,
  series,
  unit = "",
  domain,
  median,
}: {
  points: (Point & { fps?: number | null })[];
  series: { key: string; label: string }[];
  unit?: string;
  domain?: [number, number];
  median?: number | null;
}) {
  const data = points.map((p) => ({ t: p.t, fps: p.fps, ...p.m }));
  if (!data.length) return <div className="chart-empty">Waiting for measurements…</div>;
  return (
    <div className="trend-chart" aria-label={`${series.map((s) => s.label).join(" and ")} chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: -22, bottom: 0 }}>
          <XAxis
            dataKey="t"
            tickFormatter={(t) =>
              new Date(Number(t) * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            }
            tickLine={false}
            axisLine={false}
            minTickGap={50}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            domain={domain || ["auto", "auto"]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            unit={unit}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--foreground)",
            }}
            labelFormatter={(t) => new Date(Number(t) * 1000).toLocaleTimeString()}
            formatter={(v: number, name: string) => [`${Math.round(v * 10) / 10}${unit}`, name]}
          />
          {median !== undefined &&
            points
              .filter((p) => isFpsDip(p.fps ?? null, median))
              .map((p) => (
                <ReferenceArea
                  key={p.t}
                  x1={p.t - 0.4}
                  x2={p.t + 0.4}
                  fill="var(--warning)"
                  fillOpacity={0.15}
                />
              ))}
          {series.map((s, i) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stroke={i === 0 ? "var(--primary)" : "var(--chart-secondary)"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function ChartSection({
  title,
  points,
  series,
  unit,
  domain,
  median,
}: {
  title: string;
  points: (Point & { fps?: number | null })[];
  series: { key: string; label: string }[];
  unit?: string;
  domain?: [number, number];
  median?: number | null;
}) {
  return (
    <section className="chart-section">
      <div className="section-heading">
        <h3>{title}</h3>
        <div className="chart-legend">
          {series.map((s, i) => (
            <span key={s.key}>
              <i className={i === 0 ? "legend-primary" : "legend-secondary"} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <TrendChart
        points={points}
        series={series}
        {...(unit !== undefined ? { unit } : {})}
        {...(domain ? { domain } : {})}
        {...(median !== undefined ? { median } : {})}
      />
    </section>
  );
}
