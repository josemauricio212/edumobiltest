// Proxy da API: o navegador chama /api/* no Next e o Next repassa ao FastAPI,
// anexando o token que está no cookie httpOnly da sessão.

import { NextRequest, NextResponse } from "next/server";

import { API_URL, tokenDaSessao } from "@/lib/servidor";

export const dynamic = "force-dynamic";

async function repassar(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const destino = `${API_URL}/api/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers({ Accept: "application/json" });
  const tipo = req.headers.get("content-type");
  if (tipo) headers.set("Content-Type", tipo);
  const token = await tokenDaSessao();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const temCorpo = req.method !== "GET" && req.method !== "HEAD";

  let resposta: Response;
  try {
    resposta = await fetch(destino, {
      method: req.method,
      headers,
      body: temCorpo ? await req.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível. Tente novamente em instantes." }, { status: 502 });
  }

  return new NextResponse(resposta.status === 204 ? null : resposta.body, {
    status: resposta.status,
    headers: { "Content-Type": resposta.headers.get("content-type") ?? "application/json" },
  });
}

export { repassar as GET, repassar as POST, repassar as PUT, repassar as PATCH, repassar as DELETE };
