import { useState, useEffect, useRef } from "react";
import {
  CANAIS_UNIVERSO,
  uid,
  fim,
  cabem,
  proximoLivre,
  colide,
  etiquetaDe,
  etiquetaPadrao,
} from "./lib/dmx.js";
import { PADRAO } from "./lib/biblioteca.js";
import { TEMAS } from "./lib/temas.js";
import { carregar, salvar } from "./db.js";
import { useWakeLock } from "./hooks/useWakeLock.js";
import {
  IconeSol,
  IconeEngrenagem,
  IconeMais,
  IconeDesfazer,
} from "./components/Icones.jsx";
import Regua from "./components/Regua.jsx";
import Grupo from "./components/Grupo.jsx";
import Formulario from "./components/Formulario.jsx";
import Config from "./components/Config.jsx";

export default function App() {
  const [universos, setUniversos] = useState([{ id: uid(), grupos: [] }]);
  const [atual, setAtual] = useState(0);
  const [aberto, setAberto] = useState(null);
  const [somaMaisUm, setSomaMaisUm] = useState(false);
  const [mostraDip, setMostraDip] = useState(true);
  const [meus, setMeus] = useState([]); // biblioteca do usuário
  const [ocultos, setOcultos] = useState([]); // itens de fábrica removidos
  const [destaque, setDestaque] = useState("ambar");
  const [efeitos, setEfeitos] = useState(true);
  const [form, setForm] = useState(false);
  const [config, setConfig] = useState(false);
  const [confirmaEstouro, setConfirmaEstouro] = useState(false);
  const [confirmaUni, setConfirmaUni] = useState(false);
  const [pronto, setPronto] = useState(false);
  const primeiraVez = useRef(true);
  const wake = useWakeLock();

  /* histórico de ações para o desfazer geral (só em memória) */
  const historico = useRef([]);
  const [nHistorico, setNHistorico] = useState(0);
  const guarda = () => {
    historico.current.push({ universos, atual });
    if (historico.current.length > 50) historico.current.shift();
    setNHistorico(historico.current.length);
  };
  const desfazer = () => {
    const ultimo = historico.current.pop();
    if (!ultimo) return;
    setNHistorico(historico.current.length);
    setUniversos(ultimo.universos);
    setAtual(ultimo.atual);
  };

  useEffect(() => {
    carregar().then((d) => {
      if (d?.universos?.length) setUniversos(d.universos);
      if (d?.somaMaisUm) setSomaMaisUm(true);
      if (d?.mostraDip === false) setMostraDip(false);
      if (d?.meus?.length) setMeus(d.meus);
      if (d?.ocultos?.length) setOcultos(d.ocultos);
      if (d?.destaque && TEMAS[d.destaque]) setDestaque(d.destaque);
      if (d?.efeitos === false) setEfeitos(false);
      setPronto(true);
    });
  }, []);

  useEffect(() => {
    if (!pronto) return;
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    salvar({ universos, somaMaisUm, mostraDip, meus, ocultos, destaque, efeitos });
  }, [universos, somaMaisUm, mostraDip, meus, ocultos, destaque, efeitos, pronto]);

  const uni = universos[atual] ?? { grupos: [] };
  const grupos = uni.grupos;
  const usados = grupos.reduce((s, g) => s + g.qtd * g.canais, 0);
  const biblioteca = [
    ...PADRAO.filter((p) => !ocultos.includes(p.nome)),
    ...meus,
  ];
  const tema = TEMAS[destaque] ?? TEMAS.ambar;

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

  const addGrupo = (nome, canais, qtd, inicio) => {
    guarda();
    setGrupos((gs) => [
      ...gs,
      { id: uid(), nome, canais, qtd, inicio, feitos: [] },
    ]);
  };

  const removeGrupo = (id) => {
    guarda();
    setGrupos((gs) => gs.filter((g) => g.id !== id));
    setAberto(null);
  };

  /* recorta um grupo mantendo só os aparelhos de `indices` (ordem nova).
     feitos seguem os aparelhos; etiquetas deslocadas são materializadas
     para preservar a numeração real da vara */
  const sub = (g, indices) => {
    const etiquetas = {};
    indices.forEach((antigo, novo) => {
      if (antigo !== novo || g.etiquetas?.[antigo]) {
        const v = etiquetaDe(g, antigo);
        if (v !== etiquetaPadrao(g, novo)) etiquetas[novo] = v;
      }
    });
    return {
      ...g,
      qtd: indices.length,
      feitos: indices
        .map((antigo, novo) => (g.feitos.includes(antigo) ? novo : -1))
        .filter((n) => n !== -1),
      etiquetas,
    };
  };

  /* tira um aparelho físico do grupo. Tirar do meio divide o grupo em
     dois, preservando endereços e etiquetas dos que já estão pendurados */
  const removeAparelho = (id, i) => {
    guarda();
    setGrupos((gs) =>
      gs.flatMap((g) => {
        if (g.id !== id) return [g];
        if (g.qtd === 1) return [];
        const todos = Array.from({ length: g.qtd }, (_, j) => j);
        if (i === 0)
          return [
            { ...sub(g, todos.slice(1)), inicio: g.inicio + g.canais },
          ];
        if (i === g.qtd - 1) return [sub(g, todos.slice(0, -1))];
        return [
          sub(g, todos.slice(0, i)),
          {
            ...sub(g, todos.slice(i + 1)),
            id: uid(),
            inicio: g.inicio + (i + 1) * g.canais,
          },
        ];
      })
    );
    setAberto((a) => (grupos.find((g) => g.id === id)?.qtd === 1 ? null : a));
  };

  /* etiquetas: grava o texto cru durante a edição… */
  const setEtiqueta = (id, i, valor) =>
    setGrupos((gs) =>
      gs.map((g) =>
        g.id === id
          ? { ...g, etiquetas: { ...(g.etiquetas ?? {}), [i]: valor } }
          : g
      )
    );

  /* …e ao concluir descarta vazias e iguais ao padrão */
  const limpaEtiquetas = (id) =>
    setGrupos((gs) =>
      gs.map((g) => {
        if (g.id !== id) return g;
        const etiquetas = {};
        for (const [k, v] of Object.entries(g.etiquetas ?? {})) {
          const t = (v ?? "").trim();
          if (t && t !== etiquetaPadrao(g, +k)) etiquetas[k] = t;
        }
        return { ...g, etiquetas };
      })
    );

  /* corta cada grupo no que cabe; some quem nem começa dentro do universo */
  const apagaEstouros = () => {
    guarda();
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

  /* remove da biblioteca: item do usuário some, item de fábrica é ocultado */
  const removeDaBiblioteca = (nome) => {
    if (meus.some((x) => x.nome === nome))
      setMeus((m) => m.filter((x) => x.nome !== nome));
    else setOcultos((o) => (o.includes(nome) ? o : [...o, nome]));
  };

  const alterna = (id, i) => {
    guarda();
    return setGrupos((gs) =>
      gs.map((g) => {
        if (g.id !== id) return g;
        const f = new Set(g.feitos);
        f.has(i) ? f.delete(i) : f.add(i);
        return { ...g, feitos: [...f] };
      })
    );
  };

  /* mais um aparelho igual no fim do grupo */
  const addAparelho = (id) => {
    guarda();
    setGrupos((gs) =>
      gs.map((g) => (g.id === id ? { ...g, qtd: g.qtd + 1 } : g))
    );
  };

  const novoUniverso = () => {
    guarda();
    setUniversos((us) => [...us, { id: uid(), grupos: [] }]);
    setAtual(universos.length);
    setAberto(null);
  };

  const apagaUniverso = () => {
    guarda();
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
    <div
      className="transicao-tema relative min-h-screen bg-neutral-950 text-neutral-200 tabular-nums"
      data-efeitos={efeitos ? "on" : "off"}
      style={{
        "--destaque": tema.cor,
        "--destaque-claro": tema.claro,
        "--destaque-ativo": tema.ativo,
        "--destaque-fraco": `color-mix(in srgb, ${tema.cor} 12%, transparent)`,
      }}
    >
      {/* luz ambiente: blobs + grade de canais + ruído */}
      <div className="fundo-cena" aria-hidden="true">
        <div className="blob" style={{ top: "-22vmax", left: "-18vmax" }} />
        <div className="blob" style={{ bottom: "-26vmax", right: "-20vmax" }} />
        <div className="grade-neon" />
        <div className="ruido" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl pb-28">
        {/* cabeçalho */}
        <header className="vidro borda-gradiente-baixo sticky top-0 z-20 bg-neutral-950/70 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <h1 className="titulo-neon text-sm font-bold uppercase tracking-widest">
              Patch DMX
            </h1>
            <div className="flex gap-1.5">
              {nHistorico > 0 && (
                <button
                  onClick={desfazer}
                  aria-label="Desfazer última ação"
                  title="Desfazer última ação"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-neutral-400 transition-transform duration-200 active:scale-90 active:text-neutral-200"
                >
                  <IconeDesfazer />
                </button>
              )}
              {wake.suportado && (
                <button
                  onClick={wake.alternar}
                  aria-label={
                    wake.ativo ? "Deixar a tela apagar" : "Manter a tela acesa"
                  }
                  title="Manter a tela acesa"
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 active:scale-90 ${
                    wake.ativo
                      ? "borda-viva-cheia text-neutral-950 shadow-[0_0_12px_var(--destaque-fraco)]"
                      : "border-neutral-700 text-neutral-400"
                  }`}
                >
                  <IconeSol cheio={wake.ativo} />
                </button>
              )}
              <button
                onClick={() => setConfig(true)}
                aria-label="Configurações"
                title="Configurações"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-neutral-400 transition-all duration-200 active:scale-90 active:text-neutral-200"
              >
                <IconeEngrenagem />
              </button>
            </div>
          </div>

          {/* universos — pill desliza atrás da aba ativa */}
          <div className="relative mt-3 flex items-center gap-1.5 overflow-x-auto">
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-full w-14 rounded-lg bg-(--destaque) transition-transform"
              style={{
                transform: `translateX(calc(${atual} * (3.5rem + 0.375rem)))`,
                transitionDuration: "var(--dur, 300ms)",
                transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1.15)",
              }}
            />
            {universos.map((u, i) => (
              <button
                key={u.id}
                onClick={() => {
                  setAtual(i);
                  setAberto(null);
                }}
                className={`relative w-14 shrink-0 rounded-lg py-1.5 text-center text-sm font-medium transition-transform ${
                  i === atual
                    ? "scale-105 text-neutral-950"
                    : "border border-neutral-700 text-neutral-400"
                }`}
                style={{ transitionDuration: "var(--dur, 300ms)" }}
              >
                U{i + 1}
              </button>
            ))}
            <button
              onClick={novoUniverso}
              className="w-14 shrink-0 rounded-lg border border-dashed border-neutral-700 py-1.5 text-center text-sm text-neutral-500"
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

        {/* lista — key troca com o universo para animar a entrada */}
        <main key={uni.id} className="entra-expande px-4">
          {estourando > 0 && (
            <div className="pulsa-alerta mt-3 rounded-xl border border-red-800 bg-red-950/60 p-3">
              <p className="text-xs text-red-300">
                {estourando}{" "}
                {estourando === 1 ? "aparelho passa" : "aparelhos passam"} do
                512 neste universo.
              </p>
              <button
                onClick={() =>
                  confirmaEstouro ? apagaEstouros() : setConfirmaEstouro(true)
                }
                onBlur={() => setConfirmaEstouro(false)}
                className={`mt-2 w-full rounded-lg border py-2.5 text-sm font-medium ${
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
              onAddAparelho={() => addAparelho(g.id)}
              onDesfaz={desfazer}
              podeDesfazer={nHistorico > 0}
              onRemove={() => removeGrupo(g.id)}
              onRemoveAparelho={(i) => removeAparelho(g.id, i)}
              onEtiqueta={(i, v) => setEtiqueta(g.id, i, v)}
              onEtiquetasFim={() => limpaEtiquetas(g.id)}
              somaMaisUm={somaMaisUm}
              mostraDip={mostraDip}
            />
          ))}

          {/* apagar o universo atual — na tela principal, com dois toques */}
          <button
            onClick={() =>
              confirmaUni ? apagaUniverso() : setConfirmaUni(true)
            }
            onBlur={() => setConfirmaUni(false)}
            className={`mb-4 mt-6 w-full rounded-xl border py-3 text-sm ${
              confirmaUni
                ? "border-red-600 bg-red-950 text-red-300"
                : "border-neutral-800 text-neutral-600"
            }`}
          >
            {confirmaUni
              ? `Apagar U${atual + 1} de verdade?`
              : `Apagar universo U${atual + 1}`}
          </button>
        </main>
      </div>

      {/* FAB de adicionar — some quando um grupo está aberto para não
          brigar com a barra de endereçamento */}
      {aberto === null && !form && !config && (
        <button
          onClick={() => setForm(true)}
          aria-label="Adicionar equipamento"
          title="Adicionar equipamento"
          className="fab-halo fab-orbe pop-ok fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full text-neutral-950 transition-transform duration-200 active:scale-90"
        >
          <IconeMais />
        </button>
      )}

      {form && (
        <Formulario
          sugestao={proximoLivre(grupos)}
          biblioteca={biblioteca}
          onSalvarNaBiblioteca={(nome, canais) =>
            setMeus((m) =>
              m.some((x) => x.nome === nome) ? m : [...m, { nome, canais }]
            )
          }
          onRemoverDaBiblioteca={removeDaBiblioteca}
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
          mostraDip={mostraDip}
          onMostraDip={() => setMostraDip((v) => !v)}
          destaque={destaque}
          onDestaque={setDestaque}
          efeitos={efeitos}
          onEfeitos={() => setEfeitos((v) => !v)}
          meus={meus}
          onEditarMeu={(i, novo) =>
            setMeus((m) => m.map((x, j) => (j === i ? novo : x)))
          }
          onRemoverMeu={(i) => setMeus((m) => m.filter((_, j) => j !== i))}
          ocultos={ocultos.length}
          onRestaurar={() => setOcultos([])}
          onFechar={() => setConfig(false)}
        />
      )}
    </div>
  );
}
