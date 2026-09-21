import type { Metadata } from "next";

import { BarraFiltros } from "@/components/BarraFiltros";
import { Cabecalho, CelulaDupla, ErroCard, LinkBotao, Pill, Vazio } from "@/components/ui";
import { STATUS_VEICULO } from "@/lib/constantes";
import { numero, plural } from "@/lib/format";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Veiculo } from "@/lib/types";

export const metadata: Metadata = { title: "Veículos" };

export default async function Veiculos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const usuario = (await usuarioAtual())!;
  const edita = pode(usuario.cargo, "cadastrar");

  const r = await buscar<Veiculo[]>("/api/veiculos", { busca: sp.busca, status: sp.status });
  if (!r.ok) return <ErroCard mensagem={r.erro} />;
  const veiculos = r.dados;

  return (
    <>
      <Cabecalho
        titulo="Veículos"
        subtitulo={`${plural(veiculos.length, "veículo")}.`}
        acoes={edita && <LinkBotao href="/veiculos/novo" icone="plus">Novo veículo</LinkBotao>}
      />

      <BarraFiltros
        caminho="/veiculos"
        valores={sp}
        campos={[
          { tipo: "busca", nome: "busca", placeholder: "Placa, modelo ou tipo" },
          { tipo: "select", nome: "status", todos: "Todas as situações", opcoes: STATUS_VEICULO },
        ]}
      />

      <section className="card">
        {veiculos.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Veículo</th>
                  <th className="num">Capacidade</th>
                  <th className="num">Consumo</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {veiculos.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.placa}</strong></td>
                    <CelulaDupla principal={v.modelo} secundario={`${v.tipo} · ${v.ano}`} forte={false} />
                    <td className="num">{Math.trunc(v.capacidade)} alunos</td>
                    <td className="num">{numero(v.consumo_medio, 1)} km/L</td>
                    <td><Pill valor={v.status} /></td>
                    <td className="acoes">{edita && <LinkBotao href={`/veiculos/${v.id}/editar`} classe="btn-ghost btn-sm">Editar</LinkBotao>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Vazio icone="bus">Nenhum veículo encontrado.</Vazio>
        )}
      </section>
    </>
  );
}
