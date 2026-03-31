import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  Droplets,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  useGetAllDonors,
  useGetAllRequests,
  useGetDashboardStats,
} from "../hooks/useQueries";

export default function AdminPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: donors } = useGetAllDonors();
  const { data: requests } = useGetAllRequests();

  const totalRequests = requests?.length || 0;
  const fulfilledRequests =
    requests?.filter((r) => r.status === "Fulfilled").length || 0;
  const fulfillmentRate =
    totalRequests > 0
      ? Math.round((fulfilledRequests / totalRequests) * 100)
      : 0;

  const bloodTypeBreakdown = donors
    ? Object.entries(
        donors.reduce((acc: Record<string, number>, d) => {
          acc[d.bloodType] = (acc[d.bloodType] || 0) + 1;
          return acc;
        }, {}),
      )
    : [];

  const systemStats = [
    {
      title: "Total Donors",
      value: statsLoading ? null : Number(stats?.totalDonors ?? 0),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Donors",
      value: statsLoading ? null : Number(stats?.activeDonors ?? 0),
      icon: Users,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Total Inventory",
      value: statsLoading ? null : Number(stats?.totalInventoryUnits ?? 0),
      icon: Droplets,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Urgent Requests",
      value: statsLoading ? null : Number(stats?.urgentRequests ?? 0),
      icon: ClipboardList,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Fulfillment Rate",
      value: statsLoading ? null : `${fulfillmentRate}%`,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Total Requests",
      value: statsLoading ? null : totalRequests,
      icon: ClipboardList,
      color: "text-muted-foreground",
      bg: "bg-secondary",
    },
  ];

  return (
    <div className="space-y-6" data-ocid="admin.section">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Controls</h1>
          <p className="text-muted-foreground text-sm">
            System overview and management
          </p>
        </div>
      </div>

      {/* System stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {systemStats.map((stat) => (
          <Card key={stat.title} className="shadow-card" data-ocid="admin.card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {stat.title}
                  </p>
                  {stat.value === null ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground mt-0.5">
                      {stat.value}
                    </p>
                  )}
                </div>
                <div
                  className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blood Type Breakdown */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Donor Blood Type Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bloodTypeBreakdown.length === 0 ? (
            <p
              className="text-muted-foreground text-sm"
              data-ocid="admin.donors.empty_state"
            >
              No donor data available.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {bloodTypeBreakdown.map(([bt, count]) => (
                <div
                  key={bt}
                  className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2"
                  data-ocid="admin.donor.row"
                >
                  <Badge
                    variant="outline"
                    className="font-semibold border-primary/30 text-primary bg-primary/5"
                  >
                    {bt}
                  </Badge>
                  <span className="text-sm font-medium">{count} donors</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Status Summary */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Request Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["Pending", "Approved", "Fulfilled", "Rejected"].map((status) => {
              const count =
                requests?.filter((r) => r.status === status).length || 0;
              const colors: Record<string, string> = {
                Pending: "text-yellow-700 bg-warning/10 border-yellow-200",
                Approved: "text-blue-700 bg-blue-50 border-blue-200",
                Fulfilled: "text-green-700 bg-success/10 border-green-200",
                Rejected:
                  "text-destructive bg-destructive/10 border-destructive/20",
              };
              return (
                <div
                  key={status}
                  className={`rounded-lg border px-4 py-3 ${colors[status]}`}
                  data-ocid="admin.request.row"
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs font-medium mt-0.5">{status}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
