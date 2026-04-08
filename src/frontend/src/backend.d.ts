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
    id: bigint;
    customerName: string;
    createdAt: Time;
    createdBy: string;
    email: string;
    district: string;
    updatedAt: Time;
    stage: PipelineStage;
    assignedOperationsPerson?: string;
    address: string;
    notes: string;
    phone: string;
    requirements: Requirement;
    assignedSalesPerson?: string;
    remarks: Array<Remark>;
}
export type Time = bigint;
export interface Requirement {
    panelSize: string;
    notes: string;
    estimatedValue: bigint;
    systemType: string;
}
export interface Remark {
    content: string;
    addedAt: Time;
    addedBy: string;
}
export interface UserProfile {
    whatsAppNumber: string;
    userId: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    email: string;
    district: string;
    passwordHash: string;
    phone: string;
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
    backoffice = "backoffice",
    sales = "sales",
    operation = "operation"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDistrict(sessionToken: string, name: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addLead(sessionToken: string, customerName: string, phone: string, email: string, address: string, district: string, requirements: Requirement, notes: string): Promise<{
        __kind__: "ok";
        ok: Lead;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addRemark(sessionToken: string, leadId: bigint, content: string): Promise<{
        __kind__: "ok";
        ok: Lead;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    assignLeadToOperations(sessionToken: string, leadId: bigint, operationsUserId: string): Promise<{
        __kind__: "ok";
        ok: Lead;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignLeadToSales(sessionToken: string, leadId: bigint, salesUserId: string): Promise<{
        __kind__: "ok";
        ok: Lead;
    } | {
        __kind__: "err";
        err: string;
    }>;
    changePassword(sessionToken: string, userId: string, newPassword: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createUser(sessionToken: string, userId: string, password: string, name: string, role: UserRole, district: string, phone: string, email: string, whatsAppNumber: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllDistricts(): Promise<Array<string>>;
    getAllLeads(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: Array<Lead>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllUsers(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: Array<UserProfile>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCallerUserRole(): Promise<UserRole__1>;
    getLeadById(sessionToken: string, leadId: bigint): Promise<{
        __kind__: "ok";
        ok: Lead;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getLeadsAddedToday(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getLeadsByDistrict(sessionToken: string, district: string): Promise<{
        __kind__: "ok";
        ok: Array<Lead>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getLeadsByDistrictCount(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: Array<[string, bigint]>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getLeadsByStage(sessionToken: string, stage: PipelineStage): Promise<{
        __kind__: "ok";
        ok: Array<Lead>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getLeadsByStageCount(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: Array<[PipelineStage, bigint]>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getMyLeads(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: Array<Lead>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getMyProfile(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: UserProfile;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getTotalLeadsCount(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getUserById(sessionToken: string, userId: string): Promise<{
        __kind__: "ok";
        ok: UserProfile;
    } | {
        __kind__: "err";
        err: string;
    }>;
    isCallerAdmin(): Promise<boolean>;
    login(username: string, password: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    logout(sessionToken: string): Promise<void>;
    updateLead(sessionToken: string, leadId: bigint, customerName: string, phone: string, email: string, address: string, district: string, requirements: Requirement, notes: string): Promise<{
        __kind__: "ok";
        ok: Lead;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateLeadStage(sessionToken: string, leadId: bigint, stage: PipelineStage, notes: string): Promise<{
        __kind__: "ok";
        ok: Lead;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateUser(sessionToken: string, userId: string, name: string, district: string, phone: string, email: string, whatsAppNumber: string, isActive: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    validateSession(sessionToken: string): Promise<string | null>;
}
