import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Droplets, Package, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BloodType } from "../backend.d";
import {
  useGetAllRequests,
  useGetDashboardStats,
  useGetInventory,
} from "../hooks/useQueries";

const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  [BloodType.A_Pos]: "A+",
  [BloodType.A_Neg]: "A-",
  [BloodType.B_Pos]: "B+",
  [BloodType.B_Neg]: "B-",
  [BloodType.O_Pos]: "O+",
  [BloodType.O_Neg]: "O-",
  [BloodType.AB_Pos]: "AB+",
  [BloodType.AB_Neg]: "AB-",
};

function getInventoryColor(units: number) {
  if (units >= 20) return "#16A34A";
  if (units >= 10) return "#F59E0B";
  return "#DC2626";
}

const urgencyColors: Record<string, string> = {
  Critical: "bg-destructive/10 text-destructive border-destructive/20",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-warning/10 text-yellow-700 border-yellow-200",
  Low: "bg-success/10 text-green-700 border-green-200",
};

const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-yellow-700 border-yellow-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Fulfilled: "bg-success/10 text-green-700 border-green-200",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const recentActivity = [
  {
    time: "09:42",
    text: "New request: O+ blood for AIIMS Delhi",
    type: "request",
  },
  {
    time: "09:15",
    text: "Inventory updated: A+ +10 units added",
    type: "inventory",
  },
  {
    time: "08:50",
    text: "Donor Rajesh Kumar completed donation",
    type: "donor",
  },
  {
    time: "08:20",
    text: "Request #1042 fulfilled — 3 units B-",
    type: "fulfilled",
  },
  { time: "07:45", text: "New donor registered: Priya Sharma", type: "donor" },
];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: inventory, isLoading: inventoryLoading } = useGetInventory();
  const { data: requests, isLoading: requestsLoading } = useGetAllRequests();

  const chartData = inventory
    ? inventory.map(([bloodType, units]) => ({
        name: BLOOD_TYPE_LABELS[bloodType] || bloodType,
        units: Number(units),
        fill: getInventoryColor(Number(units)),
      }))
    : Object.values(BloodType).map((bt) => ({
        name: BLOOD_TYPE_LABELS[bt],
        units: 0,
        fill: "#DC2626",
      }));

  const recentRequests = requests?.slice(0, 6) || [];

  const kpiCards = [
    {
      title: "Active Donors",
      value: statsLoading ? null : Number(stats?.activeDonors ?? 0),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Pending Requests",
      value: statsLoading ? null : Number(stats?.pendingRequests ?? 0),
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Units Today",
      value: statsLoading ? null : Number(stats?.unitsCollectedToday ?? 0),
      icon: Droplets,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Total Inventory",
      value: statsLoading ? null : Number(stats?.totalInventoryUnits ?? 0),
      icon: Package,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      data-ocid="dashboard.section"
    >
      {/* Left column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Bar Chart */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Live Blood Inventory By Type
              </CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Optimal (≥20)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  Low (10–19)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Critical (&lt;10)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <Skeleton
                className="h-48 w-full"
                data-ocid="inventory.chart.loading_state"
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value} units`, "Available"]}
                  />
                  <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Requests Table */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Recent Blood Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {requestsLoading ? (
              <div
                className="p-4 space-y-2"
                data-ocid="requests.table.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentRequests.length === 0 ? (
              <div
                className="p-8 text-center text-muted-foreground"
                data-ocid="requests.empty_state"
              >
                No requests yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">
                        ID
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">
                        Patient
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">
                        Blood
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">
                        Hospital
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">
                        Urgency
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((req, idx) => (
                      <tr
                        key={String(req.id)}
                        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                        data-ocid={`requests.item.${idx + 1}`}
                      >
                        <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                          #{String(req.id)}
                        </td>
                        <td className="px-4 py-2.5 font-medium">
                          {req.patientName}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className="font-semibold border-primary/30 text-primary bg-primary/5"
                          >
                            {BLOOD_TYPE_LABELS[req.bloodType] || req.bloodType}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {req.hospital}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${urgencyColors[req.urgency] || "bg-secondary text-muted-foreground border-border"}`}
                          >
                            {req.urgency}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[req.status] || "bg-secondary text-muted-foreground border-border"}`}
                          >
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right column */}
      <div className="space-y-4">
        {/* KPI Cards */}
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="shadow-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {kpi.title}
                  </p>
                  {kpi.value === null ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground mt-0.5">
                      {kpi.value.toLocaleString()}
                    </p>
                  )}
                </div>
                <div
                  className={`w-11 h-11 rounded-xl ${kpi.bg} flex items-center justify-center`}
                >
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Recent Activity Log */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.time}
                className="flex gap-3"
                data-ocid="activity.item.1"
              >
                <span className="text-[11px] font-mono text-muted-foreground pt-0.5 min-w-[38px]">
                  {activity.time}
                </span>
                <div className="flex-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 float-left mr-2 ${
                      activity.type === "request"
                        ? "bg-warning"
                        : activity.type === "fulfilled"
                          ? "bg-success"
                          : "bg-primary"
                    }`}
                  />
                  <p className="text-xs text-foreground leading-snug">
                    {activity.text}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
