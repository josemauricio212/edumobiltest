"use client";

import { useEffect, useState } from "react";

/**
 * `false` no HTML vindo do servidor e até o React "ligar" a página no navegador.
 * Usado para manter botões de envio desabilitados nesse intervalo: clicar antes
 * disso faria o navegador enviar o formulário do jeito antigo (dados na URL).
 */
export function useHidratado(): boolean {
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  return pronto;
}
