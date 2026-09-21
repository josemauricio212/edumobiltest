"use client";

// Mapa da rota: escola, paradas numeradas e o trajeto calculado (ou prévia em linha reta).

import "leaflet/dist/leaflet.css";

import { useEffect, useRef } from "react";

import { ATRIBUICAO, CENTRO_PADRAO, TILES, temPonto } from "@/lib/mapa";
import type { Escola, Parada } from "@/lib/types";

interface Props {
  escola: Pick<Escola, "nome" | "latitude" | "longitude">;
  paradas: Parada[];
  geometria: [number, number][];
}

export function MapaRota({ escola, paradas, geometria }: Props) {
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mapa: import("leaflet").Map | null = null;
    let cancelado = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !area.current) return;

      mapa = L.map(area.current);
      L.tileLayer(TILES, { attribution: ATRIBUICAO, maxZoom: 19 }).addTo(mapa);

      const pino = (texto: string | number, classe: string) =>
        L.divIcon({ className: `pino ${classe}`, html: `<span>${texto}</span>`, iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14] });

      // Popup montado com textContent: dados nunca são interpretados como HTML.
      const popup = (titulo: string, subtitulo: string) => {
        const el = document.createElement("div");
        const negrito = document.createElement("b");
        negrito.textContent = titulo;
        el.append(negrito, document.createElement("br"), subtitulo);
        return el;
      };

      const pontos: [number, number][] = [];
      const sequencia: [number, number][] = [];

      if (temPonto(escola.latitude, escola.longitude)) {
        const p: [number, number] = [escola.latitude, escola.longitude];
        L.marker(p, { icon: pino("E", "pino-escola") }).addTo(mapa).bindPopup(popup(escola.nome, "Escola"));
        pontos.push(p);
        sequencia.push(p);
      }

      for (const parada of paradas) {
        const p: [number, number] = [parada.aluno.latitude, parada.aluno.longitude];
        L.marker(p, { icon: pino(parada.ordem, "pino-parada") })
          .addTo(mapa)
          .bindPopup(popup(`${parada.ordem}º · ${parada.aluno.nome}`, parada.aluno.endereco));
        pontos.push(p);
        sequencia.push(p);
      }

      if (geometria.length) {
        L.polyline(geometria, { color: "#2b5fc7", weight: 5, opacity: 0.85 }).addTo(mapa);
        pontos.push(...geometria);
      } else if (sequencia.length > 1) {
        L.polyline(sequencia, { color: "#f5a623", weight: 3, opacity: 0.9, dashArray: "6 8" }).addTo(mapa);
      }

      if (pontos.length) mapa.fitBounds(L.latLngBounds(pontos).pad(0.15));
      else mapa.setView(CENTRO_PADRAO, 12);
      setTimeout(() => mapa?.invalidateSize(), 0);
    })();

    return () => {
      cancelado = true;
      mapa?.remove();
    };
  }, [escola, paradas, geometria]);

  return <div className="mapa mapa-grande" ref={area} />;
}
