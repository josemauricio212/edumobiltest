"use client";

// Botão que chama a API, avisa o resultado e atualiza a tela.
// Serve para qualquer ação simples (ativar/desativar, iniciar rota, marcar embarque...).

import { useRouter } from "next/navigation";
import { useState } from "react";

import { requisitar } from "@/lib/api";
import { useHidratado } from "@/lib/hidratado";

import { useAvisar } from "./Aviso";

interface Props {
  texto: string;
  url: string;
  metodo?: "POST" | "PATCH" | "DELETE";
  corpo?: unknown;
  /** Mensagem mostrada em caso de sucesso. */
  sucesso?: string;
  /** Pergunta de confirmação antes de executar. */
  confirmar?: string;
  classe?: string;
  desabilitado?: boolean;
  titulo?: string;
}

export function BotaoApi({ texto, url, metodo = "POST", corpo, sucesso, confirmar, classe = "btn-ghost btn-sm", desabilitado, titulo }: Props) {
  const router = useRouter();
  const avisar = useAvisar();
  const [ocupado, setOcupado] = useState(false);
  const hidratado = useHidratado();

  async function executar() {
    if (confirmar && !window.confirm(confirmar)) return;
    setOcupado(true);
    try {
      await requisitar(metodo, url, corpo);
      if (sucesso) avisar(sucesso, "ok");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível concluir a operação.", "erro");
    } finally {
      setOcupado(false);
      router.refresh();
    }
  }

  return (
    <button className={`btn ${classe}`} type="button" onClick={executar} disabled={desabilitado || ocupado || !hidratado} title={titulo} aria-label={titulo}>
      {texto}
    </button>
  );
}
