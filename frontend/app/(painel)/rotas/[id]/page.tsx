import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BotaoApi } from "@/components/BotaoApi";
import { MapaRota } from "@/components/MapaRota";
import { Cabecalho, CelulaDupla, ErroCard, Estatistica, LinkBotao, Pill, Vazio } from "@/components/ui";
import { data, moeda, numero, rotulo, telefone } from "@/lib/format";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Escola, Rota } from "@/lib/types";

export const metadata: Metadata = { title: "Rota" };

export default async function DetalheRota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = (await usuarioAtual())!;
  const opera = pode(usuario.cargo, "operar");

  const [r, escola] = await Promise.all([buscar<Rota>(`/api/rotas/${id}`), buscar<Escola>("/api/escola")]);
  if (!r.ok) {
    if (r.status === 404 || r.status === 422) notFound();
    return <ErroCard mensagem={r.erro} />;
  }
  if (!escola.ok) return <ErroCard mensagem={escola.erro} />;

  const rota = r.dados;
  const paradas = [...rota.paradas].sort((a, b) => a.ordem - b.ordem);
  const planejada = rota.status === "planejada";
  const andamento = rota.status === "em_andamento";
  const base = `/api/rotas/${rota.id}`;
  const semGeometria = rota.geometria.length === 0;

  // Nova ordem das paradas ao subir/descer uma posição.
  const trocar = (i: number, delta: number) => {
    const ids = paradas.map((p) => p.id);
    [ids[i], ids[i + delta]] = [ids[i + delta], ids[i]];
    return { parada_ids: ids };
  };

  return (
    <>
      <Cabecalho
        titulo={rota.nome}
        subtitulo={
          <>
            {data(rota.data)} · {rotulo(rota.turno)} · {rotulo(rota.tipo)} <Pill valor={rota.status} />
          </>
        }
        acoes={
          opera && (
            <>
              {(planejada || andamento) && (
                <BotaoApi texto={rota.otimizada_em ? "Recalcular trajeto" : "Calcular melhor trajeto"} url={`${base}/otimizar`} sucesso="Trajeto calculado." classe="" />
              )}
              {planejada && <LinkBotao href={`/rotas/${rota.id}/editar`} classe="btn-ghost">Editar</LinkBotao>}
              {planejada && <BotaoApi texto="Iniciar rota" url={`${base}/iniciar`} sucesso="Rota iniciada." classe="btn-ghost" />}
              {andamento && <BotaoApi texto="Concluir" url={`${base}/concluir`} sucesso="Rota concluída." classe="btn-ghost" />}
              {(planejada || andamento) && <BotaoApi texto="Cancelar" url={`${base}/cancelar`} sucesso="Rota cancelada." classe="btn-danger" confirmar="Cancelar esta rota?" />}
            </>
          )
        }
      />

      <section className="grid-stats" aria-label="Resumo da rota">
        <Estatistica titulo="Distância" destaque valor={rota.distancia_total_km != null ? numero(rota.distancia_total_km, 1) : "—"} pequeno={rota.distancia_total_km != null ? "km" : undefined} />
        <Estatistica titulo="Tempo estimado" valor={rota.tempo_estimado_min ?? "—"} pequeno={rota.tempo_estimado_min != null ? "min" : undefined} />
        <Estatistica titulo="Combustível" valor={rota.litros_estimados != null ? numero(rota.litros_estimados, 1) : "—"} pequeno={rota.litros_estimados != null ? "L" : undefined} nota={moeda(rota.custo_combustivel)} />
        <Estatistica
          titulo="Alunos"
          valor={rota.total_embarcados}
          pequeno={`/ ${rota.total_alunos} embarcados`}
          nota={`${rota.motorista?.nome ?? "Sem motorista"} · ${rota.veiculo?.placa ?? "Sem veículo"}`}
        />
      </section>

      <section className="card mapa-card">
        <div className="card-head">
          <h2>Trajeto</h2>
          {semGeometria && <span className="cell-sub">Trajeto ainda não calculado — as linhas tracejadas ligam as paradas em linha reta.</span>}
        </div>
        <MapaRota escola={escola.dados} paradas={paradas} geometria={rota.geometria} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Paradas</h2>
        </div>
        {paradas.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Aluno</th>
                  <th>Endereço</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {paradas.map((p, i) => (
                  <tr key={p.id}>
                    <td><span className="ordem">{p.ordem}</span></td>
                    <CelulaDupla
                      principal={p.aluno.nome}
                      secundario={[p.aluno.responsavel_nome, p.aluno.responsavel_telefone ? telefone(p.aluno.responsavel_telefone) : null].filter(Boolean).join(" ")}
                    />
                    <td>{p.aluno.endereco}</td>
                    <td><Pill valor={p.status} /></td>
                    <td className="acoes">
                      {opera && planejada && (
                        <>
                          <BotaoApi texto="↑" titulo="Subir" url={`${base}/reordenar`} corpo={i > 0 ? trocar(i, -1) : undefined} desabilitado={i === 0} sucesso="Ordem das paradas atualizada." />
                          <BotaoApi texto="↓" titulo="Descer" url={`${base}/reordenar`} corpo={i < paradas.length - 1 ? trocar(i, 1) : undefined} desabilitado={i === paradas.length - 1} sucesso="Ordem das paradas atualizada." />
                        </>
                      )}
                      {opera && andamento &&
                        ([["embarcado", "Embarcou"], ["nao_compareceu", "Faltou"], ["pendente", "Desfazer"]] as const)
                          .filter(([novo]) => novo !== p.status)
                          .map(([novo, texto]) => <BotaoApi key={novo} texto={texto} url={`/api/rotas/paradas/${p.id}`} corpo={{ status: novo }} />)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Vazio>Esta rota não tem paradas.</Vazio>
        )}
      </section>
    </>
  );
}
