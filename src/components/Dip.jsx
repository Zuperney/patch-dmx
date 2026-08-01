import { dip } from "../lib/dmx.js";

export default function Dip({ valor, somaMaisUm, apagado }) {
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
