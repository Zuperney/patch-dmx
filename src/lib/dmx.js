/* Domínio DMX — regras de cálculo. Ver docs/CONTEXTO.md antes de mexer. */

export const CANAIS_UNIVERSO = 512;

export const uid = () => Math.random().toString(36).slice(2, 9);

/* endereços derivados do grupo: inicio + i × canais */
export const enderecos = (g) =>
  Array.from({ length: g.qtd }, (_, i) => g.inicio + i * g.canais);

export const fim = (g) => g.inicio + g.qtd * g.canais - 1;

export const proximoLivre = (grupos) =>
  grupos.length ? Math.max(...grupos.map(fim)) + 1 : 1;

export function colide(grupo, grupos) {
  const a1 = grupo.inicio;
  const a2 = fim(grupo);
  return grupos.some(
    (o) => o.id !== grupo.id && a1 <= fim(o) && o.inicio <= a2
  );
}

/* etiqueta por aparelho: derivada do nome ("Beam 3") ou personalizada */
export const etiquetaPadrao = (g, i) => `${g.nome.split(" ")[0]} ${i + 1}`;

export const etiquetaDe = (g, i) => {
  const v = g.etiquetas?.[i];
  return v && v.trim() ? v : etiquetaPadrao(g, i);
};

/* quantos aparelhos do grupo cabem inteiros até o canal 512 */
export const cabem = (g) =>
  Math.max(0, Math.floor((CANAIS_UNIVERSO - g.inicio + 1) / g.canais));

/* dip switch: chaves 1..9 valem 1,2,4...256 */
export const dip = (endereco, somaMaisUm) => {
  const valor = somaMaisUm ? endereco - 1 : endereco;
  return Array.from({ length: 9 }, (_, i) => (valor >> i) & 1);
};

export const pad = (n) => String(n).padStart(3, "0");
