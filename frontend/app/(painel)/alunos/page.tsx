import type { Metadata } from "next";

import { BarraFiltros } from "@/components/BarraFiltros";
import { BotaoApi } from "@/components/BotaoApi";
import { Cabecalho, CelulaDupla, ErroCard, LinkBotao, Pill, Vazio } from "@/components/ui";
import { plural, rotulo, telefone } from "@/lib/format";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Aluno } from "@/lib/types";

export const metadata: Metadata = { title: "Alunos" };

type Params = { searchParams: Promise<Record<string, string | undefined>> };

export default async function Alunos({ searchParams }: Params) {
  const sp = await searchParams;
  const usuario = (await usuarioAtual())!;
  const edita = pode(usuario.cargo, "cadastrar");

  const r = await buscar<Aluno[]>("/api/alunos", { busca: sp.busca, turno: sp.turno, status: sp.status });
  if (!r.ok) return <ErroCard mensagem={r.erro} />;
  const alunos = r.dados;

  return (
    <>
      <Cabecalho
        titulo="Alunos"
        subtitulo={`${plural(alunos.length, "aluno")} encontrado${alunos.length === 1 ? "" : "s"}.`}
        acoes={edita && <LinkBotao href="/alunos/novo" icone="plus">Novo aluno</LinkBotao>}
      />

      <BarraFiltros
        caminho="/alunos"
        valores={sp}
        campos={[
          { tipo: "busca", nome: "busca", placeholder: "Nome, matrícula ou endereço" },
          { tipo: "select", nome: "turno", todos: "Todos os turnos", opcoes: [["manha", "Manhã"], ["tarde", "Tarde"], ["integral", "Integral"]] },
          { tipo: "select", nome: "status", todos: "Todas as situações", opcoes: [["ativo", "Ativo"], ["inativo", "Inativo"]] },
        ]}
      />

      <section className="card">
        {alunos.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Série</th>
                  <th>Turno</th>
                  <th>Endereço</th>
                  <th>Responsável</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {alunos.map((a) => (
                  <tr key={a.id}>
                    <CelulaDupla principal={a.nome} secundario={`Mat. ${a.matricula}`} />
                    <td>{a.serie_ano}</td>
                    <td>{rotulo(a.turno)}</td>
                    <td>{a.endereco}</td>
                    <CelulaDupla principal={a.responsavel_nome || "—"} secundario={telefone(a.responsavel_telefone)} forte={false} />
                    <td><Pill valor={a.status} /></td>
                    <td className="acoes">
                      {edita && (
                        <>
                          <LinkBotao href={`/alunos/${a.id}/editar`} classe="btn-ghost btn-sm">Editar</LinkBotao>
                          <BotaoApi
                            texto={a.status === "ativo" ? "Desativar" : "Ativar"}
                            url={`/api/alunos/${a.id}/alternar-status`}
                            sucesso={`${a.nome}: ${a.status === "ativo" ? "desativado" : "ativado"}.`}
                          />
                          <BotaoApi
                            texto="Excluir"
                            metodo="DELETE"
                            url={`/api/alunos/${a.id}`}
                            classe="btn-danger btn-sm"
                            sucesso="Aluno excluído."
                            confirmar={`Excluir ${a.nome}? Isso também remove o aluno das rotas.`}
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
          <Vazio icone="aluno">Nenhum aluno encontrado.</Vazio>
        )}
      </section>
    </>
  );
}
