// Constantes e serviços de mapa.

// Esri em vez do OpenStreetMap, que limita as requisições de tiles.
export const TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
export const ATRIBUICAO = "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ";
export const CENTRO_PADRAO: [number, number] = [-5.0892, -42.8019]; // Teresina

/** 0,0 é o valor "vazio" da escola recém-criada. */
export const temPonto = (lat?: number | null, lng?: number | null): lat is number =>
  typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng) && !(lat === 0 && lng === 0);

/** Geocodificação pelo Nominatim (uso eventual, com limite do serviço). */
export async function buscarEndereco(consulta: string): Promise<{ latitude: number; longitude: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(consulta)}`;
  const resposta = await fetch(url, { headers: { Accept: "application/json" } });
  const achados = (await resposta.json()) as { lat: string; lon: string }[];
  if (!achados.length) return null;
  return { latitude: parseFloat(achados[0].lat), longitude: parseFloat(achados[0].lon) };
}
