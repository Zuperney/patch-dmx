import { useState, useEffect, useRef } from "react";
import { CANAIS_UNIVERSO, uid, proximoLivre, colide } from "./lib/dmx.js";
import { PADRAO } from "./lib/biblioteca.js";
import { carregar, salvar } from "./db.js";
import Regua from "./components/Regua.jsx";
import Grupo from "./components/Grupo.jsx";
import Formulario from "./components/Formulario.jsx";

export default function App() {
  const [universos, setUniversos] = useState([{ id: uid(), grupos: [] }]);
  const [atual, setAtual] = useState(0);
  const [aberto, setAberto] = useState(null);
  const [somaMaisUm, setSomaMaisUm] = useState(false);
  const [meus, setMeus] = useState([]); // biblioteca do usuário
  const [form, setForm] = useState(false);
  const [confirmaUni, setConfirmaUni] = useState(false);
  const [pronto, setPronto] = useState(false);
  const primeiraVez = useRef(true);

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
    setConfirmaUni(false);
  };

  const apagaUniverso = () => {
    setUniversos((us) => {
      if (us.length === 1) return [{ id: uid(), grupos: [] }];
      return us.filter((_, i) => i !== atual);
    });
    setAtual((a) => (a > 0 ? a - 1 : 0));
    setAberto(null);
    setConfirmaUni(false);
  };

  /* ------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 tabular-nums">
      <div className="mx-auto max-w-2xl pb-32">
        {/* cabeçalho */}
        <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Patch DMX
            </h1>
            <div className="flex gap-1.5">
              <button
                onClick={() => setSomaMaisUm((v) => !v)}
                className="rounded border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400"
              >
                DIP: {somaMaisUm ? "soma+1" : "soma"}
              </button>
              <button
                onClick={() =>
                  confirmaUni ? apagaUniverso() : setConfirmaUni(true)
                }
                onBlur={() => setConfirmaUni(false)}
                className={`rounded border px-2 py-0.5 text-xs ${
                  confirmaUni
                    ? "border-red-600 bg-red-950 text-red-300"
                    : "border-neutral-700 text-neutral-500"
                }`}
              >
                {confirmaUni ? `Apagar U${atual + 1}?` : "Apagar universo"}
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
                  setConfirmaUni(false);
                }}
                className={`shrink-0 rounded px-3 py-1 text-sm font-medium ${
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
              className="shrink-0 rounded border border-dashed border-neutral-700 px-3 py-1 text-sm text-neutral-500"
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
            className="w-full rounded bg-amber-500 py-3 text-sm font-semibold uppercase tracking-wider text-neutral-950 active:bg-amber-600"
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
    </div>
  );
}
