import { useState } from "react";
import { TEMAS } from "../lib/temas.js";

/* Painel de configurações globais: tela, cor, convenção de dip, universo e
   biblioteca do usuário. Bottom sheet, mesmo padrão do Formulario. */
export default function Config({
  wake,
  somaMaisUm,
  onSomaMaisUm,
  mostraDip,
  onMostraDip,
  destaque,
  onDestaque,
  efeitos,
  onEfeitos,
  meus,
  onEditarMeu,
  onRemoverMeu,
  ocultos,
  onRestaurar,
  onFechar,
}) {
  return (
    <div className="veu entra-veu fixed inset-0 z-30 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="entra-sheet vidro reflexo flex max-h-[92dvh] w-full flex-col rounded-t-2xl border-t border-white/10 bg-neutral-950/80 sm:max-w-md sm:rounded-2xl sm:border">
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-neutral-700" />

        <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Configurações
          </h2>
          <button onClick={onFechar} className="-m-2 p-2 text-neutral-500">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* tela */}
          <p className="mb-2 mt-2 text-xs font-medium uppercase tracking-wider text-neutral-600">
            Tela
          </p>
          {wake.suportado ? (
            <button
              onClick={wake.alternar}
              className={`mb-4 flex w-full items-center justify-between rounded-lg border px-3 py-3 text-sm ${
                wake.ativo
                  ? "border-(--destaque) bg-(--destaque-fraco) text-(--destaque-claro)"
                  : "border-neutral-700 text-neutral-300"
              }`}
            >
              <span>Manter a tela acesa</span>
              <span className="text-xs">
                {wake.ativo ? "ligado" : "desligado"}
              </span>
            </button>
          ) : (
            <p className="mb-4 rounded-lg border border-neutral-800 px-3 py-3 text-xs text-neutral-500">
              Este navegador não suporta manter a tela acesa.
            </p>
          )}

          <button
            onClick={onEfeitos}
            className={`mb-1 flex w-full items-center justify-between rounded-lg border px-3 py-3 text-sm ${
              efeitos
                ? "border-(--destaque) bg-(--destaque-fraco) text-(--destaque-claro)"
                : "border-neutral-700 text-neutral-300"
            }`}
          >
            <span>Efeitos visuais</span>
            <span className="text-xs">{efeitos ? "ligados" : "desligados"}</span>
          </button>
          <p className="mb-4 text-xs text-neutral-600">
            Desligue para economizar bateria em aparelho fraco.
          </p>

          {/* cor de destaque */}
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">
            Cor de destaque
          </p>
          <div className="mb-4 flex gap-3">
            {Object.entries(TEMAS).map(([chave, t]) => (
              <button
                key={chave}
                onClick={() => onDestaque(chave)}
                aria-label={t.nome}
                title={t.nome}
                className={`bolinha h-11 w-11 rounded-full border-2 transition-transform active:scale-90 ${
                  chave === destaque
                    ? "bolinha-ativa scale-110"
                    : "border-neutral-800"
                }`}
                style={{ "--cor": t.cor }}
              />
            ))}
          </div>

          {/* dip switch */}
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">
            Dip switch
          </p>
          <button
            onClick={onMostraDip}
            className={`mb-1.5 flex w-full items-center justify-between rounded-lg border px-3 py-3 text-sm ${
              mostraDip
                ? "border-(--destaque) bg-(--destaque-fraco) text-(--destaque-claro)"
                : "border-neutral-700 text-neutral-300"
            }`}
          >
            <span>Mostrar dip switches nos endereços</span>
            <span className="text-xs">{mostraDip ? "visíveis" : "ocultos"}</span>
          </button>
          {mostraDip && (
            <>
              <button
                onClick={onSomaMaisUm}
                className="mb-1 flex w-full items-center justify-between rounded-lg border border-neutral-800 px-3 py-3 text-sm text-neutral-400"
              >
                <span>
                  Convenção: soma das chaves{somaMaisUm ? " + 1" : ""}
                </span>
                <span className="text-xs text-(--destaque-claro)">
                  {somaMaisUm ? "soma+1" : "soma"}
                </span>
              </button>
              <p className="mb-4 text-xs text-neutral-600">
                A maioria dos fabricantes usa a soma direta. Alguns somam 1. Se
                o aparelho responder no endereço errado por 1, troque aqui.
              </p>
            </>
          )}
          {!mostraDip && <div className="mb-4" />}

          {/* biblioteca do usuário */}
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">
            Minha biblioteca
          </p>
          {meus.length === 0 ? (
            <p className="mb-2 rounded-lg border border-dashed border-neutral-800 px-3 py-3 text-xs text-neutral-600">
              Nada aqui ainda. Ao adicionar um equipamento novo, use “Guardar na
              biblioteca” para ele aparecer nesta lista.
            </p>
          ) : (
            <ul className="mb-2">
              {meus.map((item, i) => (
                <ItemBiblioteca
                  key={i}
                  item={item}
                  onEditar={(novo) => onEditarMeu(i, novo)}
                  onRemover={() => onRemoverMeu(i)}
                />
              ))}
            </ul>
          )}
          {ocultos > 0 && (
            <button
              onClick={onRestaurar}
              className="mb-4 w-full rounded-lg border border-dashed border-neutral-700 py-2.5 text-xs text-neutral-400"
            >
              Restaurar {ocultos}{" "}
              {ocultos === 1 ? "item de fábrica removido" : "itens de fábrica removidos"}
            </button>
          )}
          {ocultos === 0 && <div className="mb-2" />}

          <p className="mt-5 text-center text-xs text-neutral-700">
            Patch DMX v{__APP_VERSAO__}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Linha editável: edita localmente, grava ao sair do campo. */
function ItemBiblioteca({ item, onEditar, onRemover }) {
  const [nome, setNome] = useState(item.nome);
  const [canais, setCanais] = useState(String(item.canais));
  const [confirma, setConfirma] = useState(false);

  const grava = () => {
    const n = nome.trim();
    const c = +canais;
    if (n && c > 0) onEditar({ nome: n, canais: c });
    else {
      setNome(item.nome);
      setCanais(String(item.canais));
    }
  };

  return (
    <li className="mb-1.5 flex items-center gap-1.5">
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onBlur={grava}
        className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 outline-none focus:border-(--destaque)"
      />
      <input
        type="number"
        inputMode="numeric"
        value={canais}
        onChange={(e) => setCanais(e.target.value)}
        onBlur={grava}
        className="w-16 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-2.5 text-center text-sm text-neutral-100 outline-none focus:border-(--destaque)"
      />
      <button
        onClick={() => (confirma ? onRemover() : setConfirma(true))}
        onBlur={() => setConfirma(false)}
        className={`shrink-0 rounded-lg border px-3 py-2.5 text-sm ${
          confirma
            ? "border-red-600 bg-red-950 text-red-300"
            : "border-neutral-800 text-neutral-500"
        }`}
      >
        {confirma ? "Apagar?" : "✕"}
      </button>
    </li>
  );
}
