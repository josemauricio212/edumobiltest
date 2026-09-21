import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="error-page">
      <div>
        <h1>404</h1>
        <p>Página não encontrada.</p>
        <Link className="btn" href="/">
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
