// Células de tabela repetidas entre painel, rotas e relatórios.

import Link from "next/link";

import { rotulo } from "@/lib/format";
import type { Rota } from "@/lib/types";

import { CelulaDupla } from "./ui";

export function CelulaRota({ rota }: { rota: Rota }) {
  return (
    <td>
      <Link href={`/rotas/${rota.id}`}>
        <strong>{rota.nome}</strong>
      </Link>
      <span className="cell-sub">
        {rotulo(rota.turno)} · {rotulo(rota.tipo)}
      </span>
    </td>
  );
}

export function CelulaMotoristaVeiculo({ rota }: { rota: Rota }) {
  return <CelulaDupla principal={rota.motorista?.nome ?? "—"} secundario={rota.veiculo?.placa ?? "Sem veículo"} forte={false} />;
}

export function CelulaProgresso({ rota }: { rota: Rota }) {
  const pct = rota.total_alunos ? Math.round((rota.total_embarcados * 100) / rota.total_alunos) : 0;
  return (
    <td>
      <div className="progress" title={`${rota.total_embarcados} embarcados de ${rota.total_alunos}`}>
        <div className="progress-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <small>
          {rota.total_embarcados}/{rota.total_alunos}
        </small>
      </div>
    </td>
  );
}
