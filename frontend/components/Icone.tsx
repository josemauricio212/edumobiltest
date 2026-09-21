// Ícones em SVG (traço), sem dependências.

const CAMINHOS = {
  bus: (
    <>
      <path d="M4 16V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10" />
      <path d="M4 11h16M4 16h16v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <circle cx="8" cy="14" r=".6" />
      <circle cx="16" cy="14" r=".6" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
    </>
  ),
  aluno: (
    <>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    </>
  ),
  motorista: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 14v7M10.2 11L3.5 9.5M13.8 11l6.7-1.5" />
    </>
  ),
  escola: (
    <>
      <path d="M3 21h18M5 21V10l7-6 7 6v11" />
      <path d="M9 21v-6h6v6M12 4V2" />
    </>
  ),
  usuarios: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2 .8 3.5 2.7 3.5 5.7" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
};

export type NomeIcone = keyof typeof CAMINHOS;

export function Icone({ nome }: { nome: NomeIcone }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={nome === "plus" ? 2.4 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CAMINHOS[nome]}
    </svg>
  );
}
