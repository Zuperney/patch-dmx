export default function Campo({ label, valor, onChange, num }) {
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
