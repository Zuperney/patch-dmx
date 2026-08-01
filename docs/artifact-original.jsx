import { useState, useEffect, useRef } from "react";

/* ---------------------------------------------------------------- */
/* biblioteca de fábrica — o que aparece em rental brasileiro        */
/* ---------------------------------------------------------------- */
const PADRAO = [
  { nome: "Beam 230 7R", canais: 16 },
  { nome: "Beam 295 / 12R", canais: 20 },
  { nome: "Mini Beam LED", canais: 14 },
  { nome: "Moving Wash LED", canais: 12 },
  { nome: "Moving Spot LED", canais: 18 },
  { nome: "Par LED RGBW", canais: 8 },
  { nome: "Par LED RGBWA+UV", canais: 10 },
  { nome: "Barra LED / Ribalta", canais: 15 },
  { nome: "Strobe LED", canais: 2 },
  { nome: "Máquina de fumaça", canais: 1 },
  { nome: "Dimmer 4 canais", canais: 4 },
];

const CANAIS_UNIVERSO = 512;

/* ---------------------------------------------------------------- */
/* helpers                                                           */
/* ---------------------------------------------------------------- */
const uid = () => Math.random().toString(36).slice(2, 9);

const enderecos = (g) =>
  Array.from({ length: g.qtd }, (_, i) => g.inicio + i * g.canais);

const fim = (g) => g.inicio + g.qtd * g.canais - 1;

const proximoLivre = (grupos) =>
  grupos.length ? Math.max(...grupos.map(fim)) + 1 : 1;

function colide(grupo, grupos) {
  const a1 = grupo.inicio;
  const a2 = fim(grupo);
  return grupos.some(
    (o) => o.id !== grupo.id && a1 <= fim(o) && o.inicio <= a2
  );
}

/* dip switch: chaves 1..9 valem 1,2,4...256 */
const dip = (endereco, somaMaisUm) => {
  const valor = somaMaisUm ? endereco - 1 : endereco;
  return Array.from({ length: 9 }, (_, i) => (valor >> i) & 1);
};

const pad = (n) => String(n).padStart(3, "0");

/* ---------------------------------------------------------------- */
/* persistência                                                      */
/* ---------------------------------------------------------------- */
const CHAVE = "patch-dmx:show";

async function carregar() {
  try {
    const r = await window.storage.get(CHAVE);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}
async function salvar(dados) {
  try {
    await window.storage.set(CHAVE, JSON.stringify(dados));
  } catch {
    /* sem storage: segue em memória */
  }
}

/* ---------------------------------------------------------------- */

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
      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-800 bg-neutral-950 p-4">
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

/* ---------------------------------------------------------------- */
function Regua({ grupos }) {
  return (
    <div className="mt-3 flex h-2 w-full gap-px overflow-hidden rounded-sm bg-neutral-900">
      {Array.from({ length: 64 }, (_, b) => {
        const ini = b * 8 + 1;
        const cheio = grupos.some((g) => ini <= fim(g) && g.inicio <= ini + 7);
        return (
          <div
            key={b}
            className={`flex-1 ${cheio ? "bg-amber-500" : "bg-neutral-800"}`}
          />
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- */
function Grupo({
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

/* ---------------------------------------------------------------- */
function Dip({ valor, somaMaisUm, apagado }) {
  const chaves = dip(valor, somaMaisUm);
  return (
    <span className="flex gap-0.5">
      {chaves.map((c, i) => (
        <span
          key={i}
          className={`h-4 w-2 rounded-sm ${
            c ? (apagado ? "bg-neutral-700" : "bg-amber-400") : "bg-neutral-800"
          }`}
          title={`chave ${i + 1}`}
        />
      ))}
    </span>
  );
}

/* ---------------------------------------------------------------- */
function Formulario({
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

function Campo({ label, valor, onChange, num }) {
  return (
    <label className="mb-2 block">
      <span className="mb-1 block text-xs text-neutral-500">{label}</span>
      <input
        type={num ? "number" : "text"}
        inputMode={num ? "numeric" : "text"}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-amber-500"
      />
    </label>
  );
}
