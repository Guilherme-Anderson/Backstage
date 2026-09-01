import type { Database } from "@/lib/database.types";

type AssignmentStatus = Database["public"]["Enums"]["assignment_status"];
type AppRole = Database["public"]["Enums"]["app_role"];
type ServiceBlock = Database["public"]["Enums"]["service_block"];
type SwapStatus = Database["public"]["Enums"]["swap_status"];

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  unfilled: "Vaga aberta",
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  declined: "Não poderá",
};

export const ASSIGNMENT_STATUS_TONE: Record<
  AssignmentStatus,
  "neutral" | "amber" | "green" | "red"
> = {
  unfilled: "neutral",
  pending: "amber",
  confirmed: "green",
  declined: "red",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin_geral: "Administrador geral",
  coordenador: "Coordenador",
  membro: "Membro",
};

export const BLOCK_LABEL: Record<ServiceBlock, string> = {
  wednesday: "Quarta-feira",
  sunday: "Domingo (manhã + noite)",
};

export const SWAP_STATUS_LABEL: Record<SwapStatus, string> = {
  open: "Aberta",
  resolved: "Resolvida",
  cancelled: "Cancelada",
};

export const APP_NAME = "Backstage";
