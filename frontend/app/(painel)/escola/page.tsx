import type { Metadata } from "next";

import { FormEscola } from "@/components/FormEscola";
import { Alerta, Cabecalho, ErroCard } from "@/components/ui";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Escola } from "@/lib/types";

export const metadata: Metadata = { title: "Escola" };

export default async function PaginaEscola() {
  const usuario = (await usuarioAtual())!;
  const editavel = pode(usuario.cargo, "operar");

  const r = await buscar<Escola>("/api/escola");
  if (!r.ok) return <ErroCard mensagem={r.erro} />;

  return (
    <>
      <Cabecalho titulo="Escola" subtitulo="Ponto de partida das rotas e parâmetros de cálculo." />
      {!editavel && <Alerta tipo="warn">Somente o chefe de transporte ou o administrador podem alterar estes dados.</Alerta>}
      <FormEscola escola={r.dados} editavel={editavel} />
    </>
  );
}
