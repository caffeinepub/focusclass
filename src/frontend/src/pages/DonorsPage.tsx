import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Pencil, Plus, Search, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BloodType } from "../backend.d";
import type { Donor } from "../backend.d";
import {
  useAddDonor,
  useDeactivateDonor,
  useGetAllDonors,
  useUpdateDonor,
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

interface DonorModalProps {
  open: boolean;
  onClose: () => void;
  donor?: Donor | null;
  isAdmin: boolean;
}

function DonorModal({ open, onClose, donor }: DonorModalProps) {
  const [name, setName] = useState(donor?.name || "");
  const [phone, setPhone] = useState(donor?.contactPhone || "");
  const [email, setEmail] = useState(donor?.email || "");
  const [bloodType, setBloodType] = useState<BloodType>(
    donor?.bloodType || BloodType.O_Pos,
  );

  const addDonor = useAddDonor();
  const updateDonor = useUpdateDonor();
  const isPending = addDonor.isPending || updateDonor.isPending;

  async function handleSubmit() {
    if (!name || !phone || !email) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      if (donor) {
        await updateDonor.mutateAsync({
          id: donor.id,
          name,
          contactPhone: phone,
          email,
          bloodType,
        });
        toast.success("Donor updated successfully");
      } else {
        await addDonor.mutateAsync({
          name,
          contactPhone: phone,
          email,
          bloodType,
        });
        toast.success("Donor added successfully");
      }
      onClose();
    } catch {
      toast.error("Failed to save donor");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-ocid="donor.dialog">
        <DialogHeader>
          <DialogTitle>{donor ? "Edit Donor" : "Add New Donor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="donor-name">Full Name</Label>
            <Input
              id="donor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              data-ocid="donor.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="donor-phone">Phone</Label>
            <Input
              id="donor-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              data-ocid="donor.phone.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="donor-email">Email</Label>
            <Input
              id="donor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="donor@example.com"
              data-ocid="donor.email.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Blood Type</Label>
            <Select
              value={bloodType}
              onValueChange={(v) => setBloodType(v as BloodType)}
            >
              <SelectTrigger data-ocid="donor.blood_type.select">
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
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="donor.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-primary text-primary-foreground"
            data-ocid="donor.save_button"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {donor ? "Save Changes" : "Add Donor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DonorsPage({ isAdmin }: { isAdmin: boolean }) {
  const { data: donors, isLoading } = useGetAllDonors();
  const deactivateDonor = useDeactivateDonor();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editDonor, setEditDonor] = useState<Donor | null>(null);

  const filtered =
    donors?.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  async function handleDeactivate(id: bigint) {
    try {
      await deactivateDonor.mutateAsync(id);
      toast.success("Donor deactivated");
    } catch {
      toast.error("Failed to deactivate donor");
    }
  }

  return (
    <div className="space-y-4" data-ocid="donors.section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Donor Management
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track and manage blood donors
          </p>
        </div>
        {isAdmin && (
          <Button
            className="bg-primary text-primary-foreground"
            onClick={() => {
              setEditDonor(null);
              setModalOpen(true);
            }}
            data-ocid="donor.open_modal_button"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Donor
          </Button>
        )}
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search donors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="donors.search_input"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {filtered.length} donors
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2" data-ocid="donors.loading_state">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="p-12 text-center text-muted-foreground"
              data-ocid="donors.empty_state"
            >
              No donors found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    {[
                      "Name",
                      "Blood Type",
                      "Contact",
                      "Last Donation",
                      "Total",
                      "Status",
                      "Actions",
                    ].map((h) => (
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
                  {filtered.map((donor, idx) => (
                    <tr
                      key={String(donor.id)}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                      data-ocid={`donors.item.${idx + 1}`}
                    >
                      <td className="px-4 py-3 font-medium">{donor.name}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="font-semibold border-primary/30 text-primary bg-primary/5"
                        >
                          {BLOOD_TYPE_LABELS[donor.bloodType] ||
                            donor.bloodType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {donor.contactPhone}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {donor.lastDonationDate || "Never"}
                      </td>
                      <td className="px-4 py-3">
                        {String(donor.totalDonations)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            donor.isActive
                              ? "bg-success/10 text-green-700 border-green-200"
                              : "bg-secondary text-muted-foreground border-border"
                          }`}
                        >
                          {donor.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditDonor(donor);
                                  setModalOpen(true);
                                }}
                                data-ocid={`donors.edit_button.${idx + 1}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              {donor.isActive && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:text-destructive"
                                  onClick={() => handleDeactivate(donor.id)}
                                  data-ocid={`donors.delete_button.${idx + 1}`}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DonorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        donor={editDonor}
        isAdmin={isAdmin}
      />
    </div>
  );
}
