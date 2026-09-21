import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormMotorista } from "@/components/FormMotorista";
import { Cabecalho, ErroCard, SemPermissao } from "@/components/ui";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Motorista } from "@/lib/types";

export const metadata: Metadata = { title: "Editar motorista" };

export default async function EditarMotorista({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = (await usuarioAtual())!;
  if (!pode(usuario.cargo, "cadastrar")) return <SemPermissao />;

  const r = await buscar<Motorista>(`/api/motoristas/${id}`);
  if (!r.ok) {
    if (r.status === 404 || r.status === 422) notFound();
    return <ErroCard mensagem={r.erro} />;
  }

  return (
    <>
      <Cabecalho titulo="Editar motorista" />
      <FormMotorista motorista={r.dados} />
    </>
  );
}
