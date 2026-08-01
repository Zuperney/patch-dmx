export default function Campo({ label, valor, onChange, num }) {
  return (
    <label className="mb-2 block">
      <span className="mb-1 block text-xs text-neutral-500">{label}</span>
      <input
        type={num ? "number" : "text"}
        inputMode={num ? "numeric" : "text"}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-3 text-base text-neutral-100 outline-none focus:border-(--destaque)"
      />
    </label>
  );
}
