import type { Metadata } from "next";

import { BotaoApi } from "@/components/BotaoApi";
import { Cabecalho, CelulaDupla, ErroCard, LinkBotao, Pill, SemPermissao } from "@/components/ui";
import { data, rotulo } from "@/lib/format";
import { pode } from "@/lib/permissoes";
import { buscar, usuarioAtual } from "@/lib/servidor";
import type { Usuario } from "@/lib/types";

export const metadata: Metadata = { title: "Usuários" };

export default async function Usuarios() {
  const eu = (await usuarioAtual())!;
  if (!pode(eu.cargo, "admin")) return <SemPermissao />;

  const r = await buscar<Usuario[]>("/api/usuarios");
  if (!r.ok) return <ErroCard mensagem={r.erro} />;

  return (
    <>
      <Cabecalho
        titulo="Usuários"
        subtitulo="Quem acessa o painel e o que cada cargo pode fazer."
        acoes={<LinkBotao href="/usuarios/novo" icone="plus">Novo usuário</LinkBotao>}
      />

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Cargo</th>
                <th>Situação</th>
                <th>Criado em</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {r.dados.map((u) => (
                <tr key={u.id}>
                  <CelulaDupla principal={u.nome} secundario={u.email} />
                  <td>{rotulo(u.cargo)}</td>
                  <td><Pill valor={u.status} /></td>
                  <td>{data(u.created_at)}</td>
                  <td className="acoes">
                    <LinkBotao href={`/usuarios/${u.id}/editar`} classe="btn-ghost btn-sm">Editar</LinkBotao>
                    {u.id !== eu.id && (
                      <BotaoApi
                        texto={u.status === "ativo" ? "Desativar" : "Ativar"}
                        url={`/api/usuarios/${u.id}/alternar-status`}
                        sucesso={`${u.nome}: ${u.status === "ativo" ? "desativado" : "ativado"}.`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
