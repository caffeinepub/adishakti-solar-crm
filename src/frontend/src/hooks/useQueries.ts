import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Lead,
  PipelineStage,
  Requirement,
  UserProfile,
  UserRole,
} from "../backend";
import { createActor } from "../backend";

// ── Auth helpers ───────────────────────────────────────────────────────────

function getToken(): string {
  return localStorage.getItem("crm_session_token") ?? "";
}

// ── Leads ──────────────────────────────────────────────────────────────────

export function useAllLeads() {
  const { actor, isFetching } = useActor(createActor);
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
  const { actor, isFetching } = useActor(createActor);
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
  const { actor, isFetching } = useActor(createActor);
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
  const { actor, isFetching } = useActor(createActor);
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
  const { actor, isFetching } = useActor(createActor);
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
  const { actor } = useActor(createActor);
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
  const { actor } = useActor(createActor);
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
  const { actor } = useActor(createActor);
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
  const { actor } = useActor(createActor);
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
  const { actor } = useActor(createActor);
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
  const { actor } = useActor(createActor);
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
  const { actor, isFetching } = useActor(createActor);
  return useQuery<string[]>({
    queryKey: ["districts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDistricts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddDistrict() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      const token = getToken();
      const res = await actor.addDistrict(token, name);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["districts"] });
    },
  });
}

// ── Users ──────────────────────────────────────────────────────────────────

export function useAllUsers() {
  const { actor, isFetching } = useActor(createActor);
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
  const { actor } = useActor(createActor);
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
  const { actor } = useActor(createActor);
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
  const { actor } = useActor(createActor);
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
