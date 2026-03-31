import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Droplets, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BloodType } from "../backend.d";
import { useGetInventory, useUpdateInventory } from "../hooks/useQueries";

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

const ALL_BLOOD_TYPES = Object.values(BloodType);

function getStatus(units: number) {
  if (units >= 20)
    return {
      label: "Optimal",
      className: "text-green-700 bg-success/10 border-green-200",
    };
  if (units >= 10)
    return {
      label: "Low",
      className: "text-yellow-700 bg-warning/10 border-yellow-200",
    };
  return {
    label: "Critical",
    className: "text-destructive bg-destructive/10 border-destructive/20",
  };
}

function getProgressColor(units: number) {
  if (units >= 20) return "bg-success";
  if (units >= 10) return "bg-warning";
  return "bg-destructive";
}

export default function InventoryPage({ isAdmin }: { isAdmin: boolean }) {
  const { data: inventory, isLoading } = useGetInventory();
  const updateInventory = useUpdateInventory();
  const [selectedType, setSelectedType] = useState<BloodType>(BloodType.O_Pos);
  const [units, setUnits] = useState("");

  const inventoryMap = new Map<BloodType, number>();
  if (inventory) {
    for (const [bt, u] of inventory) {
      inventoryMap.set(bt, Number(u));
    }
  }

  async function handleUpdate() {
    const numUnits = Number.parseInt(units);
    if (Number.isNaN(numUnits)) {
      toast.error("Please enter a valid number");
      return;
    }
    try {
      await updateInventory.mutateAsync({
        bloodType: selectedType,
        units: BigInt(numUnits),
      });
      toast.success(`Inventory updated for ${BLOOD_TYPE_LABELS[selectedType]}`);
      setUnits("");
    } catch {
      toast.error("Failed to update inventory");
    }
  }

  return (
    <div className="space-y-6" data-ocid="inventory.section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Blood Inventory</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time blood stock across all types
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
            Optimal ≥20 units
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" />
            Low 10–19
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
            Critical &lt;10
          </span>
        </div>
      </div>

      {/* Blood type cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ALL_BLOOD_TYPES.map((bt, btIdx) => {
          const currentUnits = inventoryMap.get(bt) ?? 0;
          const status = getStatus(currentUnits);
          const barWidth = Math.min(100, (currentUnits / 50) * 100);

          return (
            <Card
              key={bt}
              className="shadow-card hover:shadow-md transition-shadow"
              data-ocid={`inventory.item.${btIdx + 1}`}
            >
              <CardContent className="pt-5 pb-5">
                {isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-3xl font-bold text-foreground">
                          {BLOOD_TYPE_LABELS[bt]}
                        </div>
                        <div className="text-2xl font-bold text-primary mt-1">
                          {currentUnits}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          units available
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Droplets className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(currentUnits)}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Update inventory form (admin only) */}
      {isAdmin && (
        <Card className="shadow-card max-w-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Update Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Blood Type</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as BloodType)}
              >
                <SelectTrigger data-ocid="inventory.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_BLOOD_TYPES.map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {BLOOD_TYPE_LABELS[bt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-units">
                Units (use negative to subtract)
              </Label>
              <Input
                id="inv-units"
                type="number"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="e.g. 10 or -5"
                data-ocid="inventory.input"
              />
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={handleUpdate}
              disabled={updateInventory.isPending}
              data-ocid="inventory.submit_button"
            >
              {updateInventory.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Inventory
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
