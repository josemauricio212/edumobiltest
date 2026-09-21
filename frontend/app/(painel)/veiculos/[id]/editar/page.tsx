import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormVeiculo } from "@/components/FormVeiculo";
import { Cabecalho, ErroCard, SemPermissao } from "@/components/ui";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Motorista, Veiculo } from "@/lib/types";

export const metadata: Metadata = { title: "Editar veículo" };

export default async function EditarVeiculo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = (await usuarioAtual())!;
  if (!pode(usuario.cargo, "cadastrar")) return <SemPermissao />;

  const [veiculo, motoristas] = await Promise.all([
    buscar<Veiculo>(`/api/veiculos/${id}`),
    buscar<Motorista[]>("/api/motoristas", { apenas_ativos: true }),
  ]);
  if (!veiculo.ok) {
    if (veiculo.status === 404 || veiculo.status === 422) notFound();
    return <ErroCard mensagem={veiculo.erro} />;
  }
  if (!motoristas.ok) return <ErroCard mensagem={motoristas.erro} />;

  return (
    <>
      <Cabecalho titulo="Editar veículo" />
      <FormVeiculo veiculo={veiculo.dados} motoristas={motoristas.dados} />
    </>
  );
}
