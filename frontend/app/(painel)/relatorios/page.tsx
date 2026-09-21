import type { Metadata } from "next";
import Link from "next/link";

import { CelulaMotoristaVeiculo, CelulaRota } from "@/components/CelulasRota";
import { Cabecalho, ErroCard, Estatistica, Pill, Vazio } from "@/components/ui";
import { data, diasAtras, hoje, moeda, numero, rotulo } from "@/lib/format";
import { buscar, primeiroErro } from "@/lib/servidor";
import type { Relatorio, Rota } from "@/lib/types";

export const metadata: Metadata = { title: "Relatórios" };

const PERIODOS = [[7, "7 dias"], [30, "30 dias"], [90, "90 dias"], [365, "1 ano"]] as const;

function Barra({ texto, valor, total, classe }: { texto: string; valor: number; total: number; classe: string }) {
  const pct = total ? (valor * 100) / total : 0;
  return (
    <div className="bar-row">
      <span>{texto}</span>
      <span className="bar-track">
        <span className={`bar-fill ${classe}`} style={{ width: `${pct}%` }} />
      </span>
      <b>{valor}</b>
    </div>
  );
}

export default async function Relatorios({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const { dias: diasParam } = await searchParams;
  const dias = PERIODOS.some(([d]) => d === Number(diasParam)) ? Number(diasParam) : 30;
  const inicio = diasAtras(dias);
  const fim = hoje();

  const [resumo, rotas] = await Promise.all([
    buscar<Relatorio>("/api/rotas/relatorio", { data_inicio: inicio, data_fim: fim }),
    buscar<Rota[]>("/api/rotas", { data_inicio: inicio, data_fim: fim }),
  ]);
  const erro = primeiroErro(resumo, rotas);
  if (erro || !resumo.ok || !rotas.ok) return <ErroCard mensagem={erro ?? "Erro ao carregar dados."} />;

  const r = resumo.dados;
  const presentes = r.alunos_embarcados + r.alunos_ausentes;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Relatórios</h1>
          <p>
            {data(inicio)} a {data(fim)}
          </p>
        </div>
        <nav className="segmented" aria-label="Período">
          {PERIODOS.map(([d, texto]) => (
            <Link key={d} href={`/relatorios?dias=${d}`} aria-current={d === dias ? "true" : undefined}>
              {texto}
            </Link>
          ))}
        </nav>
      </header>

      <section className="grid-stats" aria-label="Totais do período">
        <Estatistica titulo="Rotas no período" valor={r.total_rotas} destaque />
        <Estatistica titulo="Distância percorrida" valor={numero(r.distancia_total_km, 1)} pequeno="km" />
        <Estatistica titulo="Custo de combustível" valor={moeda(r.custo_total)} />
        <Estatistica titulo="Alunos transportados" valor={r.alunos_embarcados} nota={`${r.alunos_ausentes} ausente${r.alunos_ausentes === 1 ? "" : "s"}`} />
      </section>

      <section className="two-col">
        <div className="card">
          <div className="card-head"><h2>Rotas por status</h2></div>
          <div className="card-body bars">
            <Barra texto={rotulo("planejada")} valor={r.planejadas} total={r.total_rotas} classe="c-planejada" />
            <Barra texto={rotulo("em_andamento")} valor={r.em_andamento} total={r.total_rotas} classe="c-em_andamento" />
            <Barra texto={rotulo("concluida")} valor={r.concluidas} total={r.total_rotas} classe="c-concluida" />
            <Barra texto={rotulo("cancelada")} valor={r.canceladas} total={r.total_rotas} classe="c-cancelada" />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Presença dos alunos</h2></div>
          <div className="card-body bars">
            <Barra texto="Embarcaram" valor={r.alunos_embarcados} total={presentes} classe="c-embarcado" />
            <Barra texto="Ausentes" valor={r.alunos_ausentes} total={presentes} classe="c-ausente" />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Rotas do período</h2></div>
        {rotas.dados.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Rota</th>
                  <th>Motorista / veículo</th>
                  <th>Status</th>
                  <th className="num">Alunos</th>
                  <th className="num">Distância</th>
                  <th className="num">Combustível</th>
                  <th className="num">Custo</th>
                </tr>
              </thead>
              <tbody>
                {rotas.dados.map((rota) => (
                  <tr key={rota.id}>
                    <td>{data(rota.data)}</td>
                    <CelulaRota rota={rota} />
                    <CelulaMotoristaVeiculo rota={rota} />
                    <td><Pill valor={rota.status} /></td>
                    <td className="num">{rota.total_embarcados}/{rota.total_alunos}</td>
                    <td className="num">{rota.distancia_total_km != null ? `${numero(rota.distancia_total_km, 1)} km` : "—"}</td>
                    <td className="num">{rota.litros_estimados != null ? `${numero(rota.litros_estimados, 1)} L` : "—"}</td>
                    <td className="num">{moeda(rota.custo_combustivel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Vazio icone="route">Nenhuma rota neste período.</Vazio>
        )}
      </section>
    </>
  );
}
