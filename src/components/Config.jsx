import { useState } from "react";

/* Painel de configurações globais: tela, convenção de dip, universo e
   biblioteca do usuário. Bottom sheet, mesmo padrão do Formulario. */
export default function Config({
  wake,
  somaMaisUm,
  onSomaMaisUm,
  rotuloUniverso,
  onApagarUniverso,
  meus,
  onEditarMeu,
  onRemoverMeu,
  onFechar,
}) {
  const [confirmaUni, setConfirmaUni] = useState(false);

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/70 sm:items-center sm:justify-center">
      <div className="max-h-full w-full overflow-y-auto rounded-t-xl border-t border-neutral-800 bg-neutral-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-xl sm:border">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Configurações
          </h2>
          <button onClick={onFechar} className="-m-2 p-2 text-neutral-500">
            ✕
          </button>
        </div>

        {/* tela */}
        <p className="mb-1.5 text-xs text-neutral-500">Tela</p>
        {wake.suportado ? (
          <button
            onClick={wake.alternar}
            className={`mb-4 flex w-full items-center justify-between rounded border px-3 py-3 text-sm ${
              wake.ativo
                ? "border-amber-500 text-amber-400"
                : "border-neutral-700 text-neutral-300"
            }`}
          >
            <span>Manter a tela acesa</span>
            <span className="text-xs">{wake.ativo ? "ligado" : "desligado"}</span>
          </button>
        ) : (
          <p className="mb-4 rounded border border-neutral-800 px-3 py-3 text-xs text-neutral-500">
            Este navegador não suporta manter a tela acesa.
          </p>
        )}

        {/* dip switch */}
        <p className="mb-1.5 text-xs text-neutral-500">
          Convenção do dip switch
        </p>
        <button
          onClick={onSomaMaisUm}
          className="mb-1 flex w-full items-center justify-between rounded border border-neutral-700 px-3 py-3 text-sm text-neutral-300"
        >
          <span>Endereço = soma das chaves{somaMaisUm ? " + 1" : ""}</span>
          <span className="text-xs text-amber-400">
            {somaMaisUm ? "soma+1" : "soma"}
          </span>
        </button>
        <p className="mb-4 text-xs text-neutral-600">
          A maioria dos fabricantes usa a soma direta. Alguns somam 1. Se o
          aparelho responder no endereço errado por 1, troque aqui.
        </p>

        {/* biblioteca do usuário */}
        <p className="mb-1.5 text-xs text-neutral-500">Minha biblioteca</p>
        {meus.length === 0 ? (
          <p className="mb-4 rounded border border-dashed border-neutral-800 px-3 py-3 text-xs text-neutral-600">
            Nada aqui ainda. Ao adicionar um equipamento novo, use “Guardar na
            biblioteca” para ele aparecer nesta lista.
          </p>
        ) : (
          <ul className="mb-4">
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

        {/* universo */}
        <p className="mb-1.5 text-xs text-neutral-500">Universo</p>
        <button
          onClick={() =>
            confirmaUni
              ? (onApagarUniverso(), setConfirmaUni(false))
              : setConfirmaUni(true)
          }
          onBlur={() => setConfirmaUni(false)}
          className={`w-full rounded border px-3 py-3 text-sm ${
            confirmaUni
              ? "border-red-600 bg-red-950 text-red-300"
              : "border-neutral-800 text-neutral-400"
          }`}
        >
          {confirmaUni
            ? `Apagar ${rotuloUniverso} de verdade?`
            : `Apagar ${rotuloUniverso} (universo atual)`}
        </button>
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
        className="min-w-0 flex-1 rounded border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 outline-none focus:border-amber-500"
      />
      <input
        type="number"
        inputMode="numeric"
        value={canais}
        onChange={(e) => setCanais(e.target.value)}
        onBlur={grava}
        className="w-16 rounded border border-neutral-800 bg-neutral-900 px-2 py-2.5 text-center text-sm text-neutral-100 outline-none focus:border-amber-500"
      />
      <button
        onClick={() => (confirma ? onRemover() : setConfirma(true))}
        onBlur={() => setConfirma(false)}
        className={`shrink-0 rounded border px-3 py-2.5 text-sm ${
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
