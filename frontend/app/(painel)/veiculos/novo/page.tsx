import type { Metadata } from "next";

import { FormVeiculo } from "@/components/FormVeiculo";
import { Cabecalho, ErroCard, SemPermissao } from "@/components/ui";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Motorista } from "@/lib/types";

export const metadata: Metadata = { title: "Novo veículo" };

export default async function NovoVeiculo() {
  const usuario = (await usuarioAtual())!;
  if (!pode(usuario.cargo, "cadastrar")) return <SemPermissao />;

  const motoristas = await buscar<Motorista[]>("/api/motoristas", { apenas_ativos: true });
  if (!motoristas.ok) return <ErroCard mensagem={motoristas.erro} />;

  return (
    <>
      <Cabecalho titulo="Novo veículo" />
      <FormVeiculo motoristas={motoristas.dados} />
    </>
  );
}
