"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

import { useHidratado } from "@/lib/hidratado";

import { Alerta } from "./ui";

interface Props {
  /** Recebe os dados do formulário; lançar um Error mostra a mensagem no topo. */
  aoEnviar: (dados: FormData) => Promise<void>;
  cancelar?: string;
  /** `null` esconde o botão (formulário só de consulta). */
  salvar?: string | null;
  estreito?: boolean;
  children: ReactNode;
}

export function Formulario({ aoEnviar, cancelar, salvar = "Salvar", estreito, children }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const hidratado = useHidratado();

  async function aoSubmeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await aoEnviar(new FormData(evento.currentTarget));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir a operação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={`card card-body form${estreito ? " form-narrow" : ""}`} method="post" onSubmit={aoSubmeter}>
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {children}
      <div className="form-actions">
        {cancelar && (
          <Link className="btn btn-ghost" href={cancelar}>
            Cancelar
          </Link>
        )}
        {salvar !== null && (
          <button className="btn" type="submit" disabled={enviando || !hidratado}>
            {salvar}
          </button>
        )}
      </div>
    </form>
  );
}

/** Lê um campo do FormData como texto (vazio se ausente). */
export const texto = (dados: FormData, nome: string) => String(dados.get(nome) ?? "").trim();
export const numeroDe = (dados: FormData, nome: string) => {
  const t = texto(dados, nome).replace(",", ".");
  return t === "" ? null : Number(t);
};
export const textoOuNulo = (dados: FormData, nome: string) => texto(dados, nome) || null;
