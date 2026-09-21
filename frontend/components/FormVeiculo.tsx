"use client";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { STATUS_VEICULO } from "@/lib/constantes";
import type { Motorista, Veiculo } from "@/lib/types";

import { useAvisar } from "./Aviso";
import { Campo, Grade, Seletor } from "./Campos";
import { Formulario, numeroDe, texto } from "./Formulario";

export function FormVeiculo({ veiculo, motoristas }: { veiculo?: Veiculo; motoristas: Motorista[] }) {
  const router = useRouter();
  const avisar = useAvisar();

  async function enviar(d: FormData) {
    const corpo = {
      placa: texto(d, "placa"),
      modelo: texto(d, "modelo"),
      tipo: texto(d, "tipo"),
      ano: numeroDe(d, "ano"),
      capacidade: numeroDe(d, "capacidade"),
      consumo_medio: numeroDe(d, "consumo_medio"),
      proprietario_id: texto(d, "proprietario_id") || null,
    };
    if (veiculo) {
      await api.veiculos.atualizar(veiculo.id, { ...corpo, status: texto(d, "status") });
      avisar("Veículo atualizado.");
    } else {
      const criado = await api.veiculos.criar(corpo);
      avisar(`Veículo ${criado.placa} cadastrado.`);
    }
    router.push("/veiculos");
    router.refresh();
  }

  return (
    <Formulario aoEnviar={enviar} cancelar="/veiculos">
      <Grade>
        <Campo nome="placa" texto="Placa" defaultValue={veiculo?.placa} required minLength={7} maxLength={10} />
        <Campo nome="modelo" texto="Modelo" defaultValue={veiculo?.modelo} required minLength={2} maxLength={100} />
        <Campo nome="tipo" texto="Tipo" defaultValue={veiculo?.tipo} required minLength={2} maxLength={50} ajuda="Ex.: Van, Micro-ônibus, Ônibus" />
        <Campo nome="ano" texto="Ano" type="number" defaultValue={veiculo?.ano ?? new Date().getFullYear()} required min={1950} max={2100} />
        <Campo nome="capacidade" texto="Capacidade (alunos)" type="number" defaultValue={veiculo?.capacidade} required step={1} min={1} max={100} />
        <Campo nome="consumo_medio" texto="Consumo médio (km/L)" type="number" defaultValue={veiculo?.consumo_medio} required step="any" min={0.1} max={100} ajuda="Usado para estimar litros e custo da rota." />
        <Seletor nome="proprietario_id" texto="Motorista responsável" opcoes={motoristas.map((m) => [m.id, m.nome] as const)} vazio="Nenhum" defaultValue={veiculo?.proprietario_id ?? ""} />
        {veiculo && <Seletor nome="status" texto="Situação" opcoes={STATUS_VEICULO} defaultValue={veiculo.status} />}
      </Grade>
    </Formulario>
  );
}
