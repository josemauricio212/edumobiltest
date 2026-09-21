"use client";

// Aviso de sucesso/erro que sobrevive à navegação entre telas do painel
// (ex.: "Aluno cadastrado." aparece na lista para onde o formulário redireciona).

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Tipo = "ok" | "erro" | "warn";
interface AvisoAtual {
  mensagem: string;
  tipo: Tipo;
  exibido: boolean;
}

const Contexto = createContext<(mensagem: string, tipo?: Tipo) => void>(() => {});

export const useAvisar = () => useContext(Contexto);

export function AvisoProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<AvisoAtual | null>(null);
  const pathname = usePathname();
  const anterior = useRef(pathname);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  const avisar = useCallback((mensagem: string, tipo: Tipo = "ok") => {
    clearTimeout(temporizador.current);
    setAviso({ mensagem, tipo, exibido: false });
    temporizador.current = setTimeout(() => setAviso(null), 8000);
  }, []);

  // Ao trocar de tela: o aviso criado na anterior é mostrado nesta; ao sair dela, some.
  useEffect(() => {
    if (anterior.current === pathname) return;
    anterior.current = pathname;
    setAviso((atual) => (atual && !atual.exibido ? { ...atual, exibido: true } : null));
  }, [pathname]);

  return (
    <Contexto.Provider value={avisar}>
      {aviso && (
        <div className={`alert alert-${aviso.tipo}`} role={aviso.tipo === "erro" ? "alert" : "status"}>
          {aviso.mensagem}
        </div>
      )}
      {children}
    </Contexto.Provider>
  );
}
