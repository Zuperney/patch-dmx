import { useState, useEffect, useRef } from "react";
import {
  CANAIS_UNIVERSO,
  uid,
  fim,
  cabem,
  proximoLivre,
  colide,
} from "./lib/dmx.js";
import { PADRAO } from "./lib/biblioteca.js";
import { carregar, salvar } from "./db.js";
import { useWakeLock } from "./hooks/useWakeLock.js";
import Regua from "./components/Regua.jsx";
import Grupo from "./components/Grupo.jsx";
import Formulario from "./components/Formulario.jsx";
import Config from "./components/Config.jsx";

export default function App() {
  const [universos, setUniversos] = useState([{ id: uid(), grupos: [] }]);
  const [atual, setAtual] = useState(0);
  const [aberto, setAberto] = useState(null);
  const [somaMaisUm, setSomaMaisUm] = useState(false);
  const [meus, setMeus] = useState([]); // biblioteca do usuário
  const [form, setForm] = useState(false);
  const [config, setConfig] = useState(false);
  const [confirmaEstouro, setConfirmaEstouro] = useState(false);
  const [pronto, setPronto] = useState(false);
  const primeiraVez = useRef(true);
  const wake = useWakeLock();

  useEffect(() => {
    carregar().then((d) => {
      if (d?.universos?.length) setUniversos(d.universos);
      if (d?.somaMaisUm) setSomaMaisUm(true);
      if (d?.meus?.length) setMeus(d.meus);
      setPronto(true);
    });
  }, []);

  useEffect(() => {
    if (!pronto) return;
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    salvar({ universos, somaMaisUm, meus });
  }, [universos, somaMaisUm, meus, pronto]);

  const uni = universos[atual] ?? { grupos: [] };
  const grupos = uni.grupos;
  const usados = grupos.reduce((s, g) => s + g.qtd * g.canais, 0);
  const biblioteca = [...PADRAO, ...meus];

  /* aparelhos que passam do 512 neste universo */
  const estourando = grupos.reduce(
    (s, g) => s + Math.max(0, g.qtd - cabem(g)),
    0
  );

  /* mutações -------------------------------------------------- */
  const setGrupos = (fn) =>
    setUniversos((us) =>
      us.map((u, i) => (i === atual ? { ...u, grupos: fn(u.grupos) } : u))
    );

  const addGrupo = (nome, canais, qtd, inicio) =>
    setGrupos((gs) => [
      ...gs,
      { id: uid(), nome, canais, qtd, inicio, feitos: [] },
    ]);

  const removeGrupo = (id) => {
    setGrupos((gs) => gs.filter((g) => g.id !== id));
    setAberto(null);
  };

  /* corta cada grupo no que cabe; some quem nem começa dentro do universo */
  const apagaEstouros = () => {
    setGrupos((gs) =>
      gs.flatMap((g) => {
        if (fim(g) <= CANAIS_UNIVERSO) return [g];
        const c = cabem(g);
        if (c <= 0) return [];
        return [{ ...g, qtd: c, feitos: g.feitos.filter((i) => i < c) }];
      })
    );
    setConfirmaEstouro(false);
  };

  const alterna = (id, i) =>
    setGrupos((gs) =>
      gs.map((g) => {
        if (g.id !== id) return g;
        const f = new Set(g.feitos);
        f.has(i) ? f.delete(i) : f.add(i);
        return { ...g, feitos: [...f] };
      })
    );

  const avanca = (id) =>
    setGrupos((gs) =>
      gs.map((g) => {
        if (g.id !== id) return g;
        const f = new Set(g.feitos);
        for (let i = 0; i < g.qtd; i++) {
          if (!f.has(i)) {
            f.add(i);
            break;
          }
        }
        return { ...g, feitos: [...f] };
      })
    );

  const desfaz = (id) =>
    setGrupos((gs) =>
      gs.map((g) => {
        if (g.id !== id) return g;
        const f = [...g.feitos].sort((a, b) => a - b);
        f.pop();
        return { ...g, feitos: f };
      })
    );

  const novoUniverso = () => {
    setUniversos((us) => [...us, { id: uid(), grupos: [] }]);
    setAtual(universos.length);
    setAberto(null);
  };

  const apagaUniverso = () => {
    setUniversos((us) => {
      if (us.length === 1) return [{ id: uid(), grupos: [] }];
      return us.filter((_, i) => i !== atual);
    });
    setAtual((a) => (a > 0 ? a - 1 : 0));
    setAberto(null);
    setConfig(false);
  };

  /* ------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 tabular-nums">
      <div className="mx-auto max-w-2xl pb-32">
        {/* cabeçalho */}
        <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Patch DMX
            </h1>
            <div className="flex gap-1.5">
              {wake.suportado && (
                <button
                  onClick={wake.alternar}
                  className={`rounded border px-3 py-1.5 text-xs ${
                    wake.ativo
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-neutral-700 text-neutral-400"
                  }`}
                >
                  {wake.ativo ? "☀ Tela acesa" : "☀ Tela"}
                </button>
              )}
              <button
                onClick={() => setConfig(true)}
                className="rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400"
              >
                ⚙ Config
              </button>
            </div>
          </div>

          {/* universos */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto">
            {universos.map((u, i) => (
              <button
                key={u.id}
                onClick={() => {
                  setAtual(i);
                  setAberto(null);
                }}
                className={`shrink-0 rounded px-4 py-1.5 text-sm font-medium ${
                  i === atual
                    ? "bg-amber-500 text-neutral-950"
                    : "border border-neutral-700 text-neutral-400"
                }`}
              >
                U{i + 1}
              </button>
            ))}
            <button
              onClick={novoUniverso}
              className="shrink-0 rounded border border-dashed border-neutral-700 px-4 py-1.5 text-sm text-neutral-500"
            >
              +
            </button>
          </div>

          <Regua grupos={grupos} />
          <div className="mt-1.5 flex justify-between text-xs text-neutral-500">
            <span>
              {usados} de {CANAIS_UNIVERSO} canais
            </span>
            <span>
              {CANAIS_UNIVERSO - usados > 0
                ? `${CANAIS_UNIVERSO - usados} livres`
                : "universo cheio"}
            </span>
          </div>
        </header>

        {/* lista */}
        <main className="px-4">
          {estourando > 0 && (
            <div className="mt-3 rounded border border-red-800 bg-red-950/60 p-3">
              <p className="text-xs text-red-300">
                {estourando} {estourando === 1 ? "aparelho passa" : "aparelhos passam"}{" "}
                do 512 neste universo.
              </p>
              <button
                onClick={() =>
                  confirmaEstouro ? apagaEstouros() : setConfirmaEstouro(true)
                }
                onBlur={() => setConfirmaEstouro(false)}
                className={`mt-2 w-full rounded border py-2.5 text-sm font-medium ${
                  confirmaEstouro
                    ? "border-red-500 bg-red-900 text-red-200"
                    : "border-red-800 text-red-300"
                }`}
              >
                {confirmaEstouro
                  ? `Apagar ${estourando} de verdade?`
                  : "Apagar tudo que passa do 512"}
              </button>
            </div>
          )}

          {grupos.length === 0 && (
            <p className="py-16 text-center text-sm text-neutral-500">
              Universo vazio. Adicione o primeiro equipamento.
            </p>
          )}

          {grupos.map((g) => (
            <Grupo
              key={g.id}
              g={g}
              conflito={colide(g, grupos)}
              aberto={aberto === g.id}
              onAbrir={() => setAberto(aberto === g.id ? null : g.id)}
              onAlterna={(i) => alterna(g.id, i)}
              onAvanca={() => avanca(g.id)}
              onDesfaz={() => desfaz(g.id)}
              onRemove={() => removeGrupo(g.id)}
              somaMaisUm={somaMaisUm}
            />
          ))}
        </main>
      </div>

      {/* adicionar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-800 bg-neutral-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={() => setForm(true)}
            className="w-full rounded bg-amber-500 py-3.5 text-sm font-semibold uppercase tracking-wider text-neutral-950 active:bg-amber-600"
          >
            Adicionar equipamento
          </button>
        </div>
      </div>

      {form && (
        <Formulario
          sugestao={proximoLivre(grupos)}
          biblioteca={biblioteca}
          meus={meus}
          onSalvarNaBiblioteca={(nome, canais) =>
            setMeus((m) =>
              m.some((x) => x.nome === nome) ? m : [...m, { nome, canais }]
            )
          }
          onRemoverDaBiblioteca={(nome) =>
            setMeus((m) => m.filter((x) => x.nome !== nome))
          }
          onFechar={() => setForm(false)}
          onSalvar={(n, c, q, i) => {
            addGrupo(n, c, q, i);
            setForm(false);
          }}
        />
      )}

      {config && (
        <Config
          wake={wake}
          somaMaisUm={somaMaisUm}
          onSomaMaisUm={() => setSomaMaisUm((v) => !v)}
          rotuloUniverso={`U${atual + 1}`}
          onApagarUniverso={apagaUniverso}
          meus={meus}
          onEditarMeu={(i, novo) =>
            setMeus((m) => m.map((x, j) => (j === i ? novo : x)))
          }
          onRemoverMeu={(i) => setMeus((m) => m.filter((_, j) => j !== i))}
          onFechar={() => setConfig(false)}
        />
      )}
    </div>
  );
}
