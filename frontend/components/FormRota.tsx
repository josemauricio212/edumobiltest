"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { api } from "@/lib/api";
import { TIPOS_ROTA, TURNOS } from "@/lib/constantes";
import { rotulo } from "@/lib/format";
import type { Aluno, Motorista, Rota, Veiculo } from "@/lib/types";

import { useAvisar } from "./Aviso";
import { Campo, Grade, Grupo, Seletor } from "./Campos";
import { Formulario, texto } from "./Formulario";

interface Props {
  rota?: Rota;
  veiculos: Veiculo[];
  motoristas: Motorista[];
  alunos: Aluno[];
  hoje: string;
}

export function FormRota({ rota, veiculos, motoristas, alunos, hoje }: Props) {
  const router = useRouter();
  const avisar = useAvisar();

  const [turno, setTurno] = useState<string>(rota?.turno ?? "manha");
  const [veiculoId, setVeiculoId] = useState<string>(rota?.veiculo?.id ?? "");
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set((rota?.paradas ?? []).map((p) => p.aluno.id)));
  const [soDoTurno, setSoDoTurno] = useState(true);

  const capacidade = useMemo(() => {
    const v = veiculos.find((x) => x.id === veiculoId);
    return v ? Math.trunc(v.capacidade) : null;
  }, [veiculos, veiculoId]);

  // Nunca esconde quem já está marcado, para não perder seleção sem perceber.
  const visiveis = alunos.filter((a) => !soDoTurno || a.turno === turno || a.turno === "integral" || turno === "integral" || selecionados.has(a.id));
  const excedeu = capacidade !== null && selecionados.size > capacidade;

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function enviar(d: FormData) {
    // Ordem da lista = ordem inicial das paradas.
    const alunoIds = alunos.filter((a) => selecionados.has(a.id)).map((a) => a.id);
    if (!alunoIds.length) throw new Error("Selecione ao menos um aluno.");
    if (capacidade !== null && alunoIds.length > capacidade) {
      throw new Error(`O veículo comporta ${capacidade} alunos e há ${alunoIds.length} selecionados.`);
    }

    const corpo = {
      nome: texto(d, "nome"),
      data: texto(d, "data"),
      turno: texto(d, "turno"),
      tipo: texto(d, "tipo"),
      veiculo_id: texto(d, "veiculo_id"),
      motorista_id: texto(d, "motorista_id"),
      aluno_ids: alunoIds,
    };

    if (rota) {
      await api.rotas.atualizar(rota.id, corpo);
      avisar("Rota atualizada.");
      router.push(`/rotas/${rota.id}`);
    } else {
      const criada = await api.rotas.criar(corpo);
      avisar("Rota criada. Calcule o melhor trajeto para ver o mapa.");
      router.push(`/rotas/${criada.id}`);
    }
    router.refresh();
  }

  return (
    <Formulario aoEnviar={enviar} cancelar={rota ? `/rotas/${rota.id}` : "/rotas"}>
      <Grupo titulo="Dados da rota">
        <Grade>
          <Campo nome="nome" texto="Nome da rota" defaultValue={rota?.nome} required minLength={3} maxLength={150} />
          <Campo nome="data" texto="Data" type="date" defaultValue={rota?.data ?? hoje} required />
          <Seletor nome="turno" texto="Turno" opcoes={TURNOS} value={turno} onChange={(e) => setTurno(e.target.value)} />
          <Seletor nome="tipo" texto="Tipo" opcoes={TIPOS_ROTA} defaultValue={rota?.tipo ?? "ida"} />
        </Grade>
      </Grupo>

      <Grupo titulo="Veículo e motorista">
        <Grade>
          <div className="field">
            <label htmlFor="veiculo_id">Veículo</label>
            <select id="veiculo_id" name="veiculo_id" required value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
              <option value="">Selecione…</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.placa} — {v.modelo} ({Math.trunc(v.capacidade)} lugares)
                </option>
              ))}
            </select>
            {!veiculos.length && <small className="hint">Nenhum veículo disponível. Cadastre ou libere um veículo.</small>}
          </div>
          <Seletor nome="motorista_id" texto="Motorista" opcoes={motoristas.map((m) => [m.id, m.nome] as const)} vazio="Selecione…" defaultValue={rota?.motorista?.id ?? ""} required />
        </Grade>
      </Grupo>

      <Grupo
        titulo={
          <>
            Alunos <span className={`contador${excedeu ? " excedeu" : ""}`}>{capacidade ? `${selecionados.size} de ${capacidade} lugares` : `${selecionados.size} selecionados`}</span>
          </>
        }
      >
        <div className="aluno-tools">
          <label className="check-inline">
            <input type="checkbox" checked={soDoTurno} onChange={(e) => setSoDoTurno(e.target.checked)} /> Só alunos do turno escolhido
          </label>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setSelecionados((a) => new Set([...a, ...visiveis.map((v) => v.id)]))}>
            Marcar todos visíveis
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setSelecionados(new Set())}>
            Limpar
          </button>
        </div>

        {alunos.length ? (
          <div className="aluno-lista">
            {visiveis.map((a) => (
              <label className="aluno-opcao" key={a.id}>
                <input type="checkbox" checked={selecionados.has(a.id)} onChange={() => alternar(a.id)} />
                <span>
                  <strong>{a.nome}</strong>
                  <small>
                    {rotulo(a.turno)} · {a.endereco}
                  </small>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="empty">Nenhum aluno ativo cadastrado.</div>
        )}
      </Grupo>
    </Formulario>
  );
}
