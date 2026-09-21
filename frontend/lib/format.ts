// Formatação para exibição (pt-BR).

const ROTULOS: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  disponivel: "Disponível",
  em_rota: "Em rota",
  manutencao: "Manutenção",
  planejada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
  pendente: "Pendente",
  embarcado: "Embarcado",
  nao_compareceu: "Não compareceu",
  manha: "Manhã",
  tarde: "Tarde",
  integral: "Integral",
  ida: "Ida",
  volta: "Volta",
  admin: "Administrador",
  chefetransporte: "Chefe de transporte",
  cadastral: "Cadastral",
};

export function rotulo(valor: string | null | undefined): string {
  if (valor == null || valor === "") return "—";
  if (ROTULOS[valor]) return ROTULOS[valor];
  const texto = valor.replaceAll("_", " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "2026-09-21" ou ISO com hora → "21/09/2026" (sem depender de fuso horário). */
export function data(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

const dois = (n: number) => String(n).padStart(2, "0");

export function diasAtras(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

export const hoje = () => diasAtras(0);

export function numero(valor: number | null | undefined, casas = 1): string {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function moeda(valor: number | null | undefined): string {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function telefone(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = valor.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return valor;
}

export function iniciais(nome: string): string {
  const partes = nome.split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function plural(n: number, singular: string, pluralTexto = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}
