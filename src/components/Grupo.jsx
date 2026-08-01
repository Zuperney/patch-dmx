import { useState } from "react";
import { CANAIS_UNIVERSO, enderecos, fim, pad, etiquetaDe } from "../lib/dmx.js";
import { IconeLapis } from "./Icones.jsx";
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
  onRemoveAparelho,
  onEtiqueta,
  onEtiquetasFim,
  somaMaisUm,
  mostraDip,
}) {
  const [confirmaCard, setConfirmaCard] = useState(false);
  const [confirmaAp, setConfirmaAp] = useState(null);
  const [editaEtiquetas, setEditaEtiquetas] = useState(false);
  const lista = enderecos(g);
  const feitos = new Set(g.feitos);
  const atual = lista.findIndex((_, i) => !feitos.has(i));
  const completo = atual === -1;
  const pct = Math.round((g.feitos.length / g.qtd) * 100);

  /* primeiro aparelho que não cabe inteiro no universo */
  const iEstouro = lista.findIndex((e) => e + g.canais - 1 > CANAIS_UNIVERSO);
  const estoura = iEstouro !== -1;
  const cabemAqui = estoura ? iEstouro : g.qtd;

  const fechaEdicao = () => {
    if (editaEtiquetas) {
      onEtiquetasFim();
      setEditaEtiquetas(false);
    }
  };

  return (
    <section
      className={`mt-3 overflow-hidden rounded-xl border ${
        conflito || estoura
          ? "border-red-800 bg-neutral-900/30"
          : aberto
          ? "borda-sutil bg-neutral-900/30"
          : "border-neutral-800 bg-neutral-900/30"
      }`}
    >
      <div className="flex items-stretch">
        <button
          onClick={() => {
            fechaEdicao();
            onAbrir();
          }}
          className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 text-left active:bg-neutral-900/60"
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
        {/* apagar o grupo inteiro direto do card, sem precisar abrir */}
        <button
          onClick={() =>
            confirmaCard ? onRemove() : setConfirmaCard(true)
          }
          onBlur={() => setConfirmaCard(false)}
          className={`shrink-0 px-3.5 text-xs ${
            confirmaCard
              ? "bg-red-950 font-semibold text-red-300"
              : "text-neutral-700 active:text-red-400"
          }`}
        >
          {confirmaCard ? "apagar?" : "✕"}
        </button>
      </div>

      {/* progresso do endereçamento */}
      <div className="relative h-1 w-full bg-neutral-900">
        <div
          className={`h-full transition-all ${
            completo ? "bg-emerald-500 shadow-[0_0_12px_#10b981]" : "progresso-liquido"
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
        <div className="entra-expande border-t border-neutral-800">
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
                  {editaEtiquetas ? (
                    /* modo edição: um input grande por aparelho */
                    <div className="flex items-center gap-3 border-b border-neutral-900 px-4 py-2">
                      <span className="w-6 shrink-0 text-xs text-neutral-600">
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={g.etiquetas?.[i] ?? etiquetaDe(g, i)}
                        onChange={(e) => onEtiqueta(i, e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-base text-neutral-100 outline-none focus:border-(--destaque)"
                      />
                      <span className="shrink-0 text-xs text-neutral-600">
                        {pad(end)}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`flex items-stretch border-b border-neutral-900 ${
                        fora ? "bg-red-950" : eAtual ? "bg-neutral-900" : ""
                      }`}
                    >
                      <button
                        onClick={() => onAlterna(i)}
                        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left"
                      >
                        <span
                          className={`w-6 shrink-0 text-xs ${
                            ok
                              ? "pop-ok text-emerald-500"
                              : fora
                              ? "text-red-500"
                              : "text-neutral-600"
                          }`}
                        >
                          {ok ? "✓" : i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`truncate text-xs ${
                              ok
                                ? "text-neutral-600"
                                : fora
                                ? "text-red-400"
                                : "text-neutral-400"
                            }`}
                          >
                            {etiquetaDe(g, i)}
                          </div>
                          <div className="mt-0.5 flex items-center gap-3">
                            <span
                              className={`w-16 shrink-0 text-xl font-semibold ${
                                ok
                                  ? "text-neutral-600 line-through"
                                  : fora
                                  ? "text-red-400"
                                  : eAtual
                                  ? "brilho-num text-(--destaque-claro)"
                                  : "text-neutral-200"
                              }`}
                            >
                              {pad(end)}
                            </span>
                            {mostraDip && (
                              <Dip
                                valor={end}
                                somaMaisUm={somaMaisUm}
                                apagado={ok || fora}
                              />
                            )}
                          </div>
                        </div>
                        <span
                          className={`ml-auto shrink-0 text-xs ${
                            fora ? "text-red-500" : "text-neutral-600"
                          }`}
                        >
                          {pad(end)}–{pad(end + g.canais - 1)}
                        </span>
                      </button>
                      {/* tirar este aparelho do grupo (não coube, quebrou...) */}
                      <button
                        onClick={() =>
                          confirmaAp === i
                            ? (onRemoveAparelho(i), setConfirmaAp(null))
                            : setConfirmaAp(i)
                        }
                        onBlur={() => setConfirmaAp(null)}
                        className={`shrink-0 px-3.5 text-xs ${
                          confirmaAp === i
                            ? "bg-red-950 font-semibold text-red-300"
                            : "text-neutral-700 active:text-red-400"
                        }`}
                      >
                        {confirmaAp === i ? "tirar?" : "✕"}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* barra de ações flutuante: acompanha a rolagem da lista */}
          <div className="vidro sticky bottom-0 z-10 flex gap-2 border-t border-white/10 bg-neutral-950/75 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {editaEtiquetas ? (
              <button
                onClick={fechaEdicao}
                className="botao-neon flex-1 rounded-lg bg-(--destaque) py-3.5 text-sm font-bold text-neutral-950 transition-transform active:scale-[0.97]"
              >
                Concluir etiquetas
              </button>
            ) : (
              <>
                <button
                  onClick={onAvanca}
                  disabled={completo}
                  className="botao-neon flex-1 rounded-lg bg-(--destaque) py-3.5 text-sm font-bold text-neutral-950 transition-transform active:scale-[0.97] active:bg-(--destaque-ativo) disabled:bg-neutral-800 disabled:text-neutral-600 disabled:shadow-none"
                >
                  {completo
                    ? "Tudo endereçado"
                    : `Endereçar ${pad(lista[atual])} →`}
                </button>
                <button
                  onClick={onDesfaz}
                  className="rounded-lg border border-neutral-700 px-4 text-sm text-neutral-400"
                >
                  Desfazer
                </button>
                <button
                  onClick={() => setEditaEtiquetas(true)}
                  aria-label="Editar etiquetas"
                  title="Editar etiquetas"
                  className="flex items-center justify-center rounded-lg border border-neutral-700 px-3.5 text-neutral-400"
                >
                  <IconeLapis />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
