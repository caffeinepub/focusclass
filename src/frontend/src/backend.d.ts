import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Donor {
    id: bigint;
    bloodType: BloodType;
    name: string;
    lastDonationDate: string;
    isActive: boolean;
    email: string;
    totalDonations: bigint;
    contactPhone: string;
}
export interface DashboardStats {
    urgentRequests: bigint;
    pendingRequests: bigint;
    activeDonors: bigint;
    totalInventoryUnits: bigint;
    unitsCollectedToday: bigint;
    totalDonors: bigint;
}
export interface UserProfile {
    name: string;
}
export interface BloodRequest {
    id: bigint;
    hospital: string;
    status: string;
    bloodType: BloodType;
    urgency: string;
    createdAt: bigint;
    notes: string;
    units: bigint;
    patientName: string;
    requestedBy: string;
}
export enum BloodType {
    AB_Neg = "AB_Neg",
    AB_Pos = "AB_Pos",
    B_Neg = "B_Neg",
    B_Pos = "B_Pos",
    A_Neg = "A_Neg",
    A_Pos = "A_Pos",
    O_Neg = "O_Neg",
    O_Pos = "O_Pos"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDonor(name: string, contactPhone: string, email: string, bloodType: BloodType): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBloodRequest(patientName: string, bloodType: BloodType, units: bigint, hospital: string, urgency: string, requestedBy: string, notes: string): Promise<bigint>;
    deactivateDonor(id: bigint): Promise<void>;
    getAllDonors(): Promise<Array<Donor>>;
    getAllRequests(): Promise<Array<BloodRequest>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getDonor(id: bigint): Promise<Donor | null>;
    getInventory(): Promise<Array<[BloodType, bigint]>>;
    getPendingRequests(): Promise<Array<BloodRequest>>;
    getRequest(id: bigint): Promise<BloodRequest | null>;
    getUrgentRequests(): Promise<Array<BloodRequest>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchDonors(searchText: string): Promise<Array<Donor>>;
    updateDonor(id: bigint, name: string, contactPhone: string, email: string, bloodType: BloodType): Promise<void>;
    updateInventory(bloodType: BloodType, units: bigint): Promise<void>;
    updateRequestStatus(id: bigint, status: string): Promise<void>;
}
