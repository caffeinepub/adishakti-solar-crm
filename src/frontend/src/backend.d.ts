import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Lead {
    id: LeadId;
    customerName: string;
    createdAt: Time;
    createdBy: UserId;
    email: string;
    district: District;
    updatedAt: Time;
    stage: PipelineStage;
    assignedOperationsPerson?: UserId;
    address: string;
    notes: string;
    phone: string;
    requirements: Requirement;
    assignedSalesPerson?: UserId;
}
export type UserId = Principal;
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export type Time = bigint;
export interface Requirement {
    panelSize: string;
    notes: string;
    estimatedValue: bigint;
    systemType: string;
}
export type LeadId = bigint;
export type District = string;
export interface UserProfile {
    principal: UserId;
    name: string;
    role: UserRole;
    email: string;
    district: District;
    phone: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum PipelineStage {
    closedWon = "closedWon",
    inquiry = "inquiry",
    bookingConfirmed = "bookingConfirmed",
    surveyScheduled = "surveyScheduled",
    installation = "installation",
    closedLost = "closedLost"
}
export enum UserRole {
    admin = "admin",
    sales = "sales",
    operations = "operations"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDistrict(district: District): Promise<void>;
    addLead(input: Lead): Promise<LeadId>;
    addUserProfile(profile: UserProfile): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    assignLeadToOperations(leadId: LeadId, operationsPerson: UserId): Promise<void>;
    assignLeadToSales(leadId: LeadId, salesPerson: UserId): Promise<void>;
    getAllDistricts(): Promise<Array<District>>;
    getAllLeads(): Promise<Array<Lead>>;
    getAllUserProfiles(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getLeadById(leadId: LeadId): Promise<Lead | null>;
    getLeadsAddedToday(): Promise<bigint>;
    getLeadsByDistrict(district: District): Promise<Array<Lead>>;
    getLeadsByDistrictCount(): Promise<Array<[District, bigint]>>;
    getLeadsBySalesPerson(salesPerson: UserId): Promise<Array<Lead>>;
    getLeadsByStage(stage: PipelineStage): Promise<Array<Lead>>;
    getLeadsByStageCount(): Promise<Array<[PipelineStage, bigint]>>;
    getMyLeads(): Promise<Array<Lead>>;
    getTotalLeadsCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    requestApproval(): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    updateLead(leadId: LeadId, input: Lead): Promise<void>;
    updateLeadStage(leadId: LeadId, stage: PipelineStage, notes: string): Promise<void>;
    updateUserProfile(profile: UserProfile): Promise<void>;
}
