/* Gera os ícones PNG do PWA sem dependências externas.
   Desenho: dip switch — fundo escuro, chaves âmbar. Rodar: npm run icones */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const FUNDO = [10, 10, 10];      // neutral-950
const LIGADA = [245, 158, 11];   // amber-500
const DESLIGADA = [64, 64, 64];  // neutral-700
const PADRAO_CHAVES = [1, 0, 1, 1, 0]; // “endereço” decorativo

function corDoPixel(x, y, tam) {
  const u = x / tam;
  const v = y / tam;
  const n = PADRAO_CHAVES.length;
  const larg = 0.09;
  const passo = (0.64 - larg) / (n - 1); // chaves entre u=0.18 e u=0.82
  for (let i = 0; i < n; i++) {
    const u0 = 0.18 + i * passo;
    if (u >= u0 && u <= u0 + larg) {
      const ligada = PADRAO_CHAVES[i];
      if (ligada && v >= 0.3 && v <= 0.7) return LIGADA;
      if (!ligada && v >= 0.52 && v <= 0.7) return DESLIGADA;
    }
  }
  return FUNDO;
}

function crc32(buf) {
  let c,
    crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(tipo, dados) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([len, corpo, crc]);
}

function png(tam) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0);
  ihdr.writeUInt32BE(tam, 4);
  ihdr[8] = 8; // bits
  ihdr[9] = 2; // RGB
  const linhas = Buffer.alloc(tam * (1 + tam * 3));
  for (let y = 0; y < tam; y++) {
    const base = y * (1 + tam * 3);
    linhas[base] = 0; // filtro none
    for (let x = 0; x < tam; x++) {
      const [r, g, b] = corDoPixel(x, y, tam);
      const p = base + 1 + x * 3;
      linhas[p] = r;
      linhas[p + 1] = g;
      linhas[p + 2] = b;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(linhas)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public", { recursive: true });
for (const tam of [192, 512]) {
  writeFileSync(`public/icone-${tam}.png`, png(tam));
  console.log(`public/icone-${tam}.png`);
}
