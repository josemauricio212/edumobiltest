"use client";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { TURNOS } from "@/lib/constantes";
import type { Aluno } from "@/lib/types";

import { useAvisar } from "./Aviso";
import { Campo, Grade, Grupo, Seletor } from "./Campos";
import { Formulario, numeroDe, texto } from "./Formulario";
import { LocalPicker } from "./LocalPicker";

export function FormAluno({ aluno }: { aluno?: Aluno }) {
  const router = useRouter();
  const avisar = useAvisar();

  async function enviar(d: FormData) {
    const corpo = {
      nome: texto(d, "nome"),
      matricula: texto(d, "matricula"),
      serie_ano: texto(d, "serie_ano"),
      turno: texto(d, "turno"),
      endereco: texto(d, "endereco"),
      latitude: numeroDe(d, "latitude"),
      longitude: numeroDe(d, "longitude"),
      // "" limpa o campo na edição; na criação vira "sem responsável".
      responsavel_nome: texto(d, "responsavel_nome"),
      responsavel_telefone: texto(d, "responsavel_telefone"),
    };
    if (aluno) {
      await api.alunos.atualizar(aluno.id, { ...corpo, status: texto(d, "status") });
      avisar("Aluno atualizado.");
    } else {
      const criado = await api.alunos.criar(corpo);
      avisar(`Aluno ${criado.nome} cadastrado.`);
    }
    router.push("/alunos");
    router.refresh();
  }

  return (
    <Formulario aoEnviar={enviar} cancelar="/alunos">
      <Grupo titulo="Dados do aluno">
        <Grade>
          <Campo nome="nome" texto="Nome completo" defaultValue={aluno?.nome} required minLength={3} maxLength={150} />
          <Campo nome="matricula" texto="Matrícula" defaultValue={aluno?.matricula} required maxLength={30} />
          <Campo nome="serie_ano" texto="Série / ano" defaultValue={aluno?.serie_ano} required maxLength={50} />
          <Seletor nome="turno" texto="Turno" opcoes={TURNOS} defaultValue={aluno?.turno ?? "manha"} />
          {aluno && <Seletor nome="status" texto="Situação" opcoes={[["ativo", "Ativo"], ["inativo", "Inativo"]]} defaultValue={aluno.status} />}
        </Grade>
      </Grupo>
      <Grupo titulo="Responsável">
        <Grade>
          <Campo nome="responsavel_nome" texto="Nome do responsável" defaultValue={aluno?.responsavel_nome ?? ""} maxLength={150} />
          <Campo nome="responsavel_telefone" texto="Telefone" type="tel" defaultValue={aluno?.responsavel_telefone ?? ""} maxLength={20} />
        </Grade>
      </Grupo>
      <Grupo titulo="Local de embarque">
        <LocalPicker endereco={aluno?.endereco} latitude={aluno?.latitude} longitude={aluno?.longitude} />
      </Grupo>
    </Formulario>
  );
}
