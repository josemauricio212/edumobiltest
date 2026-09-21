import { NextRequest, NextResponse } from "next/server";

import { API_URL, COOKIE_SESSAO, SESSAO_MINUTOS } from "@/lib/servidor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const corpo = (await req.json().catch(() => ({}))) as { email?: string; senha?: string };

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: corpo.email, senha: corpo.senha }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível. Tente novamente em instantes." }, { status: 502 });
  }

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) return NextResponse.json(dados, { status: resposta.status });

  const saida = NextResponse.json({ usuario: dados.usuario });
  saida.cookies.set(COOKIE_SESSAO, dados.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSAO_MINUTOS * 60,
  });
  return saida;
}
