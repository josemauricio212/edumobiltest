// Espelha as regras de cargo da API, para esconder botões que dariam 403.

import type { Cargo } from "./types";

export type Acao = "cadastrar" | "operar" | "admin";

const PERMISSOES: Record<Exclude<Acao, "admin">, Cargo[]> = {
  cadastrar: ["cadastral", "chefetransporte"],
  operar: ["chefetransporte"],
};

/** O administrador sempre pode. */
export function pode(cargo: Cargo | undefined, acao: Acao): boolean {
  if (!cargo) return false;
  if (cargo === "admin") return true;
  if (acao === "admin") return false;
  return PERMISSOES[acao].includes(cargo);
}
