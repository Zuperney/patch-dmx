import { useState } from "react";
import { CANAIS_UNIVERSO, enderecos, fim, pad } from "../lib/dmx.js";
import Dip from "./Dip.jsx";

export default function Grupo({
  g,
  conflito,
  aberto,
  onAbrir,
  onAlterna,
  onAvanca,
  onDesfaz,
  onRemove,
  somaMaisUm,
}) {
  const [confirma, setConfirma] = useState(false);
  const lista = enderecos(g);
  const feitos = new Set(g.feitos);
  const atual = lista.findIndex((_, i) => !feitos.has(i));
  const completo = atual === -1;

  /* primeiro aparelho que não cabe inteiro no universo */
  const iEstouro = lista.findIndex((e) => e + g.canais - 1 > CANAIS_UNIVERSO);
  const estoura = iEstouro !== -1;
  const cabem = estoura ? iEstouro : g.qtd;

  return (
    <section
      className={`mt-3 rounded border ${
        conflito || estoura ? "border-red-800" : "border-neutral-800"
      }`}
    >
      <button
        onClick={onAbrir}
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-neutral-100">
            {g.nome}
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">
            {g.qtd}× · {g.canais} canais · {pad(g.inicio)}–{pad(fim(g))}
          </div>
        </div>
        <div
          className={`rounded px-2 py-1 text-xs font-semibold ${
            completo
              ? "bg-emerald-900 text-emerald-300"
              : "bg-neutral-800 text-neutral-400"
          }`}
        >
          {g.feitos.length}/{g.qtd}
        </div>
        <span className="text-neutral-600">{aberto ? "▾" : "▸"}</span>
      </button>

      {estoura && (
        <p className="border-t border-red-900 bg-red-950 px-3 py-2 text-xs text-red-300">
          Estoura no aparelho {iEstouro + 1}, endereço{" "}
          <strong>{pad(lista[iEstouro])}</strong>. Cabem {cabem} neste universo,
          sobram {g.qtd - cabem} para o próximo.
        </p>
      )}
      {conflito && (
        <p className="border-t border-red-900 bg-red-950 px-3 py-2 text-xs text-red-300">
          Endereços sobrepostos com outro equipamento deste universo.
        </p>
      )}

      {aberto && (
        <div className="border-t border-neutral-800">
          <ul>
            {lista.map((end, i) => {
              const ok = feitos.has(i);
              const eAtual = i === atual;
              const fora = estoura && i >= iEstouro;
              const primeiroFora = i === iEstouro;
              return (
                <li key={i}>
                  {primeiroFora && (
                    <div className="flex items-center gap-2 bg-red-950 px-3 py-1">
                      <span className="h-px flex-1 bg-red-800" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                        passa do 512 daqui
                      </span>
                      <span className="h-px flex-1 bg-red-800" />
                    </div>
                  )}
                  <button
                    onClick={() => onAlterna(i)}
                    className={`flex w-full items-center gap-3 border-b border-neutral-900 px-3 py-2.5 text-left ${
                      fora ? "bg-red-950" : eAtual ? "bg-neutral-900" : ""
                    }`}
                  >
                    <span
                      className={`w-6 text-xs ${
                        ok
                          ? "text-emerald-500"
                          : fora
                          ? "text-red-500"
                          : "text-neutral-600"
                      }`}
                    >
                      {ok ? "✓" : i + 1}
                    </span>
                    <span
                      className={`w-14 text-lg font-semibold ${
                        ok
                          ? "text-neutral-600 line-through"
                          : fora
                          ? "text-red-400"
                          : eAtual
                          ? "text-amber-400"
                          : "text-neutral-200"
                      }`}
                    >
                      {pad(end)}
                    </span>
                    <Dip
                      valor={end}
                      somaMaisUm={somaMaisUm}
                      apagado={ok || fora}
                    />
                    <span
                      className={`ml-auto text-xs ${
                        fora ? "text-red-500" : "text-neutral-600"
                      }`}
                    >
                      {pad(end)}–{pad(end + g.canais - 1)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex gap-2 p-3">
            <button
              onClick={onAvanca}
              disabled={completo}
              className="flex-1 rounded bg-neutral-100 py-3 text-sm font-semibold text-neutral-950 disabled:bg-neutral-800 disabled:text-neutral-600"
            >
              {completo ? "Tudo endereçado" : `Endereçar ${pad(lista[atual])} →`}
            </button>
            <button
              onClick={onDesfaz}
              className="rounded border border-neutral-700 px-4 text-sm text-neutral-400"
            >
              Desfazer
            </button>
            <button
              onClick={() => (confirma ? onRemove() : setConfirma(true))}
              onBlur={() => setConfirma(false)}
              className={`rounded border px-4 text-sm ${
                confirma
                  ? "border-red-600 bg-red-950 text-red-300"
                  : "border-neutral-800 text-neutral-600"
              }`}
            >
              {confirma ? "Confirmar?" : "Excluir"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
