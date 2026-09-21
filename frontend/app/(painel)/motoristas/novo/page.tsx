import type { Metadata } from "next";

import { FormMotorista } from "@/components/FormMotorista";
import { Cabecalho, SemPermissao } from "@/components/ui";
import { pode } from "@/lib/permissoes";
import { usuarioAtual } from "@/lib/servidor";

export const metadata: Metadata = { title: "Novo motorista" };

export default async function NovoMotorista() {
  const usuario = (await usuarioAtual())!;
  if (!pode(usuario.cargo, "cadastrar")) return <SemPermissao />;

  return (
    <>
      <Cabecalho titulo="Novo motorista" />
      <FormMotorista />
    </>
  );
}
