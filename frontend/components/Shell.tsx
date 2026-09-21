"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { api } from "@/lib/api";
import { iniciais, rotulo } from "@/lib/format";
import type { Usuario } from "@/lib/types";

import { AvisoProvider } from "./Aviso";
import { Icone, type NomeIcone } from "./Icone";
import { Marca } from "./Marca";

const ITENS: { href: string; texto: string; icone: NomeIcone; admin?: boolean }[] = [
  { href: "/", texto: "Painel", icone: "home" },
  { href: "/rotas", texto: "Rotas", icone: "route" },
  { href: "/alunos", texto: "Alunos", icone: "aluno" },
  { href: "/motoristas", texto: "Motoristas", icone: "motorista" },
  { href: "/veiculos", texto: "Veículos", icone: "bus" },
  { href: "/escola", texto: "Escola", icone: "escola" },
  { href: "/relatorios", texto: "Relatórios", icone: "chart" },
  { href: "/usuarios", texto: "Usuários", icone: "usuarios", admin: true },
];

export function Shell({ usuario, children }: { usuario: Usuario; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const ativo = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  async function sair() {
    await api.logout().catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="EduMobil — página inicial">
          <Marca />
        </Link>

        <nav className="nav" aria-label="Principal">
          {ITENS.filter((i) => !i.admin || usuario.cargo === "admin").map((i) => (
            <Link key={i.href} href={i.href} aria-current={ativo(i.href) ? "page" : undefined}>
              <Icone nome={i.icone} />
              {i.texto}
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="avatar" aria-hidden="true">
            {iniciais(usuario.nome)}
          </span>
          <div className="who">
            <strong>{usuario.nome}</strong>
            <span>{rotulo(usuario.cargo)}</span>
          </div>
          <button className="logout" type="button" title="Sair" aria-label="Sair" onClick={sair}>
            <Icone nome="logout" />
          </button>
        </div>
      </aside>

      <main className="main">
        <AvisoProvider>{children}</AvisoProvider>
      </main>
    </div>
  );
}
