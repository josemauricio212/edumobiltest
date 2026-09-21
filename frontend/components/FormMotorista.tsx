"use client";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import type { Motorista } from "@/lib/types";

import { useAvisar } from "./Aviso";
import { Campo } from "./Campos";
import { Formulario, texto } from "./Formulario";

export function FormMotorista({ motorista }: { motorista?: Motorista }) {
  const router = useRouter();
  const avisar = useAvisar();

  async function enviar(d: FormData) {
    const corpo = { nome: texto(d, "nome"), telefone: texto(d, "telefone"), cnh: texto(d, "cnh") };
    if (motorista) {
      await api.motoristas.atualizar(motorista.id, corpo);
      avisar("Motorista atualizado.");
    } else {
      const criado = await api.motoristas.criar(corpo);
      avisar(`Motorista ${criado.nome} cadastrado.`);
    }
    router.push("/motoristas");
    router.refresh();
  }

  return (
    <Formulario aoEnviar={enviar} cancelar="/motoristas" estreito>
      <Campo nome="nome" texto="Nome completo" defaultValue={motorista?.nome} required minLength={3} maxLength={150} />
      <Campo nome="telefone" texto="Telefone" type="tel" defaultValue={motorista?.telefone} required minLength={8} maxLength={20} />
      <Campo nome="cnh" texto="CNH" defaultValue={motorista?.cnh} required minLength={5} maxLength={20} />
    </Formulario>
  );
}
