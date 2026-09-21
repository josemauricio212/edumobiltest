import { NextResponse } from "next/server";

import { COOKIE_SESSAO } from "@/lib/servidor";

export const dynamic = "force-dynamic";

export async function POST() {
  const saida = new NextResponse(null, { status: 204 });
  saida.cookies.set(COOKIE_SESSAO, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return saida;
}
