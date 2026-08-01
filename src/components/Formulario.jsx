import { useState } from "react";
import { CANAIS_UNIVERSO, pad } from "../lib/dmx.js";
import Campo from "./Campo.jsx";

export default function Formulario({
  sugestao,
  biblioteca,
  meus,
  onSalvarNaBiblioteca,
  onRemoverDaBiblioteca,
  onFechar,
  onSalvar,
}) {
  const [nome, setNome] = useState("");
  const [canais, setCanais] = useState("");
  const [qtd, setQtd] = useState("1");
  const [inicio, setInicio] = useState(String(sugestao));

  const meuNome = (n) => meus.some((x) => x.nome === n);
  const valido = nome.trim() && +canais > 0 && +qtd > 0 && +inicio > 0;
  const podeSalvarNaLib =
    nome.trim() &&
    +canais > 0 &&
    !biblioteca.some((f) => f.nome === nome.trim() && f.canais === +canais);

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/70 sm:items-center sm:justify-center">
      <div className="max-h-full w-full overflow-y-auto rounded-t-xl border-t border-neutral-800 bg-neutral-950 p-4 sm:max-w-md sm:rounded-xl sm:border">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Novo equipamento
          </h2>
          <button onClick={onFechar} className="text-neutral-500">
            ✕
          </button>
        </div>

        <p className="mb-2 text-xs text-neutral-500">Da biblioteca</p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {biblioteca.map((f) => (
            <span
              key={f.nome}
              className={`flex items-center rounded border ${
                nome === f.nome
                  ? "border-amber-500 text-amber-400"
                  : meuNome(f.nome)
                  ? "border-neutral-600 text-neutral-300"
                  : "border-neutral-800 text-neutral-400"
              }`}
            >
              <button
                onClick={() => {
                  setNome(f.nome);
                  setCanais(String(f.canais));
                }}
                className="px-2 py-1 text-xs"
              >
                {f.nome}
                <span className="ml-1 text-neutral-600">{f.canais}c</span>
              </button>
              {meuNome(f.nome) && (
                <button
                  onClick={() => onRemoverDaBiblioteca(f.nome)}
                  className="pr-1.5 text-xs text-neutral-600"
                  title="Tirar da biblioteca"
                >
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>

        <Campo label="Nome" valor={nome} onChange={setNome} />
        <div className="grid grid-cols-3 gap-2">
          <Campo label="Canais" valor={canais} onChange={setCanais} num />
          <Campo label="Quantidade" valor={qtd} onChange={setQtd} num />
          <Campo label="Começa em" valor={inicio} onChange={setInicio} num />
        </div>

        {podeSalvarNaLib && (
          <button
            onClick={() => onSalvarNaBiblioteca(nome.trim(), +canais)}
            className="mt-1 w-full rounded border border-dashed border-neutral-700 py-2 text-xs text-neutral-400"
          >
            + Guardar “{nome.trim()}” {canais}c na biblioteca
          </button>
        )}

        {+canais > 0 && +qtd > 0 && +inicio > 0 && (
          <p className="mt-2 text-xs text-neutral-500">
            Ocupa {pad(+inicio)}–{pad(+inicio + +qtd * +canais - 1)} · último
            aparelho em {pad(+inicio + (+qtd - 1) * +canais)}
            {+inicio + +qtd * +canais - 1 > CANAIS_UNIVERSO && (
              <span className="text-red-400"> · passa do 512</span>
            )}
          </p>
        )}

        <button
          disabled={!valido}
          onClick={() => onSalvar(nome.trim(), +canais, +qtd, +inicio)}
          className="mt-4 w-full rounded bg-amber-500 py-3 text-sm font-semibold uppercase tracking-wider text-neutral-950 disabled:bg-neutral-800 disabled:text-neutral-600"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
