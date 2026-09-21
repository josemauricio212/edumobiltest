"use client";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { CARGOS } from "@/lib/constantes";
import type { Usuario } from "@/lib/types";

import { useAvisar } from "./Aviso";
import { Campo, Seletor } from "./Campos";
import { Formulario, texto } from "./Formulario";

export function FormUsuario({ usuario }: { usuario?: Usuario }) {
  const router = useRouter();
  const avisar = useAvisar();

  async function enviar(d: FormData) {
    const corpo = { nome: texto(d, "nome"), email: texto(d, "email"), cargo: texto(d, "cargo") };
    const senha = String(d.get("senha") ?? "");
    if (usuario) {
      // Senha em branco = manter a atual.
      await api.usuarios.atualizar(usuario.id, senha ? { ...corpo, senha } : corpo);
      avisar("Usuário atualizado.");
    } else {
      const criado = await api.usuarios.criar({ ...corpo, senha });
      avisar(`Usuário ${criado.nome} criado.`);
    }
    router.push("/usuarios");
    router.refresh();
  }

  return (
    <Formulario aoEnviar={enviar} cancelar="/usuarios" estreito>
      <Campo nome="nome" texto="Nome" defaultValue={usuario?.nome} required minLength={3} maxLength={150} />
      <Campo nome="email" texto="E-mail" type="email" defaultValue={usuario?.email} required maxLength={100} />
      <Seletor nome="cargo" texto="Cargo" opcoes={CARGOS} defaultValue={usuario?.cargo ?? "cadastral"} />
      <Campo
        nome="senha"
        texto={usuario ? "Nova senha" : "Senha"}
        type="password"
        required={!usuario}
        minLength={6}
        maxLength={72}
        autoComplete="new-password"
        ajuda={usuario ? "Deixe em branco para manter a senha atual." : undefined}
      />
    </Formulario>
  );
}
