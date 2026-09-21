import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormAluno } from "@/components/FormAluno";
import { Cabecalho, ErroCard, SemPermissao } from "@/components/ui";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Aluno } from "@/lib/types";

export const metadata: Metadata = { title: "Editar aluno" };

export default async function EditarAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = (await usuarioAtual())!;
  if (!pode(usuario.cargo, "cadastrar")) return <SemPermissao />;

  const r = await buscar<Aluno>(`/api/alunos/${id}`);
  if (!r.ok) {
    if (r.status === 404 || r.status === 422) notFound();
    return <ErroCard mensagem={r.erro} />;
  }

  return (
    <>
      <Cabecalho titulo="Editar aluno" subtitulo="A localização da casa do aluno é usada para montar a rota." />
      <FormAluno aluno={r.dados} />
    </>
  );
}
