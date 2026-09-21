import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormLogin } from "@/components/FormLogin";
import { IconeMarca, Marca } from "@/components/Marca";
import { buscar, usuarioAtual } from "@/lib/servidor";

export const metadata: Metadata = { title: "Entrar" };

/** Só aceitamos caminhos internos, para não virar redirecionamento aberto. */
function destinoSeguro(destino?: string): string {
  return destino && destino.startsWith("/") && !destino.startsWith("//") ? destino : "/";
}

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destino = destinoSeguro(next);

  if (await usuarioAtual()) redirect(destino);

  const instalacao = await buscar<{ primeiro_acesso: boolean }>("/api/auth/status");
  const primeiroAcesso = instalacao.ok && instalacao.dados.primeiro_acesso;

  return (
    <div className="login">
      <section className="login-hero">
        <div className="brand">
          <Marca tamanho={44} />
        </div>
        <div className="login-hero-texto">
          <h1>Toda rota leva à escola.</h1>
          <p>Cadastre alunos, motoristas e veículos. O sistema monta a rota mais curta e estima o tempo e o combustível.</p>
          <ul className="login-pontos">
            <li>Segurança em cada trajeto</li>
            <li>Rotas calculadas e horários claros</li>
            <li>Controle de embarque de cada aluno</li>
          </ul>
        </div>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <div className="login-card-marca">
            <IconeMarca tamanho={48} />
          </div>
          <h2>{primeiroAcesso ? "Primeiro acesso" : "Entrar"}</h2>
          <p>{primeiroAcesso ? "Nenhum usuário cadastrado ainda. Crie o administrador do sistema." : "Use seu e-mail e senha para acessar o painel."}</p>
          {!instalacao.ok && (
            <div className="alert alert-erro" role="alert">
              {instalacao.erro}
            </div>
          )}
          <FormLogin primeiroAcesso={primeiroAcesso} destino={destino} />
        </div>
      </section>
    </div>
  );
}
