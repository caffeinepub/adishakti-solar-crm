import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { District, Lead, UserApprovalInfo, UserProfile } from "../backend";
import type { ApprovalStatus, PipelineStage } from "../backend";
import { useActor } from "./useActor";

// ── Leads ──────────────────────────────────────────────────────────────────

export function useAllLeads() {
  const { actor, isFetching } = useActor();
  return useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLeads();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLeadsByDistrict(district: District | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Lead[]>({
    queryKey: ["leads", "district", district],
    queryFn: async () => {
      if (!actor || !district) return [];
      return actor.getLeadsByDistrict(district);
    },
    enabled: !!actor && !isFetching && !!district,
  });
}

export function useTotalLeadsCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["leads", "total"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalLeadsCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLeadsAddedToday() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["leads", "today"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getLeadsAddedToday();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLeadsByStageCount() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[PipelineStage, bigint]>>({
    queryKey: ["leads", "stageCount"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeadsByStageCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyLeads() {
  const { actor, isFetching } = useActor();
  return useQuery<Lead[]>({
    queryKey: ["leads", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyLeads();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Lead Mutations ─────────────────────────────────────────────────────────

export function useAddLead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Lead) => {
      if (!actor) throw new Error("Not connected");
      return actor.addLead(lead);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, lead }: { id: bigint; lead: Lead }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateLead(id, lead);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLeadStage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      stage,
      notes,
    }: { id: bigint; stage: PipelineStage; notes: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateLeadStage(id, stage, notes);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useAssignLeadToSales() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      salesPerson,
    }: { leadId: bigint; salesPerson: Principal }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignLeadToSales(leadId, salesPerson);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useAssignLeadToOperations() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      opsPerson,
    }: { leadId: bigint; opsPerson: Principal }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignLeadToOperations(leadId, opsPerson);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// ── Districts ──────────────────────────────────────────────────────────────

export function useAllDistricts() {
  const { actor, isFetching } = useActor();
  return useQuery<District[]>({
    queryKey: ["districts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDistricts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddDistrict() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (district: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.addDistrict(district);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["districts"] });
    },
  });
}

// ── Users ──────────────────────────────────────────────────────────────────

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerProfile() {
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

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsApproved() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isApproved"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();
  return useQuery<UserApprovalInfo[]>({
    queryKey: ["approvals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.addUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.requestApproval();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isApproved"] });
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      status,
    }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useSeedDistricts() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (districts: string[]) => {
      if (!actor) throw new Error("Not connected");
      await Promise.all(districts.map((d) => actor.addDistrict(d)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["districts"] });
    },
  });
}
