import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { FormRota } from "@/components/FormRota";
import { Cabecalho, ErroCard, SemPermissao } from "@/components/ui";
import { hoje } from "@/lib/format";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Aluno, Motorista, Rota, Veiculo } from "@/lib/types";

export const metadata: Metadata = { title: "Editar rota" };

export default async function EditarRota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = (await usuarioAtual())!;
  if (!pode(usuario.cargo, "operar")) return <SemPermissao />;

  const [rota, veiculos, motoristas, alunos] = await Promise.all([
    buscar<Rota>(`/api/rotas/${id}`),
    buscar<Veiculo[]>("/api/veiculos"),
    buscar<Motorista[]>("/api/motoristas", { apenas_ativos: true }),
    buscar<Aluno[]>("/api/alunos", { status: "ativo" }),
  ]);

  if (!rota.ok) {
    if (rota.status === 404 || rota.status === 422) notFound();
    return <ErroCard mensagem={rota.erro} />;
  }
  if (!veiculos.ok) return <ErroCard mensagem={veiculos.erro} />;
  if (!motoristas.ok) return <ErroCard mensagem={motoristas.erro} />;
  if (!alunos.ok) return <ErroCard mensagem={alunos.erro} />;

  // Só rotas planejadas podem mudar de composição.
  if (rota.dados.status !== "planejada") redirect(`/rotas/${id}`);

  // Na edição, o veículo atual continua na lista mesmo se já estiver "em rota".
  const atual = rota.dados.veiculo?.id;
  const opcoesVeiculos = veiculos.dados.filter((v) => v.status === "disponivel" || v.id === atual);

  return (
    <>
      <Cabecalho titulo="Editar rota" subtitulo="Escolha o veículo, o motorista e os alunos. A ordem das paradas é calculada depois." />
      <FormRota rota={rota.dados} veiculos={opcoesVeiculos} motoristas={motoristas.dados} alunos={alunos.dados} hoje={hoje()} />
    </>
  );
}
