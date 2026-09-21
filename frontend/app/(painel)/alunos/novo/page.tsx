import type { Metadata } from "next";

import { FormAluno } from "@/components/FormAluno";
import { Cabecalho, SemPermissao } from "@/components/ui";
import { pode } from "@/lib/permissoes";
import { usuarioAtual } from "@/lib/servidor";

export const metadata: Metadata = { title: "Novo aluno" };

export default async function NovoAluno() {
  const usuario = (await usuarioAtual())!;
  if (!pode(usuario.cargo, "cadastrar")) return <SemPermissao />;

  return (
    <>
      <Cabecalho titulo="Novo aluno" subtitulo="A localização da casa do aluno é usada para montar a rota." />
      <FormAluno />
    </>
  );
}
