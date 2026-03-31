import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type BloodType, UserRole } from "../backend.d";
import type {
  BloodRequest,
  DashboardStats,
  Donor,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGetAllDonors() {
  const { actor, isFetching } = useActor();
  return useQuery<Donor[]>({
    queryKey: ["donors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDonors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetInventory() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[BloodType, bigint]>>({
    queryKey: ["inventory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInventory();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGetAllRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<BloodRequest[]>({
    queryKey: ["requests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPendingRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<BloodRequest[]>({
    queryKey: ["pendingRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddDonor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      contactPhone: string;
      email: string;
      bloodType: BloodType;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addDonor(
        data.name,
        data.contactPhone,
        data.email,
        data.bloodType,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["donors"] }),
  });
}

export function useUpdateDonor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      contactPhone: string;
      email: string;
      bloodType: BloodType;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateDonor(
        data.id,
        data.name,
        data.contactPhone,
        data.email,
        data.bloodType,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["donors"] }),
  });
}

export function useDeactivateDonor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deactivateDonor(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["donors"] }),
  });
}

export function useCreateBloodRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      patientName: string;
      bloodType: BloodType;
      units: bigint;
      hospital: string;
      urgency: string;
      requestedBy: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createBloodRequest(
        data.patientName,
        data.bloodType,
        data.units,
        data.hospital,
        data.urgency,
        data.requestedBy,
        data.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateRequestStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; status: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateRequestStatus(data.id, data.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateInventory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bloodType: BloodType; units: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateInventory(data.bloodType, data.units);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useSaveCallerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] }),
  });
}
