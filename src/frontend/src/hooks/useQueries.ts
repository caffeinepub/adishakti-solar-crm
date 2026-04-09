import { createActorWithConfig } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Lead,
  PipelineStage,
  QuotationRequest,
  Requirement,
  UserProfile,
  UserRole,
} from "../backend";
import { createActor } from "../backend";
import type { Quotation, QuotationInput, QuotationStatus } from "../types";

// ── Safe Actor ─────────────────────────────────────────────────────────────
// NEVER use useActor() from @caffeineai/core-infrastructure — it calls
// useInternetIdentity() which throws synchronously when InternetIdentityProvider
// is absent. Instead, call createActorWithConfig directly via React Query.
// The queryKey ["crm_actor"] is SHARED with useAuth.ts — so the actor is
// created once and reused across all hooks (React Query deduplicates the call).

function useSafeActor() {
  const actorQuery = useQuery({
    queryKey: ["crm_actor"],
    queryFn: async () => {
      try {
        const actor = await createActorWithConfig(createActor);
        return actor ?? null;
      } catch (err) {
        console.warn("Actor init failed:", err);
        return null;
      }
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  return {
    actor: actorQuery.data ?? null,
    isFetching: actorQuery.isFetching,
  };
}

// ── Auth helpers ───────────────────────────────────────────────────────────

function getToken(): string {
  return localStorage.getItem("crm_session_token") ?? "";
}

// ── Leads ──────────────────────────────────────────────────────────────────

export function useAllLeads() {
  const { actor, isFetching } = useSafeActor();
  const token = getToken();
  return useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      if (!actor || !token) return [];
      const res = await actor.getAllLeads(token);
      return res.__kind__ === "ok" ? res.ok : [];
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useMyLeads() {
  const { actor, isFetching } = useSafeActor();
  const token = getToken();
  return useQuery<Lead[]>({
    queryKey: ["leads", "mine"],
    queryFn: async () => {
      if (!actor || !token) return [];
      const res = await actor.getMyLeads(token);
      return res.__kind__ === "ok" ? res.ok : [];
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useTotalLeadsCount() {
  const { actor, isFetching } = useSafeActor();
  const token = getToken();
  return useQuery<bigint>({
    queryKey: ["leads", "total"],
    queryFn: async () => {
      if (!actor || !token) return BigInt(0);
      const res = await actor.getTotalLeadsCount(token);
      return res.__kind__ === "ok" ? res.ok : BigInt(0);
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useLeadsAddedToday() {
  const { actor, isFetching } = useSafeActor();
  const token = getToken();
  return useQuery<bigint>({
    queryKey: ["leads", "today"],
    queryFn: async () => {
      if (!actor || !token) return BigInt(0);
      const res = await actor.getLeadsAddedToday(token);
      return res.__kind__ === "ok" ? res.ok : BigInt(0);
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useLeadsByStageCount() {
  const { actor, isFetching } = useSafeActor();
  const token = getToken();
  return useQuery<Array<[PipelineStage, bigint]>>({
    queryKey: ["leads", "stageCount"],
    queryFn: async () => {
      if (!actor || !token) return [];
      const res = await actor.getLeadsByStageCount(token);
      return res.__kind__ === "ok" ? res.ok : [];
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

// ── Lead Mutations ─────────────────────────────────────────────────────────

export function useAddLead() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      customerName: string;
      phone: string;
      email: string;
      address: string;
      district: string;
      requirements: Requirement;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.addLead(
        token,
        params.customerName,
        params.phone,
        params.email,
        params.address,
        params.district,
        params.requirements,
        params.notes,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      leadId: bigint;
      customerName: string;
      phone: string;
      email: string;
      address: string;
      district: string;
      requirements: Requirement;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.updateLead(
        token,
        params.leadId,
        params.customerName,
        params.phone,
        params.email,
        params.address,
        params.district,
        params.requirements,
        params.notes,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLeadStage() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      stage: PipelineStage;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.updateLeadStage(
        token,
        params.id,
        params.stage,
        params.notes,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useAssignLeadToSales() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { leadId: bigint; salesUserId: string }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.assignLeadToSales(
        token,
        params.leadId,
        params.salesUserId,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useAssignLeadToOperations() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      leadId: bigint;
      operationsUserId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.assignLeadToOperations(
        token,
        params.leadId,
        params.operationsUserId,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useAddRemark() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { leadId: bigint; content: string }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.addRemark(token, params.leadId, params.content);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// ── Districts ──────────────────────────────────────────────────────────────

export function useAllDistricts() {
  const { actor, isFetching } = useSafeActor();
  return useQuery<string[]>({
    queryKey: ["districts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDistricts();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Users ──────────────────────────────────────────────────────────────────

export function useAllUsers() {
  const { actor, isFetching } = useSafeActor();
  const token = getToken();
  return useQuery<UserProfile[]>({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor || !token) return [];
      const res = await actor.getAllUsers(token);
      return res.__kind__ === "ok" ? res.ok : [];
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useCreateUser() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      userId: string;
      password: string;
      name: string;
      role: UserRole;
      district: string;
      phone: string;
      email: string;
      whatsAppNumber: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.createUser(
        token,
        params.userId,
        params.password,
        params.name,
        params.role,
        params.district,
        params.phone,
        params.email,
        params.whatsAppNumber,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      userId: string;
      name: string;
      district: string;
      phone: string;
      email: string;
      whatsAppNumber: string;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.updateUser(
        token,
        params.userId,
        params.name,
        params.district,
        params.phone,
        params.email,
        params.whatsAppNumber,
        params.isActive,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useChangePassword() {
  const { actor } = useSafeActor();
  return useMutation({
    mutationFn: async (params: { userId: string; newPassword: string }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.changePassword(
        token,
        params.userId,
        params.newPassword,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
    },
  });
}

// ── Delete Mutations ───────────────────────────────────────────────────────

export function useDeleteLead() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: bigint) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.deleteLead(token, leadId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useDeleteUser() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.deleteUser(token, userId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// ── Quotations ─────────────────────────────────────────────────────────────

function parseQuotationStatus(raw: unknown): QuotationStatus {
  if (raw && typeof raw === "object") {
    if ("draft" in (raw as object)) return "draft";
    if ("sent" in (raw as object)) return "sent";
    if ("accepted" in (raw as object)) return "accepted";
    if ("rejected" in (raw as object)) return "rejected";
  }
  return "draft";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuotation(q: any): Quotation {
  return {
    id: String(q.id ?? ""),
    leadId: String(q.leadId ?? ""),
    quotationNumber: String(q.quotationNumber ?? ""),
    createdAt: BigInt(q.createdAt ?? 0),
    updatedAt: BigInt(q.updatedAt ?? 0),
    createdBy: String(q.createdBy ?? ""),
    customerName: String(q.customerName ?? ""),
    customerAddress: String(q.customerAddress ?? ""),
    systemType: String(q.systemType ?? ""),
    panelCapacity: Number(q.panelCapacity ?? 0),
    items: Array.isArray(q.items)
      ? q.items.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (it: any) => ({
            itemName: String(it.itemName ?? ""),
            description: String(it.description ?? ""),
            quantity: Number(it.quantity ?? 0),
            unitPrice: Number(it.unitPrice ?? 0),
          }),
        )
      : [],
    subtotal: Number(q.subtotal ?? 0),
    gstPercent: Number(q.gstPercent ?? 18),
    gstAmount: Number(q.gstAmount ?? 0),
    totalAmount: Number(q.totalAmount ?? 0),
    notes: String(q.notes ?? ""),
    validityDays: Number(q.validityDays ?? 30),
    status: parseQuotationStatus(q.status),
  };
}

export function useQuotationsByLead(leadId: string) {
  const { actor, isFetching } = useSafeActor();
  const token = getToken();
  return useQuery<Quotation[]>({
    queryKey: ["quotations", leadId],
    queryFn: async () => {
      if (!actor || !token || !leadId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (actor as any).getQuotationsByLead(token, leadId);
      if (!Array.isArray(res)) return [];
      return res.map(mapQuotation);
    },
    enabled: !!actor && !isFetching && !!token && !!leadId,
  });
}

export function useCreateQuotation() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { leadId: string; input: QuotationInput }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (actor as any).createQuotation(
        token,
        params.leadId,
        params.input,
      );
      if (res && res.__kind__ === "err") throw new Error(res.err);
      return mapQuotation(res.__kind__ === "ok" ? res.ok : res);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["quotations", vars.leadId] });
    },
  });
}

export function useUpdateQuotation() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      leadId: string;
      input: QuotationInput;
    }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (actor as any).updateQuotation(
        token,
        params.id,
        params.input,
      );
      if (res && res.__kind__ === "err") throw new Error(res.err);
      return mapQuotation(res.__kind__ === "ok" ? res.ok : res);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["quotations", vars.leadId] });
    },
  });
}

export function useUpdateQuotationStatus() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      leadId: string;
      status: QuotationStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const statusCandid = { [params.status]: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (actor as any).updateQuotationStatus(
        token,
        params.id,
        statusCandid,
      );
      if (res && res.__kind__ === "err") throw new Error(res.err);
      return mapQuotation(res.__kind__ === "ok" ? res.ok : res);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["quotations", vars.leadId] });
    },
  });
}

// ── Quotation Request Workflow ─────────────────────────────────────────────

export function useRequestQuotation() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { leadId: bigint; quotationRefId: string }) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.requestQuotation(
        token,
        params.leadId,
        params.quotationRefId,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["quotationRequests"] });
    },
  });
}

export function useGetPendingQuotationRequests() {
  const { actor, isFetching } = useSafeActor();
  const token = getToken();
  return useQuery<QuotationRequest[]>({
    queryKey: ["quotationRequests", "pending"],
    queryFn: async () => {
      if (!actor || !token) return [];
      const res = await actor.getPendingQuotationRequests(token);
      return res.__kind__ === "ok" ? res.ok : [];
    },
    enabled: !!actor && !isFetching && !!token,
    refetchInterval: 30_000,
  });
}

export function useGetAllQuotationRequests() {
  const { actor, isFetching } = useSafeActor();
  const token = getToken();
  return useQuery<QuotationRequest[]>({
    queryKey: ["quotationRequests", "all"],
    queryFn: async () => {
      if (!actor || !token) return [];
      const res = await actor.getAllQuotationRequests(token);
      return res.__kind__ === "ok" ? res.ok : [];
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useConfirmQuotationRequest() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.confirmQuotationRequest(token, requestId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotationRequests"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// ── Sales Lead Generation Toggle ───────────────────────────────────────────

export function useGetSalesLeadGenerationToggle() {
  const { actor, isFetching } = useSafeActor();
  const token = getToken();
  return useQuery<boolean>({
    queryKey: ["salesLeadGenerationToggle"],
    queryFn: async () => {
      if (!actor || !token) return false;
      const res = await actor.getSalesLeadGenerationToggle(token);
      return res.__kind__ === "ok" ? res.ok : false;
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 30_000,
  });
}

export function useSetSalesLeadGenerationToggle() {
  const { actor } = useSafeActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.setSalesLeadGenerationToggle(token, enabled);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salesLeadGenerationToggle"] });
    },
  });
}
