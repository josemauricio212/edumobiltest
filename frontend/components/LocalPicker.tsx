"use client";

// Endereço + latitude/longitude + mapa para marcar o ponto (clique ou busca de endereço).

import "leaflet/dist/leaflet.css";

import type { Map as MapaLeaflet, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";

import { ATRIBUICAO, CENTRO_PADRAO, TILES, buscarEndereco, temPonto } from "@/lib/mapa";

import { Campo, Grade } from "./Campos";

interface Props {
  endereco?: string;
  latitude?: number | null;
  longitude?: number | null;
  somenteLeitura?: boolean;
}

export function LocalPicker({ endereco = "", latitude, longitude, somenteLeitura = false }: Props) {
  const [texto, setTexto] = useState(endereco);
  const [lat, setLat] = useState(latitude != null ? String(latitude) : "");
  const [lng, setLng] = useState(longitude != null ? String(longitude) : "");
  const [status, setStatus] = useState(somenteLeitura ? "" : "Ou clique no mapa para marcar o ponto.");

  const areaMapa = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const marcador = useRef<Marker | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const [pronto, setPronto] = useState(false);

  // Cria o mapa uma única vez (Leaflet só existe no navegador).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !areaMapa.current) return;
      leaflet.current = L;

      const inicial = temPonto(latitude, longitude) ? ([latitude, longitude as number] as [number, number]) : null;
      const m = L.map(areaMapa.current).setView(inicial ?? CENTRO_PADRAO, inicial ? 16 : 12);
      L.tileLayer(TILES, { attribution: ATRIBUICAO, maxZoom: 19 }).addTo(m);
      mapa.current = m;

      if (!somenteLeitura) {
        m.on("click", (e) => {
          setLat(e.latlng.lat.toFixed(6));
          setLng(e.latlng.lng.toFixed(6));
        });
      }
      setTimeout(() => m.invalidateSize(), 0);
      setPronto(true);
    })();

    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      marcador.current = null;
      setPronto(false);
    };
    // O ponto inicial só vale na criação do mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantém o marcador em sincronia com os campos de latitude/longitude.
  useEffect(() => {
    const L = leaflet.current;
    const m = mapa.current;
    if (!pronto || !L || !m) return;
    const la = parseFloat(lat);
    const lo = parseFloat(lng);
    if (!temPonto(la, lo)) return;
    if (marcador.current) marcador.current.setLatLng([la, lo]);
    else {
      marcador.current = L.marker([la, lo], {
        icon: L.divIcon({ className: "pino pino-escola", html: "<span>•</span>", iconSize: [30, 30], iconAnchor: [15, 15] }),
      }).addTo(m);
    }
  }, [lat, lng, pronto]);

  async function buscar() {
    if (!texto.trim()) {
      setStatus("Digite o endereço primeiro.");
      return;
    }
    setStatus("Buscando…");
    try {
      const achado = await buscarEndereco(texto.trim());
      if (!achado) {
        setStatus("Endereço não encontrado. Seja mais específico ou clique no mapa.");
        return;
      }
      setLat(achado.latitude.toFixed(6));
      setLng(achado.longitude.toFixed(6));
      mapa.current?.setView([achado.latitude, achado.longitude], 17);
      setStatus("Local encontrado. Ajuste clicando no mapa, se precisar.");
    } catch {
      setStatus("Não foi possível buscar agora. Clique no mapa para marcar o ponto.");
    }
  }

  return (
    <div>
      <Campo nome="endereco" texto="Endereço" value={texto} onChange={(e) => setTexto(e.target.value)} required minLength={3} maxLength={200} disabled={somenteLeitura} />
      <Grade>
        <Campo nome="latitude" texto="Latitude" type="number" step="any" min={-90} max={90} value={lat} onChange={(e) => setLat(e.target.value)} required disabled={somenteLeitura} />
        <Campo nome="longitude" texto="Longitude" type="number" step="any" min={-180} max={180} value={lng} onChange={(e) => setLng(e.target.value)} required disabled={somenteLeitura} />
      </Grade>
      <div className="mapa-picker">
        <div className="mapa-picker-bar">
          {!somenteLeitura && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={buscar}>
              Buscar endereço no mapa
            </button>
          )}
          <small className="hint">{status}</small>
        </div>
        <div className="mapa" ref={areaMapa} />
      </div>
    </div>
  );
}
