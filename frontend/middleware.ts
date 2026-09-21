// Barreira de acesso: sem cookie de sessão, qualquer tela do painel vai para /login.
// (A validade do token é conferida no layout do painel, no servidor.)

import { NextRequest, NextResponse } from "next/server";

const COOKIE_SESSAO = "edumobil_session";

export function middleware(req: NextRequest) {
  if (req.cookies.get(COOKIE_SESSAO)?.value) return NextResponse.next();

  const url = req.nextUrl.clone();
  const destino = req.nextUrl.pathname + req.nextUrl.search;
  url.pathname = "/login";
  url.search = destino !== "/" ? `?next=${encodeURIComponent(destino)}` : "";
  return NextResponse.redirect(url);
}

export const config = {
  // Fora: login, proxy da API, rotas de sessão, arquivos do Next e arquivos estáticos (logo, ícones).
  matcher: ["/((?!login|api|auth|_next|.*\\..*).*)"],
};
