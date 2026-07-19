import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

export function PlacementDonut({ summary }) {
  if (!summary)
    return <p className="text-sm text-text-muted text-center py-8">No data</p>;
  const data = [
    { name: "Placed", value: Number(summary.placed) },
    { name: "Not Placed", value: Number(summary.notPlaced) },
  ];
  const COLORS = ["#22C55E", "#EF4444"];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          dataKey="value"
          label
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function FunnelChart({ funnel }) {
  if (!funnel)
    return <p className="text-sm text-text-muted text-center py-8">No data</p>;
  const data = [
    { name: "Applied", value: funnel.totalApplied, fill: "#3B82F6" },
    { name: "Shortlisted", value: funnel.totalShortlisted, fill: "#F59E0B" },
    { name: "Selected", value: funnel.totalSelected, fill: "#22C55E" },
  ];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BranchChart({ data }) {
  if (!data?.length)
    return <p className="text-sm text-text-muted text-center py-8">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <XAxis type="number" />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
          tick={{ fontSize: 11 }}
        />
        <Tooltip />
        <Legend />
        <Bar dataKey="Placed" fill="#22C55E" />
        <Bar dataKey="Not Placed" fill="#EF4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CTCChart({ data }) {
  if (!data?.length)
    return <p className="text-sm text-text-muted text-center py-8">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="Students" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
