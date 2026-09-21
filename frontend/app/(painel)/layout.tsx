import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Shell } from "@/components/Shell";
import { usuarioAtual } from "@/lib/servidor";

// A sessão é validada no servidor a cada requisição; token inválido/expirado volta ao login.
export default async function LayoutPainel({ children }: { children: ReactNode }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  return <Shell usuario={usuario}>{children}</Shell>;
}
