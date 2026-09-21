// Listas de opções compartilhadas entre telas e formulários.

import { rotulo } from "./format";

export const TURNOS = [["manha", "Manhã"], ["tarde", "Tarde"], ["integral", "Integral"]] as const;

export const TIPOS_ROTA = [["ida", "Ida (casa → escola)"], ["volta", "Volta (escola → casa)"]] as const;

export const STATUS_VEICULO = ["disponivel", "em_rota", "manutencao", "inativo"].map((s) => [s, rotulo(s)] as const);

export const STATUS_ROTA = ["planejada", "em_andamento", "concluida", "cancelada"].map((s) => [s, rotulo(s)] as const);

export const CARGOS = ["admin", "chefetransporte", "cadastral"].map((c) => [c, rotulo(c)] as const);
