import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Remark {
    content: string;
    addedAt: Time;
    addedBy: string;
}
export interface QuotationRequest {
    id: string;
    status: QuotationRequestStatus;
    quotationRefId: string;
    confirmedAt?: Time;
    confirmedBy?: string;
    confirmedByName?: string;
    leadId: bigint;
    requestedByName: string;
    requestedAt: Time;
    requestedBy: string;
}
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
export interface Quotation {
    id: string;
    customerName: string;
    status: QuotationStatus;
    panelCapacity: number;
    createdAt: Time;
    createdBy: string;
    gstPercent: number;
    validityDays: bigint;
    gstAmount: number;
    updatedAt: Time;
    customerAddress: string;
    leadId: string;
    totalAmount: number;
    notes: string;
    quotationNumber: string;
    items: Array<QuotationItem>;
    subtotal: number;
    systemType: string;
}
export interface QuotationItem {
    description: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
}
export interface Requirement {
    panelSize: string;
    notes: string;
    estimatedValue: bigint;
    systemType: string;
}
export interface QuotationInput {
    customerName: string;
    panelCapacity: number;
    gstPercent: number;
    validityDays: bigint;
    customerAddress: string;
    notes: string;
    items: Array<QuotationItem>;
    systemType: string;
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
    quotationSent = "quotationSent",
    installation = "installation",
    closedLost = "closedLost"
}
export enum QuotationRequestStatus {
    pending = "pending",
    confirmed = "confirmed"
}
export enum QuotationStatus {
    sent = "sent",
    rejected = "rejected",
    accepted = "accepted",
    draft = "draft"
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
    /**
     * / Backoffice/admin confirms a quotation request. Sets status to #confirmed,
     * / moves the lead to #quotationSent, and adds a remark.
     */
    confirmQuotationRequest(sessionToken: string, requestId: string): Promise<{
        __kind__: "ok";
        ok: QuotationRequest;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createQuotation(sessionToken: string, leadId: string, data: QuotationInput): Promise<{
        __kind__: "ok";
        ok: Quotation;
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
    deleteLead(sessionToken: string, leadId: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteUser(sessionToken: string, userId: string): Promise<{
        __kind__: "ok";
        ok: string;
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
    /**
     * / Returns all QuotationRequests regardless of status. Accessible by backoffice and admin.
     */
    getAllQuotationRequests(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: Array<QuotationRequest>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllQuotations(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: Array<Quotation>;
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
    /**
     * / Returns all QuotationRequests with #pending status. Accessible by backoffice and admin.
     */
    getPendingQuotationRequests(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: Array<QuotationRequest>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getQuotationById(sessionToken: string, id: string): Promise<{
        __kind__: "ok";
        ok: Quotation | null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getQuotationsByLead(sessionToken: string, leadId: string): Promise<{
        __kind__: "ok";
        ok: Array<Quotation>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Returns the current value of the sales lead generation toggle.
     * / Any authenticated user can read this.
     */
    getSalesLeadGenerationToggle(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: boolean;
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
    /**
     * / Sales requests a quotation for a lead. Creates a QuotationRequest with #pending status.
     * / Does NOT change the lead stage. Adds a remark to the lead.
     */
    requestQuotation(sessionToken: string, leadId: bigint, quotationRefId: string): Promise<{
        __kind__: "ok";
        ok: QuotationRequest;
    } | {
        __kind__: "err";
        err: string;
    }>;
    seedDistricts(): Promise<Array<string>>;
    /**
     * / Admin-only: enable or disable sales staff from creating and self-assigning their own leads.
     */
    setSalesLeadGenerationToggle(sessionToken: string, enabled: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
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
    updateQuotation(sessionToken: string, id: string, data: QuotationInput): Promise<{
        __kind__: "ok";
        ok: Quotation;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateQuotationStatus(sessionToken: string, id: string, status: QuotationStatus): Promise<{
        __kind__: "ok";
        ok: Quotation;
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
