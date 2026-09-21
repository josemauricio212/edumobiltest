import type { Metadata } from "next";

import { BarraFiltros } from "@/components/BarraFiltros";
import { BotaoApi } from "@/components/BotaoApi";
import { Cabecalho, ErroCard, LinkBotao, Pill, Vazio } from "@/components/ui";
import { plural, telefone } from "@/lib/format";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Motorista } from "@/lib/types";

export const metadata: Metadata = { title: "Motoristas" };

export default async function Motoristas({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const usuario = (await usuarioAtual())!;
  const edita = pode(usuario.cargo, "cadastrar");

  const r = await buscar<Motorista[]>("/api/motoristas", { busca: sp.busca, apenas_ativos: sp.apenas_ativos === "true" });
  if (!r.ok) return <ErroCard mensagem={r.erro} />;
  const motoristas = r.dados;

  return (
    <>
      <Cabecalho
        titulo="Motoristas"
        subtitulo={`${plural(motoristas.length, "motorista")}.`}
        acoes={edita && <LinkBotao href="/motoristas/novo" icone="plus">Novo motorista</LinkBotao>}
      />

      <BarraFiltros
        caminho="/motoristas"
        valores={sp}
        campos={[
          { tipo: "busca", nome: "busca", placeholder: "Nome ou CNH" },
          { tipo: "check", nome: "apenas_ativos", texto: "Somente ativos" },
        ]}
      />

      <section className="card">
        {motoristas.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Motorista</th>
                  <th>Telefone</th>
                  <th>CNH</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {motoristas.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.nome}</strong></td>
                    <td>{telefone(m.telefone)}</td>
                    <td>{m.cnh}</td>
                    <td><Pill valor={m.ativo ? "ativo" : "inativo"} /></td>
                    <td className="acoes">
                      {edita && (
                        <>
                          <LinkBotao href={`/motoristas/${m.id}/editar`} classe="btn-ghost btn-sm">Editar</LinkBotao>
                          <BotaoApi
                            texto={m.ativo ? "Desativar" : "Ativar"}
                            url={`/api/motoristas/${m.id}/alternar-status`}
                            sucesso={`${m.nome} ${m.ativo ? "desativado" : "ativado"}.`}
                          />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Vazio icone="motorista">Nenhum motorista encontrado.</Vazio>
        )}
      </section>
    </>
  );
}
