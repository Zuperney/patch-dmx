# Patch DMX

App web para **endereçamento de equipamentos de iluminação durante a montagem**.
Feito para o técnico de campo: toque grande, contraste alto, estado salvo
sempre, funciona offline.

**Usar no celular:** abra <https://zuperney.github.io/patch-dmx/> e adicione à
tela inicial (é um PWA — instala como app e funciona sem internet).

## O que faz

- Universos DMX em abas, com régua visual dos 512 canais
- Grupos de equipamentos com endereços derivados (`início + i × canais`)
- Sugestão automática do próximo endereço livre
- Dip switch desenhado por aparelho, com as duas convenções (soma / soma+1)
- Marcação de "onde parei" por aparelho, individual e fora de ordem
- Detecção de colisão entre grupos e de estouro do universo, apontando o
  aparelho exato onde estoura
- Biblioteca de equipamentos de fábrica + biblioteca do usuário
- Persistência automática em IndexedDB — nenhum botão de salvar

## Desenvolvimento

```
npm install
npm run dev      # servidor local
npm run build    # build de produção em dist/
npm run icones   # regenera os ícones PNG do PWA
```

Stack: Vite, React, Tailwind CSS 4, vite-plugin-pwa. Deploy automático no
GitHub Pages a cada push na `main` (`.github/workflows/deploy.yml`).

## Documentação

O domínio DMX, as decisões de UX e o backlog estão em
[docs/CONTEXTO.md](docs/CONTEXTO.md). **Leia antes de mexer no código** — há
regras de negócio (fronteira de universo, convenções de dip switch) e decisões
de UX de campo que não devem ser desfeitas sem conversa.
