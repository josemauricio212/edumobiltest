"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { api } from "@/lib/api";
import { useHidratado } from "@/lib/hidratado";

import { Campo } from "./Campos";
import { Alerta } from "./ui";

export function FormLogin({ primeiroAcesso, destino }: { primeiroAcesso: boolean; destino: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [criado, setCriado] = useState(false);
  const hidratado = useHidratado();

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const d = new FormData(evento.currentTarget);
    const campo = (nome: string) => String(d.get(nome) ?? "");
    setErro(null);
    setEnviando(true);
    try {
      if (primeiroAcesso && !criado) {
        await api.primeiroAcesso({ nome: campo("nome").trim(), email: campo("email").trim(), senha: campo("senha"), cargo: "admin" });
        setCriado(true);
        setOk("Administrador criado. Faça login.");
        router.refresh(); // o servidor passa a saber que já existe usuário
        return;
      }
      await api.login(campo("email").trim(), campo("senha"));
      router.replace(destino);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir a operação.");
    } finally {
      setEnviando(false);
    }
  }

  const mostrarCadastro = primeiroAcesso && !criado;

  return (
    <>
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {ok && <Alerta tipo="ok">{ok}</Alerta>}
      <form method="post" onSubmit={enviar}>
        {mostrarCadastro && <Campo nome="nome" texto="Nome" required minLength={3} maxLength={150} autoComplete="name" autoFocus />}
        <Campo nome="email" texto="E-mail" type="email" required autoComplete="username" autoFocus={!mostrarCadastro} />
        <Campo
          nome="senha"
          texto="Senha"
          type="password"
          required
          minLength={mostrarCadastro ? 6 : undefined}
          maxLength={mostrarCadastro ? 72 : undefined}
          autoComplete={mostrarCadastro ? "new-password" : "current-password"}
        />
        <button className="btn btn-block" type="submit" disabled={enviando || !hidratado}>
          {mostrarCadastro ? "Criar administrador" : "Entrar"}
        </button>
      </form>
    </>
  );
}
