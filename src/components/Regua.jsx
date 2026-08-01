import { fim } from "../lib/dmx.js";

export default function Regua({ grupos }) {
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
