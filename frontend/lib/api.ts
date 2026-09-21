// Cliente da API para o navegador. Tudo passa pelo proxy do próprio Next (/api/*),
// que anexa o token da sessão; o JavaScript da página nunca vê o token.

import { ApiError, mensagemDeErro } from "./erros";

export { ApiError };

type Metodo = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

async function chamar<T>(metodo: Metodo, url: string, corpo?: unknown): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: { Accept: "application/json", ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("Sem conexão com o servidor.", 0);
  }

  if (resposta.status === 204) return null as T;
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // 401 fora do login = sessão expirada: limpa o cookie e volta ao login.
    if (resposta.status === 401 && !url.startsWith("/auth/")) {
      await fetch("/auth/logout", { method: "POST" }).catch(() => {});
      window.location.href = "/login";
    }
    throw new ApiError(mensagemDeErro(dados, resposta.status), resposta.status);
  }
  return dados as T;
}

const get = <T,>(url: string) => chamar<T>("GET", url);
const post = <T,>(url: string, corpo?: unknown) => chamar<T>("POST", url, corpo);
const patch = <T,>(url: string, corpo: unknown) => chamar<T>("PATCH", url, corpo);
const put = <T,>(url: string, corpo: unknown) => chamar<T>("PUT", url, corpo);
const apagar = <T,>(url: string) => chamar<T>("DELETE", url);

type Dados = Record<string, unknown>;

export const api = {
  login: (email: string, senha: string) => post<{ usuario: unknown }>("/auth/login", { email, senha }),
  logout: () => post<null>("/auth/logout"),
  primeiroAcesso: (dados: Dados) => post<unknown>("/api/auth/primeiro-acesso", dados),

  alunos: {
    criar: (dados: Dados) => post<{ id: string; nome: string }>("/api/alunos", dados),
    atualizar: (id: string, dados: Dados) => patch<unknown>(`/api/alunos/${id}`, dados),
    alternarStatus: (id: string) => post<unknown>(`/api/alunos/${id}/alternar-status`),
    excluir: (id: string) => apagar<null>(`/api/alunos/${id}`),
  },
  motoristas: {
    criar: (dados: Dados) => post<{ id: string; nome: string }>("/api/motoristas", dados),
    atualizar: (id: string, dados: Dados) => patch<unknown>(`/api/motoristas/${id}`, dados),
    alternarStatus: (id: string) => post<unknown>(`/api/motoristas/${id}/alternar-status`),
  },
  veiculos: {
    criar: (dados: Dados) => post<{ id: string; placa: string }>("/api/veiculos", dados),
    atualizar: (id: string, dados: Dados) => patch<unknown>(`/api/veiculos/${id}`, dados),
  },
  escola: {
    salvar: (dados: Dados) => put<unknown>("/api/escola", dados),
  },
  rotas: {
    criar: (dados: Dados) => post<{ id: string }>("/api/rotas", dados),
    atualizar: (id: string, dados: Dados) => patch<unknown>(`/api/rotas/${id}`, dados),
    otimizar: (id: string) => post<unknown>(`/api/rotas/${id}/otimizar`),
    reordenar: (id: string, paradaIds: string[]) => post<unknown>(`/api/rotas/${id}/reordenar`, { parada_ids: paradaIds }),
    iniciar: (id: string) => post<unknown>(`/api/rotas/${id}/iniciar`),
    concluir: (id: string) => post<unknown>(`/api/rotas/${id}/concluir`),
    cancelar: (id: string) => post<unknown>(`/api/rotas/${id}/cancelar`),
    marcarParada: (paradaId: string, status: string) => post<unknown>(`/api/rotas/paradas/${paradaId}`, { status }),
  },
  usuarios: {
    criar: (dados: Dados) => post<{ id: string; nome: string }>("/api/usuarios", dados),
    atualizar: (id: string, dados: Dados) => patch<unknown>(`/api/usuarios/${id}`, dados),
    alternarStatus: (id: string) => post<unknown>(`/api/usuarios/${id}/alternar-status`),
  },
};

/** Chamada genérica (usada pelos botões de ação das telas). */
export const requisitar = chamar;
