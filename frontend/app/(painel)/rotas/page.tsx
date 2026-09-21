import type { Metadata } from "next";

import { BarraFiltros } from "@/components/BarraFiltros";
import { CelulaMotoristaVeiculo, CelulaRota } from "@/components/CelulasRota";
import { Cabecalho, ErroCard, LinkBotao, Pill, Vazio } from "@/components/ui";
import { STATUS_ROTA, TURNOS } from "@/lib/constantes";
import { data, numero, plural } from "@/lib/format";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Rota } from "@/lib/types";

export const metadata: Metadata = { title: "Rotas" };

export default async function Rotas({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const usuario = (await usuarioAtual())!;

  const r = await buscar<Rota[]>("/api/rotas", { status: sp.status, turno: sp.turno });
  if (!r.ok) return <ErroCard mensagem={r.erro} />;
  const rotas = r.dados;

  return (
    <>
      <Cabecalho
        titulo="Rotas"
        subtitulo={`${plural(rotas.length, "rota")}.`}
        acoes={pode(usuario.cargo, "operar") && <LinkBotao href="/rotas/nova" icone="plus">Nova rota</LinkBotao>}
      />

      <BarraFiltros
        caminho="/rotas"
        valores={sp}
        campos={[
          { tipo: "select", nome: "status", todos: "Todos os status", opcoes: STATUS_ROTA },
          { tipo: "select", nome: "turno", todos: "Todos os turnos", opcoes: TURNOS },
        ]}
      />

      <section className="card">
        {rotas.length ? (
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
                  <th className="num">Tempo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rotas.map((rota) => (
                  <tr key={rota.id}>
                    <td>{data(rota.data)}</td>
                    <CelulaRota rota={rota} />
                    <CelulaMotoristaVeiculo rota={rota} />
                    <td><Pill valor={rota.status} /></td>
                    <td className="num">{rota.total_alunos}</td>
                    <td className="num">{rota.distancia_total_km != null ? `${numero(rota.distancia_total_km, 1)} km` : "—"}</td>
                    <td className="num">{rota.tempo_estimado_min != null ? `${rota.tempo_estimado_min} min` : "—"}</td>
                    <td className="acoes"><LinkBotao href={`/rotas/${rota.id}`} classe="btn-ghost btn-sm">Abrir</LinkBotao></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Vazio icone="route">Nenhuma rota encontrada.</Vazio>
        )}
      </section>
    </>
  );
}
