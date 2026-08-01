import { useState } from "react";
import { CANAIS_UNIVERSO, pad } from "../lib/dmx.js";
import Campo from "./Campo.jsx";

export default function Formulario({
  sugestao,
  biblioteca,
  onSalvarNaBiblioteca,
  onRemoverDaBiblioteca,
  onFechar,
  onSalvar,
}) {
  const [nome, setNome] = useState("");
  const [canais, setCanais] = useState("");
  const [qtd, setQtd] = useState("1");
  const [inicio, setInicio] = useState(String(sugestao));

  const valido = nome.trim() && +canais > 0 && +qtd > 0 && +inicio > 0;
  const podeSalvarNaLib =
    nome.trim() &&
    +canais > 0 &&
    !biblioteca.some((f) => f.nome === nome.trim() && f.canais === +canais);
  const fimTotal = +inicio + +qtd * +canais - 1;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[92dvh] w-full flex-col rounded-t-2xl border-t border-neutral-800 bg-neutral-950 sm:max-w-md sm:rounded-2xl sm:border">
        {/* alça do sheet */}
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-neutral-700" />

        <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Novo equipamento
          </h2>
          <button onClick={onFechar} className="-m-2 p-2 text-neutral-500">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-4">
          <p className="mb-2 mt-2 text-xs font-medium uppercase tracking-wider text-neutral-600">
            Biblioteca
          </p>
          {biblioteca.length === 0 ? (
            <p className="mb-4 rounded-lg border border-dashed border-neutral-800 px-3 py-3 text-xs text-neutral-600">
              Biblioteca vazia. Preencha os campos abaixo e guarde o
              equipamento para reaproveitar depois.
            </p>
          ) : (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {biblioteca.map((f) => (
                <span
                  key={f.nome}
                  className={`flex items-center overflow-hidden rounded-lg border ${
                    nome === f.nome
                      ? "border-(--destaque) bg-(--destaque-fraco) text-(--destaque-claro)"
                      : "border-neutral-800 bg-neutral-900/50 text-neutral-300"
                  }`}
                >
                  <button
                    onClick={() => {
                      setNome(f.nome);
                      setCanais(String(f.canais));
                    }}
                    className="py-2 pl-3 pr-1.5 text-xs font-medium"
                  >
                    {f.nome}
                    <span
                      className={
                        nome === f.nome
                          ? "ml-1.5 opacity-70"
                          : "ml-1.5 text-neutral-600"
                      }
                    >
                      {f.canais}c
                    </span>
                  </button>
                  <button
                    onClick={() => onRemoverDaBiblioteca(f.nome)}
                    className="py-2 pl-1 pr-2.5 text-xs text-neutral-600 active:text-red-400"
                    title="Tirar da biblioteca"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">
            Equipamento
          </p>
          <Campo label="Nome" valor={nome} onChange={setNome} />
          <div className="grid grid-cols-3 gap-2">
            <Campo label="Canais" valor={canais} onChange={setCanais} num />
            <Campo label="Quantidade" valor={qtd} onChange={setQtd} num />
            <Campo label="Começa em" valor={inicio} onChange={setInicio} num />
          </div>

          {podeSalvarNaLib && (
            <button
              onClick={() => onSalvarNaBiblioteca(nome.trim(), +canais)}
              className="mt-1 w-full rounded-lg border border-dashed border-neutral-700 py-2.5 text-xs text-neutral-400 active:border-neutral-500"
            >
              + Guardar “{nome.trim()}” {canais}c na biblioteca
            </button>
          )}

          {+canais > 0 && +qtd > 0 && +inicio > 0 && (
            <div
              className={`mt-3 rounded-lg border px-3 py-2.5 text-xs ${
                fimTotal > CANAIS_UNIVERSO
                  ? "border-red-800 bg-red-950/60 text-red-300"
                  : "border-neutral-800 bg-neutral-900/50 text-neutral-400"
              }`}
            >
              Ocupa <strong>{pad(+inicio)}</strong>–<strong>{pad(fimTotal)}</strong>{" "}
              · último aparelho em {pad(+inicio + (+qtd - 1) * +canais)}
              {fimTotal > CANAIS_UNIVERSO && (
                <span className="font-semibold"> · passa do 512</span>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-neutral-800 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            disabled={!valido}
            onClick={() => onSalvar(nome.trim(), +canais, +qtd, +inicio)}
            className="w-full rounded-lg bg-(--destaque) py-3.5 text-sm font-bold uppercase tracking-wider text-neutral-950 active:bg-(--destaque-ativo) disabled:bg-neutral-800 disabled:text-neutral-600"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
