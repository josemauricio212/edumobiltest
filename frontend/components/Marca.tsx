// Logotipo do EduMobil: ícone do app (âmbar) + nome em Inter Bold.
// O desenho vem de /logo-mask.png usado como máscara, então herda a cor do CSS.

export function IconeMarca({ tamanho = 34 }: { tamanho?: number }) {
  return (
    <span className="brand-mark" style={{ width: tamanho, height: tamanho }} aria-hidden="true">
      <span className="brand-glyph" />
    </span>
  );
}

export function Marca({ tamanho = 34 }: { tamanho?: number }) {
  return (
    <span className="brand-lockup" style={{ fontSize: Math.round(tamanho * 0.66) }}>
      <IconeMarca tamanho={tamanho} />
      <span className="brand-name">EduMobil</span>
    </span>
  );
}
