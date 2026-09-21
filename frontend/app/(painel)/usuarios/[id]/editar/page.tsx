import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormUsuario } from "@/components/FormUsuario";
import { Cabecalho, ErroCard, SemPermissao } from "@/components/ui";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Usuario } from "@/lib/types";

export const metadata: Metadata = { title: "Editar usuário" };

export default async function EditarUsuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eu = (await usuarioAtual())!;
  if (!pode(eu.cargo, "admin")) return <SemPermissao />;

  const r = await buscar<Usuario>(`/api/usuarios/${id}`);
  if (!r.ok) {
    if (r.status === 404 || r.status === 422) notFound();
    return <ErroCard mensagem={r.erro} />;
  }

  return (
    <>
      <Cabecalho titulo="Editar usuário" />
      <FormUsuario usuario={r.dados} />
    </>
  );
}
