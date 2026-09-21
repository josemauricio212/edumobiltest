"use client";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import type { Escola } from "@/lib/types";

import { useAvisar } from "./Aviso";
import { Campo, Grade, Grupo } from "./Campos";
import { Formulario, numeroDe, texto, textoOuNulo } from "./Formulario";
import { LocalPicker } from "./LocalPicker";

export function FormEscola({ escola, editavel }: { escola: Escola; editavel: boolean }) {
  const router = useRouter();
  const avisar = useAvisar();
  const bloqueado = !editavel;

  async function enviar(d: FormData) {
    await api.escola.salvar({
      nome: texto(d, "nome"),
      endereco: texto(d, "endereco"),
      latitude: numeroDe(d, "latitude"),
      longitude: numeroDe(d, "longitude"),
      horario_entrada: textoOuNulo(d, "horario_entrada"),
      horario_saida: textoOuNulo(d, "horario_saida"),
      preco_combustivel: numeroDe(d, "preco_combustivel"),
      duracao_maxima_rota_min: numeroDe(d, "duracao_maxima_rota_min"),
    });
    avisar("Dados da escola salvos.");
    router.refresh();
  }

  return (
    <Formulario aoEnviar={enviar} salvar={editavel ? "Salvar" : null}>
      <Grupo titulo="Identificação">
        <Campo nome="nome" texto="Nome da escola" defaultValue={escola.nome} required minLength={2} maxLength={150} disabled={bloqueado} />
        <Grade>
          <Campo nome="horario_entrada" texto="Horário de entrada" type="time" defaultValue={escola.horario_entrada ?? ""} disabled={bloqueado} />
          <Campo nome="horario_saida" texto="Horário de saída" type="time" defaultValue={escola.horario_saida ?? ""} disabled={bloqueado} />
        </Grade>
      </Grupo>
      <Grupo titulo="Localização">
        <LocalPicker endereco={escola.endereco} latitude={escola.latitude} longitude={escola.longitude} somenteLeitura={bloqueado} />
      </Grupo>
      <Grupo titulo="Cálculo de rotas">
        <Grade>
          <Campo nome="preco_combustivel" texto="Preço do combustível (R$/L)" type="number" defaultValue={escola.preco_combustivel} required step={0.01} min={0.01} max={100} disabled={bloqueado} />
          <Campo nome="duracao_maxima_rota_min" texto="Duração máxima da rota (min)" type="number" defaultValue={escola.duracao_maxima_rota_min} required step={1} min={10} max={600} disabled={bloqueado} />
        </Grade>
      </Grupo>
    </Formulario>
  );
}
