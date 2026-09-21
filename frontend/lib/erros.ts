// Mensagens de erro da API em português.

export class ApiError extends Error {
  constructor(
    mensagem: string,
    public status: number
  ) {
    super(mensagem);
  }
}

// Traduz as mensagens mais comuns de validação do Pydantic.
const TRADUCOES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Field required$/, () => "obrigatório"],
  [/^String should have at least (\d+) characters?/, (m) => `mínimo de ${m[1]} caracteres`],
  [/^String should have at most (\d+) characters?/, (m) => `máximo de ${m[1]} caracteres`],
  [/^Input should be greater than or equal to (.+)$/, (m) => `deve ser ao menos ${m[1]}`],
  [/^Input should be less than or equal to (.+)$/, (m) => `deve ser no máximo ${m[1]}`],
  [/^Input should be greater than (.+)$/, (m) => `deve ser maior que ${m[1]}`],
  [/^Input should be less than (.+)$/, (m) => `deve ser menor que ${m[1]}`],
  [/valid number|valid integer/, () => "número inválido"],
  [/valid email/i, () => "e-mail inválido"],
  [/at least 1 item/, () => "selecione ao menos um item"],
  [/valid UUID/, () => "valor inválido"],
];

function traduzir(msg: string): string {
  for (const [regra, fn] of TRADUCOES) {
    const achou = msg.match(regra);
    if (achou) return fn(achou);
  }
  return msg;
}

interface DetalheValidacao {
  loc?: (string | number)[];
  msg: string;
}

export function mensagemDeErro(dados: unknown, status: number): string {
  const detalhe = (dados as { detail?: unknown } | null)?.detail;
  if (typeof detalhe === "string") return detalhe;
  if (Array.isArray(detalhe)) {
    return (detalhe as DetalheValidacao[])
      .map((e) => {
        const campo = String(e.loc?.[e.loc.length - 1] ?? "").replaceAll("_", " ");
        return campo ? `${campo}: ${traduzir(e.msg)}` : traduzir(e.msg);
      })
      .join("; ");
  }
  if (status === 401) return "Sessão expirada. Entre novamente.";
  if (status === 403) return "Você não tem permissão para esta ação.";
  if (status === 404) return "Não encontrado.";
  return "Não foi possível concluir a operação.";
}
