import type { Metadata } from "next";

import { FormUsuario } from "@/components/FormUsuario";
import { Cabecalho, SemPermissao } from "@/components/ui";
import { pode } from "@/lib/permissoes";
import { usuarioAtual } from "@/lib/servidor";

export const metadata: Metadata = { title: "Novo usuário" };

export default async function NovoUsuario() {
  const eu = (await usuarioAtual())!;
  if (!pode(eu.cargo, "admin")) return <SemPermissao />;

  return (
    <>
      <Cabecalho titulo="Novo usuário" />
      <FormUsuario />
    </>
  );
}
