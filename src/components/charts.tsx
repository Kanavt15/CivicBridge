"use client";
import { Text } from "@/components/i18n";
import { useI18n } from "@/components/i18n";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
const colors = [
  "#5d5d5d",
  "#8a8a8a",
  "#b7b7b7",
  "#969696",
  "#b9b9b9",
  "#797979",
  "#cecece",
  "#6e6e6e",
];
export function ImpactCharts({ stats, admin = false }: { stats: any; admin?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="chart-grid">
      <div className="chart-panel">
        <h3>
          <Text>{"Community progress"}</Text>
        </h3>
        <small>
          <Text>{"Public reports by submission month · includes demo records"}</Text>
        </small>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.months} margin={{ left: -25, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="chart-green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5d5d5d" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#5d5d5d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#bababa2f" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e5e5",
                  fontSize: 11,
                  color: "#353535",
                }}
              />
              <Area
                name={t("Reported")}
                type="monotone"
                dataKey="reported"
                stroke="#5d5d5d"
                fill="url(#chart-green)"
                strokeWidth={2}
              />
              <Area
                name={t("Resolved")}
                type="monotone"
                dataKey="resolved"
                stroke="#a1a1a1"
                fill="transparent"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="chart-panel">
        <h3>
          <Text>{"Challenges by category"}</Text>
        </h3>
        <small>
          <Text>{"Public challenges · includes demo records"}</Text>
        </small>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.categories.map((c: any) => ({ ...c, name: t(c.name) }))}
                dataKey="value"
                nameKey="name"
                innerRadius={53}
                outerRadius={77}
                paddingAngle={4}
                stroke="none"
              >
                {stats.categories.map((_: any, i: number) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11, color: "#353535" }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {admin && (
        <div className="chart-panel" style={{ gridColumn: "1 / -1" }}>
          <h3>
            <Text>{"Where change begins"}</Text>
          </h3>
          <small>
            <Text>{"Public reports by state"}</Text>
          </small>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.regions} margin={{ left: -20, right: 10, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#bababa2f" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11, color: "#353535" }} />
                <Bar
                  dataKey="value"
                  name={t("Public reports")}
                  fill="#8a8a8a"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
