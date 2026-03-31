import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Loader2,
  PackageCheck,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BloodType } from "../backend.d";
import type { BloodRequest } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateBloodRequest,
  useGetAllRequests,
  useUpdateRequestStatus,
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

function NewRequestModal({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const { identity } = useInternetIdentity();
  const [patientName, setPatientName] = useState("");
  const [bloodType, setBloodType] = useState<BloodType>(BloodType.O_Pos);
  const [units, setUnits] = useState("1");
  const [hospital, setHospital] = useState("");
  const [urgency, setUrgency] = useState("Medium");
  const [notes, setNotes] = useState("");
  const createRequest = useCreateBloodRequest();

  async function handleSubmit() {
    if (!patientName || !hospital) {
      toast.error("Please fill in all required fields");
      return;
    }
    const numUnits = Number.parseInt(units);
    if (Number.isNaN(numUnits) || numUnits < 1) {
      toast.error("Please enter a valid unit count");
      return;
    }
    try {
      await createRequest.mutateAsync({
        patientName,
        bloodType,
        units: BigInt(numUnits),
        hospital,
        urgency,
        requestedBy: identity?.getPrincipal().toString() || "unknown",
        notes,
      });
      toast.success("Blood request created successfully");
      onClose();
    } catch {
      toast.error("Failed to create request");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-ocid="request.dialog">
        <DialogHeader>
          <DialogTitle>New Blood Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="req-patient">Patient Name *</Label>
            <Input
              id="req-patient"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Anil Sharma"
              data-ocid="request.patient.input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Blood Type *</Label>
              <Select
                value={bloodType}
                onValueChange={(v) => setBloodType(v as BloodType)}
              >
                <SelectTrigger data-ocid="request.blood_type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BLOOD_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-units">Units *</Label>
              <Input
                id="req-units"
                type="number"
                min="1"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                data-ocid="request.units.input"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req-hospital">Hospital *</Label>
            <Input
              id="req-hospital"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="e.g. AIIMS New Delhi"
              data-ocid="request.hospital.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Urgency</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger data-ocid="request.urgency.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Critical", "High", "Medium", "Low"].map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req-notes">Notes</Label>
            <Textarea
              id="req-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
              data-ocid="request.notes.textarea"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="request.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createRequest.isPending}
            className="bg-primary text-primary-foreground"
            data-ocid="request.submit_button"
          >
            {createRequest.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RequestsPage({ isAdmin }: { isAdmin: boolean }) {
  const { data: requests, isLoading } = useGetAllRequests();
  const updateStatus = useUpdateRequestStatus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered =
    requests?.filter((r) => {
      const matchesSearch =
        r.patientName.toLowerCase().includes(search.toLowerCase()) ||
        r.hospital.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  async function handleStatusUpdate(req: BloodRequest, status: string) {
    try {
      await updateStatus.mutateAsync({ id: req.id, status });
      toast.success(`Request ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed to update request");
    }
  }

  return (
    <div className="space-y-4" data-ocid="requests.section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Blood Requests</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage blood supply requests
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground"
          onClick={() => setModalOpen(true)}
          data-ocid="request.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Request
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="requests.search_input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-36"
                data-ocid="requests.filter.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "Pending", "Approved", "Fulfilled", "Rejected"].map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2" data-ocid="requests.loading_state">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="p-12 text-center text-muted-foreground"
              data-ocid="requests.empty_state"
            >
              No requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    {[
                      "ID",
                      "Patient",
                      "Blood Type",
                      "Units",
                      "Hospital",
                      "Urgency",
                      "Status",
                      isAdmin ? "Actions" : "",
                    ]
                      .filter(Boolean)
                      .map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs"
                        >
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req, idx) => (
                    <tr
                      key={String(req.id)}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                      data-ocid={`requests.item.${idx + 1}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
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
                      <td className="px-4 py-2.5">{String(req.units)}</td>
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
                      {isAdmin && (
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            {req.status === "Pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                                  onClick={() =>
                                    handleStatusUpdate(req, "Approved")
                                  }
                                  data-ocid={`requests.edit_button.${idx + 1}`}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />{" "}
                                  Approve
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                                  onClick={() =>
                                    handleStatusUpdate(req, "Rejected")
                                  }
                                  data-ocid={`requests.delete_button.${idx + 1}`}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />{" "}
                                  Reject
                                </Button>
                              </>
                            )}
                            {req.status === "Approved" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-green-700 hover:bg-success/10 px-2"
                                onClick={() =>
                                  handleStatusUpdate(req, "Fulfilled")
                                }
                                data-ocid={`requests.save_button.${idx + 1}`}
                              >
                                <PackageCheck className="w-3.5 h-3.5 mr-1" />{" "}
                                Fulfill
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <NewRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
