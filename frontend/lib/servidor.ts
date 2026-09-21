// Acesso à API a partir do servidor do Next (Server Components e route handlers).
// O token fica no cookie httpOnly; aqui ele é lido e enviado como Bearer.

import { cookies } from "next/headers";
import { cache } from "react";

import { mensagemDeErro } from "./erros";
import type { Usuario } from "./types";

export const API_URL = (process.env.API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
export const COOKIE_SESSAO = "edumobil_session";
export const SESSAO_MINUTOS = Number(process.env.SESSION_MINUTES) || 30;

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string; status: number };

export async function tokenDaSessao(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_SESSAO)?.value;
}

type Consulta = Record<string, string | number | boolean | undefined | null>;

export async function buscar<T>(caminho: string, consulta?: Consulta): Promise<Resultado<T>> {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(consulta ?? {})) {
    if (valor !== undefined && valor !== null && valor !== "" && valor !== false) params.set(chave, String(valor));
  }
  const url = `${API_URL}${caminho}${params.size ? `?${params}` : ""}`;

  const token = await tokenDaSessao();
  try {
    const resposta = await fetch(url, {
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: "no-store",
    });
    const corpo = await resposta.json().catch(() => null);
    if (!resposta.ok) return { ok: false, erro: mensagemDeErro(corpo, resposta.status), status: resposta.status };
    return { ok: true, dados: corpo as T };
  } catch {
    return { ok: false, erro: "API indisponível. Tente novamente em instantes.", status: 502 };
  }
}

/** Usuário logado (uma consulta por requisição, mesmo se várias telas pedirem). */
export const usuarioAtual = cache(async (): Promise<Usuario | null> => {
  if (!(await tokenDaSessao())) return null;
  const r = await buscar<Usuario>("/api/auth/me");
  return r.ok ? r.dados : null;
});

/** Primeira mensagem de erro entre vários resultados (ou null se todos deram certo). */
export function primeiroErro(...resultados: Resultado<unknown>[]): string | null {
  for (const r of resultados) if (!r.ok) return r.erro;
  return null;
}

/** Dados do resultado, ou o valor padrão quando a consulta falhou. */
export function dados<T>(r: Resultado<T>, padrao: T): T {
  return r.ok ? r.dados : padrao;
}
