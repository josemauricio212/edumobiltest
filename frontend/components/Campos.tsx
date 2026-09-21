// Campos de formulário (não controlados: use defaultValue).

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type CampoProps = InputHTMLAttributes<HTMLInputElement> & { nome: string; texto: string; ajuda?: string };

export function Campo({ nome, texto, ajuda, ...resto }: CampoProps) {
  return (
    <div className="field">
      <label htmlFor={nome}>{texto}</label>
      <input id={nome} name={nome} {...resto} />
      {ajuda && <small className="hint">{ajuda}</small>}
    </div>
  );
}

type SeletorProps = SelectHTMLAttributes<HTMLSelectElement> & {
  nome: string;
  texto: string;
  /** lista de [valor, texto] */
  opcoes: readonly (readonly [string, string])[];
  /** texto da opção em branco (omitir = sem opção em branco) */
  vazio?: string;
};

export function Seletor({ nome, texto, opcoes, vazio, ...resto }: SeletorProps) {
  return (
    <div className="field">
      <label htmlFor={nome}>{texto}</label>
      <select id={nome} name={nome} {...resto}>
        {vazio !== undefined && <option value="">{vazio}</option>}
        {opcoes.map(([valor, rotulo]) => (
          <option key={valor} value={valor}>
            {rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Grade({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>;
}

export function Grupo({ titulo, children }: { titulo: ReactNode; children: ReactNode }) {
  return (
    <fieldset>
      <legend>{titulo}</legend>
      {children}
    </fieldset>
  );
}
