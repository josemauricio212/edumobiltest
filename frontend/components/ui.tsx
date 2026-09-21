// Peças de interface sem estado (funcionam em Server e Client Components).

import Link from "next/link";
import type { ReactNode } from "react";

import { rotulo } from "@/lib/format";

import { Icone, type NomeIcone } from "./Icone";

export function Cabecalho({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: ReactNode; acoes?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {acoes && <div className="acoes-topo">{acoes}</div>}
    </header>
  );
}

export function LinkBotao({
  href,
  children,
  classe = "",
  icone,
}: {
  href: string;
  children: ReactNode;
  classe?: string;
  icone?: NomeIcone;
}) {
  return (
    <Link className={`btn ${classe}`.trim()} href={href}>
      {icone && <Icone nome={icone} />}
      {children}
    </Link>
  );
}

export function Pill({ valor, texto }: { valor: string; texto?: string }) {
  return <span className={`pill pill-${valor}`}>{texto ?? rotulo(valor)}</span>;
}

export function Alerta({ tipo, children }: { tipo: "ok" | "erro" | "warn"; children: ReactNode }) {
  return (
    <div className={`alert alert-${tipo}`} role={tipo === "erro" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function Vazio({ icone, children }: { icone?: NomeIcone; children: ReactNode }) {
  return (
    <div className="empty">
      {icone && <Icone nome={icone} />}
      <div>{children}</div>
    </div>
  );
}

export function Estatistica({
  titulo,
  valor,
  pequeno,
  nota,
  destaque,
}: {
  titulo: string;
  valor: ReactNode;
  pequeno?: string;
  nota?: ReactNode;
  destaque?: boolean;
}) {
  return (
    <div className={`card stat${destaque ? " accent" : ""}`}>
      <span className="stat-label">{titulo}</span>
      <span className="stat-value">
        {valor}
        {pequeno && <small> {pequeno}</small>}
      </span>
      {nota && <span className="stat-note">{nota}</span>}
    </div>
  );
}

/** Célula com título e subtítulo (padrão das listas). */
export function CelulaDupla({ principal, secundario, forte = true }: { principal: ReactNode; secundario?: ReactNode; forte?: boolean }) {
  return (
    <td>
      {forte ? <strong>{principal}</strong> : principal}
      {secundario ? <span className="cell-sub">{secundario}</span> : null}
    </td>
  );
}

/** Card de erro para quando a API não responde ou recusa a consulta. */
export function ErroCard({ mensagem }: { mensagem: string }) {
  return (
    <div className="card card-body">
      <Alerta tipo="erro">{mensagem}</Alerta>
    </div>
  );
}

export function SemPermissao() {
  return (
    <div className="error-page" style={{ minHeight: "60vh" }}>
      <div>
        <h1>403</h1>
        <p>Você não tem permissão para acessar esta tela.</p>
        <LinkBotao href="/">Voltar ao painel</LinkBotao>
      </div>
    </div>
  );
}
