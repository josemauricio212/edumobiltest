"use client";

// Barra de filtros das listas: escreve os filtros na URL e o servidor refaz a consulta.

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { Icone } from "./Icone";

export type CampoFiltro =
  | { tipo: "busca"; nome: string; placeholder: string }
  | { tipo: "select"; nome: string; todos: string; opcoes: readonly (readonly [string, string])[] }
  | { tipo: "check"; nome: string; texto: string };

interface Props {
  caminho: string;
  campos: CampoFiltro[];
  valores: Record<string, string | undefined>;
}

export function BarraFiltros({ caminho, campos, valores }: Props) {
  const router = useRouter();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const params = new URLSearchParams();
    for (const [chave, valor] of new FormData(evento.currentTarget)) {
      if (typeof valor === "string" && valor) params.set(chave, valor);
    }
    const texto = params.toString();
    router.push(texto ? `${caminho}?${texto}` : caminho);
  }

  return (
    <form className="toolbar" onSubmit={enviar}>
      {campos.map((campo) => {
        if (campo.tipo === "busca") {
          return (
            <div className="search" key={campo.nome}>
              <Icone nome="search" />
              <input type="search" name={campo.nome} defaultValue={valores[campo.nome] ?? ""} placeholder={campo.placeholder} aria-label="Buscar" />
            </div>
          );
        }
        if (campo.tipo === "select") {
          return (
            <select
              key={campo.nome}
              name={campo.nome}
              aria-label={campo.todos}
              defaultValue={valores[campo.nome] ?? ""}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            >
              <option value="">{campo.todos}</option>
              {campo.opcoes.map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </select>
          );
        }
        return (
          <label className="check-inline" key={campo.nome}>
            <input
              type="checkbox"
              name={campo.nome}
              value="true"
              defaultChecked={valores[campo.nome] === "true"}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            />{" "}
            {campo.texto}
          </label>
        );
      })}
      <button className="btn btn-ghost" type="submit">
        Filtrar
      </button>
    </form>
  );
}
