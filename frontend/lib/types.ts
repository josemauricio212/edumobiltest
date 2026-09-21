// Formato dos dados devolvidos pela API FastAPI.

export type Cargo = "admin" | "chefetransporte" | "cadastral";
export type Turno = "manha" | "tarde" | "integral";
export type StatusVeiculo = "disponivel" | "em_rota" | "manutencao" | "inativo";
export type StatusRota = "planejada" | "em_andamento" | "concluida" | "cancelada";
export type StatusParada = "pendente" | "embarcado" | "nao_compareceu";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  status: "ativo" | "inativo";
  created_at: string;
}

export interface Aluno {
  id: string;
  matricula: string;
  nome: string;
  serie_ano: string;
  turno: Turno;
  endereco: string;
  latitude: number;
  longitude: number;
  responsavel_nome: string | null;
  responsavel_telefone: string | null;
  status: "ativo" | "inativo";
}

export interface Motorista {
  id: string;
  nome: string;
  telefone: string;
  cnh: string;
  ativo: boolean;
}

export interface Veiculo {
  id: string;
  placa: string;
  tipo: string;
  modelo: string;
  capacidade: number;
  consumo_medio: number;
  ano: number;
  proprietario_id: string | null;
  status: StatusVeiculo;
}

export interface Escola {
  id: number;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  horario_entrada: string | null;
  horario_saida: string | null;
  preco_combustivel: number;
  duracao_maxima_rota_min: number;
}

export interface Parada {
  id: string;
  ordem: number;
  status: StatusParada;
  horario_previsto: string | null;
  registrado_em: string | null;
  aluno: Pick<
    Aluno,
    "id" | "nome" | "matricula" | "endereco" | "latitude" | "longitude" | "responsavel_nome" | "responsavel_telefone"
  >;
}

export interface Rota {
  id: string;
  nome: string;
  turno: Turno;
  tipo: "ida" | "volta";
  data: string;
  status: StatusRota;
  veiculo_id: string | null;
  motorista_id: string | null;
  distancia_total_km: number | null;
  tempo_estimado_min: number | null;
  litros_estimados: number | null;
  preco_combustivel: number | null;
  custo_combustivel: number | null;
  otimizada_em: string | null;
  motorista: { id: string; nome: string; telefone: string } | null;
  veiculo: { id: string; placa: string; modelo: string; capacidade: number; consumo_medio: number } | null;
  total_alunos: number;
  total_embarcados: number;
  total_ausentes: number;
  geometria: [number, number][];
  paradas: Parada[];
}

export interface Relatorio {
  total_rotas: number;
  concluidas: number;
  em_andamento: number;
  planejadas: number;
  canceladas: number;
  distancia_total_km: number;
  custo_total: number;
  alunos_embarcados: number;
  alunos_ausentes: number;
}
