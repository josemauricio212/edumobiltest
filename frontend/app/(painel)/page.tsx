import type { Metadata } from "next";
import Link from "next/link";

import { CelulaMotoristaVeiculo, CelulaProgresso, CelulaRota } from "@/components/CelulasRota";
import { Cabecalho, ErroCard, Estatistica, LinkBotao, Pill, Vazio } from "@/components/ui";
import { data, hoje, numero, plural } from "@/lib/format";
import { pode } from "@/lib/permissoes";
import { buscar, dados, primeiroErro, usuarioAtual } from "@/lib/servidor";
import type { Aluno, Escola, Motorista, Rota, Veiculo } from "@/lib/types";

export const metadata: Metadata = { title: "Painel" };

export default async function Painel() {
  const usuario = (await usuarioAtual())!;
  const dia = hoje();

  const [alunos, motoristas, veiculos, rotasHoje, emAndamento, escola] = await Promise.all([
    buscar<Aluno[]>("/api/alunos"),
    buscar<Motorista[]>("/api/motoristas"),
    buscar<Veiculo[]>("/api/veiculos"),
    buscar<Rota[]>("/api/rotas", { data_inicio: dia, data_fim: dia }),
    buscar<Rota[]>("/api/rotas", { status: "em_andamento" }),
    buscar<Escola>("/api/escola"),
  ]);

  const erro = primeiroErro(alunos, motoristas, veiculos, rotasHoje, emAndamento, escola);
  if (erro) return <ErroCard mensagem={erro} />;

  const listaAlunos = dados(alunos, []);
  const listaVeiculos = dados(veiculos, []);
  const rotas = dados(rotasHoje, []);
  const dadosEscola = dados(escola, null as Escola | null);
  const escolaConfigurada = Boolean(dadosEscola?.endereco) && (dadosEscola?.latitude !== 0 || dadosEscola?.longitude !== 0);

  return (
    <>
      <Cabecalho
        titulo={`Olá, ${usuario.nome.split(" ")[0]}`}
        subtitulo={`Resumo de hoje, ${data(dia)}.`}
        acoes={pode(usuario.cargo, "operar") && <LinkBotao href="/rotas/nova" icone="plus">Nova rota</LinkBotao>}
      />

      {!escolaConfigurada && (
        <div className="alert alert-warn" role="status">
          <strong>Escola não configurada.</strong>
          <span>
            Defina o endereço da escola antes de calcular rotas. <Link href="/escola"><u>Configurar agora</u></Link>
          </span>
        </div>
      )}

      <section className="grid-stats" aria-label="Indicadores">
        <Estatistica titulo="Rotas em andamento" valor={dados(emAndamento, []).length} destaque />
        <Estatistica titulo="Alunos ativos" valor={listaAlunos.filter((a) => a.status === "ativo").length} pequeno={`/ ${listaAlunos.length}`} />
        <Estatistica titulo="Motoristas ativos" valor={dados(motoristas, []).filter((m) => m.ativo).length} />
        <Estatistica titulo="Veículos disponíveis" valor={listaVeiculos.filter((v) => v.status === "disponivel").length} pequeno={`/ ${listaVeiculos.length}`} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Rotas de hoje</h2>
          <span className="cell-sub">{plural(rotas.length, "rota")}</span>
        </div>
        {rotas.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rota</th>
                  <th>Motorista / veículo</th>
                  <th>Status</th>
                  <th>Embarque</th>
                  <th className="num">Distância</th>
                  <th className="num">Tempo</th>
                </tr>
              </thead>
              <tbody>
                {rotas.map((r) => (
                  <tr key={r.id}>
                    <CelulaRota rota={r} />
                    <CelulaMotoristaVeiculo rota={r} />
                    <td><Pill valor={r.status} /></td>
                    <CelulaProgresso rota={r} />
                    <td className="num">{r.distancia_total_km != null ? `${numero(r.distancia_total_km, 1)} km` : "—"}</td>
                    <td className="num">{r.tempo_estimado_min != null ? `${r.tempo_estimado_min} min` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Vazio icone="route">Nenhuma rota programada para hoje.</Vazio>
        )}
      </section>
    </>
  );
}
