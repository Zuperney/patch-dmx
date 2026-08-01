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
  const pct = Math.round((g.feitos.length / g.qtd) * 100);

  /* primeiro aparelho que não cabe inteiro no universo */
  const iEstouro = lista.findIndex((e) => e + g.canais - 1 > CANAIS_UNIVERSO);
  const estoura = iEstouro !== -1;
  const cabemAqui = estoura ? iEstouro : g.qtd;

  return (
    <section
      className={`mt-3 overflow-hidden rounded-xl border bg-neutral-900/30 ${
        conflito || estoura
          ? "border-red-800"
          : aberto
          ? "border-neutral-700"
          : "border-neutral-800"
      }`}
    >
      <button
        onClick={onAbrir}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-neutral-900/60"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-neutral-100">
            {g.nome}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
            <span>
              {g.qtd}× de {g.canais} canais
            </span>
            <span className="text-neutral-700">·</span>
            <span className="font-medium text-neutral-400">
              {pad(g.inicio)}–{pad(fim(g))}
            </span>
          </div>
        </div>
        <div
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
            completo
              ? "bg-emerald-900 text-emerald-300"
              : "bg-neutral-800 text-neutral-300"
          }`}
        >
          {g.feitos.length}/{g.qtd}
        </div>
        <span
          className={`text-neutral-600 transition-transform ${
            aberto ? "rotate-90" : ""
          }`}
        >
          ▸
        </span>
      </button>

      {/* progresso do endereçamento */}
      <div className="h-1 w-full bg-neutral-900">
        <div
          className={`h-full transition-all ${
            completo ? "bg-emerald-500" : "bg-(--destaque)"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {estoura && (
        <p className="border-t border-red-900 bg-red-950 px-4 py-2 text-xs text-red-300">
          Estoura no aparelho {iEstouro + 1}, endereço{" "}
          <strong>{pad(lista[iEstouro])}</strong>. Cabem {cabemAqui} neste
          universo, sobram {g.qtd - cabemAqui} para o próximo.
        </p>
      )}
      {conflito && (
        <p className="border-t border-red-900 bg-red-950 px-4 py-2 text-xs text-red-300">
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
                    <div className="flex items-center gap-2 bg-red-950 px-4 py-1">
                      <span className="h-px flex-1 bg-red-800" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                        passa do 512 daqui
                      </span>
                      <span className="h-px flex-1 bg-red-800" />
                    </div>
                  )}
                  <button
                    onClick={() => onAlterna(i)}
                    className={`flex w-full items-center gap-3 border-b border-neutral-900 px-4 py-3 text-left ${
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
                      className={`w-16 text-xl font-semibold ${
                        ok
                          ? "text-neutral-600 line-through"
                          : fora
                          ? "text-red-400"
                          : eAtual
                          ? "text-(--destaque-claro)"
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

          {/* barra de ações flutuante: acompanha a rolagem da lista */}
          <div className="sticky bottom-0 z-10 flex gap-2 border-t border-neutral-800 bg-neutral-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
            <button
              onClick={onAvanca}
              disabled={completo}
              className="flex-1 rounded-lg bg-(--destaque) py-3.5 text-sm font-bold text-neutral-950 active:bg-(--destaque-ativo) disabled:bg-neutral-800 disabled:text-neutral-600"
            >
              {completo ? "Tudo endereçado" : `Endereçar ${pad(lista[atual])} →`}
            </button>
            <button
              onClick={onDesfaz}
              className="rounded-lg border border-neutral-700 px-4 text-sm text-neutral-400"
            >
              Desfazer
            </button>
            <button
              onClick={() => (confirma ? onRemove() : setConfirma(true))}
              onBlur={() => setConfirma(false)}
              className={`rounded-lg border px-4 text-sm ${
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
