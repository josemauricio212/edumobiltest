import type { Metadata } from "next";

import { FormRota } from "@/components/FormRota";
import { Cabecalho, ErroCard, SemPermissao } from "@/components/ui";
import { hoje } from "@/lib/format";
import { pode } from "@/lib/permissoes";
import { buscar, primeiroErro, usuarioAtual } from "@/lib/servidor";
import type { Aluno, Motorista, Veiculo } from "@/lib/types";

export const metadata: Metadata = { title: "Nova rota" };

export default async function NovaRota() {
  const usuario = (await usuarioAtual())!;
  if (!pode(usuario.cargo, "operar")) return <SemPermissao />;

  const [veiculos, motoristas, alunos] = await Promise.all([
    buscar<Veiculo[]>("/api/veiculos", { status: "disponivel" }),
    buscar<Motorista[]>("/api/motoristas", { apenas_ativos: true }),
    buscar<Aluno[]>("/api/alunos", { status: "ativo" }),
  ]);
  const erro = primeiroErro(veiculos, motoristas, alunos);
  if (erro || !veiculos.ok || !motoristas.ok || !alunos.ok) return <ErroCard mensagem={erro ?? "Erro ao carregar dados."} />;

  return (
    <>
      <Cabecalho titulo="Nova rota" subtitulo="Escolha o veículo, o motorista e os alunos. A ordem das paradas é calculada depois." />
      <FormRota veiculos={veiculos.dados} motoristas={motoristas.dados} alunos={alunos.dados} hoje={hoje()} />
    </>
  );
}
