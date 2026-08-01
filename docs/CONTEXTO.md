# Patch DMX — documento de contexto

Handoff para o Claude Code. Contém o domínio, as decisões já tomadas, o que está
implementado e o backlog. Leia inteiro antes de escrever código.

---

## 1. O que é e para quem

App web para **endereçamento de equipamentos de iluminação durante a montagem**.

O usuário-alvo é técnico de montagem — não é programador de mesa, não é LD. Ele
chega no galpão com 40 aparelhos, precisa saber qual endereço colocar em cada um
e precisa saber **onde parou** quando o celular apagar ou o chefe chamar.

Dois momentos de uso:

- **Planejamento** — antes do evento, monta a lista de equipamentos por universo
- **Campo** — durante a montagem, com o celular na mão, uma mão suja, luz ruim

O segundo momento manda no design. Toque grande, contraste alto, estado salvo
sempre, nada que exija digitar.

**Escopo atual: apenas DMX.** Art-Net e sACN estão fora da v1 por decisão
explícita. As ideias estão registradas na seção 8.

---

## 2. Domínio DMX — o que o código precisa saber

### Universo e endereço

- Um universo DMX tem **512 canais**, numerados de 1 a 512 (base 1)
- Cada equipamento ocupa um bloco contíguo de canais chamado **footprint**
- O footprint depende do **modo** do aparelho (um Beam pode ter modo 16CH e modo
  20CH — é o mesmo aparelho com footprints diferentes)
- Endereço inicial + footprint − 1 = último canal ocupado

### Conversões

```
absoluto  = (universo − 1) × 512 + endereço
universo  = ceil(absoluto / 512)
endereço  = ((absoluto − 1) mod 512) + 1
```

### A regra que quase todo app erra

**Um equipamento não pode atravessar a fronteira do universo.** Se sobram 8
canais e o aparelho usa 16, ele não "quebra ao meio" — ele vai inteiro para o
próximo universo. Sempre calcule `endereço + footprint − 1 ≤ 512`, nunca só
`endereço ≤ 512`.

### Dip switch

Aparelhos mais simples (par LED, strobe, máquina) são endereçados em chaves
físicas. Chaves 1 a 9 valem 1, 2, 4, 8, 16, 32, 64, 128, 256.

**Existem duas convenções de fabricante:**

- `endereço = soma binária` — a maioria
- `endereço = soma binária + 1` — alguns fabricantes

O app **não pode chutar**. Hoje é um toggle global no cabeçalho. O certo, no
futuro, é ser propriedade do modelo na biblioteca. Errar isso destrói a
confiança do usuário no primeiro uso.

A chave 10, quando existe, quase nunca é endereço — costuma ser modo de operação
(som, master/slave, DMX). Não usar no cálculo.

### Limites físicos da linha (para o futuro, seção 8)

- Máximo **32 dispositivos** por linha DMX sem splitter
- Cabo até ~300 m em condições boas
- Terminação de **120 Ω** no último aparelho da linha

### Estratégias de empacotamento

Três formas que técnicos usam de verdade:

1. **Compacto** — encosta um no outro. Máximo aproveitamento, difícil de decorar
2. **Blocado** — arredonda para múltiplos de 10 ou 20. `1, 21, 41, 61` alguém
   decora; `1, 17, 33, 44` ninguém decora. **É o que a maioria faz em montagem**
3. **Por grupo com reserva** — cada família (beam, wash, par) começa numa faixa
   própria com espaço para crescer

Hoje o app faz o compacto por padrão (sugere o próximo livre) mas deixa o usuário
digitar o início que quiser, o que cobre o blocado manualmente. O modo blocado
automático está no backlog.

---

## 3. Modelo de dados

```ts
type Show = {
  universos: Universo[];
  somaMaisUm: boolean;   // convenção de dip switch
  meus: ItemBiblioteca[]; // equipamentos que o usuário cadastrou
};

type Universo = {
  id: string;
  grupos: Grupo[];
};

type Grupo = {
  id: string;
  nome: string;    // "Beam 230 7R"
  canais: number;  // footprint do modo
  qtd: number;     // quantos aparelhos iguais
  inicio: number;  // endereço do primeiro
  feitos: number[]; // índices já endereçados em campo
};

type ItemBiblioteca = { nome: string; canais: number };
```

**Grupo é a unidade central.** Não guardamos um registro por aparelho — um grupo
de 12 Beams é uma linha só, e os endereços são derivados:

```
endereço do aparelho i = inicio + i × canais
```

Isso mantém o app leve e faz o recálculo ser trivial quando o usuário muda o
modo ou a quantidade. `feitos` é o único estado por aparelho, e é o que responde
"onde eu parei".

---

## 4. Regras de cálculo implementadas

| Regra | Fórmula |
| --- | --- |
| Endereços do grupo | `inicio + i × canais`, para i de 0 a qtd−1 |
| Fim do grupo | `inicio + qtd × canais − 1` |
| Próximo livre | `max(fim de todos os grupos) + 1`, ou 1 se vazio |
| Colisão | dois grupos se sobrepõem se `a1 ≤ fim(b) && b.inicio ≤ a2` |
| Estouro | primeiro i onde `endereço + canais − 1 > 512` |
| Quantos cabem | o índice do primeiro estouro |
| Dip | bit i de `(somaMaisUm ? endereço − 1 : endereço)`, i de 0 a 8 |

---

## 5. Decisões de UX que não devem ser desfeitas

Estas vieram de conversa com o usuário e de erro real de campo. Não "melhore"
sem perguntar.

**A lista é a tela principal.** Colapsada mostra só o equipamento: nome,
quantidade, canais, faixa ocupada, contador `8/12`. Aberta mostra os endereços.

**A seta marca, não só avança.** A primeira versão pensada era um cursor que
anda. Foi trocada porque em campo você **endereça fora de ordem** — pendura o que
está mais perto primeiro. Então cada endereço é um item marcável individualmente,
e o botão grande só marca o próximo não-marcado como atalho.

**O offset do segundo equipamento é sugerido.** O usuário nunca deve precisar
calcular 12 × 16 + 1 de cabeça. O campo "Começa em" já vem preenchido com o
próximo livre e ele só confirma ou altera.

**Destruir exige dois toques.** Apagar universo e excluir equipamento pedem
confirmação no próprio botão, que fica vermelho. Sem modal — modal em campo com
uma mão é ruim.

**Estouro aponta o culpado.** Não basta dizer "passou de 512". Diz qual aparelho,
qual endereço, quantos cabem e quantos sobram. Na lista aberta entra uma faixa
vermelha atravessada exatamente na linha onde estoura.

**Salva sozinho, sempre.** Nenhum botão de salvar. O estado inteiro persiste a
cada mudança.

---

## 6. Estado atual do código

Arquivo único React (`patch-dmx.jsx`), Tailwind, sem dependências externas.
Tema escuro, acento âmbar, numerais tabulares.

Implementado:

- Universos em abas, criar e apagar
- Régua visual de 512 canais no cabeçalho, contador de canais usados e livres
- Adicionar equipamento manual ou por biblioteca
- Biblioteca de fábrica (11 itens de rental brasileiro) + biblioteca do usuário,
  com adicionar e remover
- Lista colapsada com contador de progresso
- Painel de endereços com dip switch desenhado por aparelho
- Marcar individual, avançar, desfazer
- Detecção de colisão entre grupos
- Detecção de estouro com destaque do ponto exato
- Toggle de convenção de dip switch
- Persistência automática

Persistência hoje usa a API de storage do ambiente de artifact. **Ao migrar para
projeto próprio, trocar por IndexedDB** — não usar `localStorage`, o volume vai
crescer e o usuário perde tudo ao limpar o navegador.

---

## 7. Backlog, em ordem de valor

1. **Etiqueta por aparelho** — "Beam 1, Beam 2..." editável, para bater com a
   numeração da vara. Hoje só existe o índice
2. **Mandar o excedente para o próximo universo** — quando estoura, um botão que
   quebra o grupo em dois. O usuário quer decidir se isso é automático ou manual
3. **Exportar PDF** da folha de patch, ordenável por endereço, por aparelho ou
   por posição. Reaproveitar `pdf-lib` do LED Lab Core
4. **Modo blocado** — arredondar automaticamente para múltiplos de 10 ou 20
5. **Modo por grupo com reserva** — cada família numa faixa própria
6. **Duplicar universo** — rig repetido em palcos iguais
7. **Exportar e importar o show em JSON** para mandar no WhatsApp
8. **Modo campo dedicado** — um aparelho por tela, fonte enorme, avançar por
   toque em qualquer lugar
9. **Modos por equipamento na biblioteca** — hoje `nome + canais`; o certo é
   `nome + [modos]`, porque o mesmo aparelho tem 8CH e 16CH
10. **Convenção de dip por modelo**, saindo do toggle global

---

## 8. Guardado para depois — Art-Net e rede

Fora do escopo da v1 por decisão do usuário. Registrado para não se perder:

- Mostrar **universo Art-Net (base 0)** e **sACN (base 1)** lado a lado. Esta é a
  armadilha clássica: sACN começa em 1, Art-Net começa em 0, e cada fabricante
  mapeia o "universo 1" para Art-Net 0 ou 1 do seu jeito. Quando o primeiro
  universo está apagado ou tudo deslocado 512 canais, é sempre isso
- Art-Net usa esquema **Net / Sub-Net / Universe**; sACN usa número sequencial de
  1 a 63.999
- Base do console configurável (alguns começam a contar universo em 0)
- Cadeia física: nodes, portas, splitters, terminação, limite de 32 dispositivos
- Soma de potência por circuito

---

## 9. Bibliotecas de fixtures — o que já se sabe

Duas fontes abertas reais, para quando a biblioteca embutida ficar pequena:

**Open Fixture Library** (`open-fixture-library.org`) — código e dados sob
licença MIT, formato JSON próprio, API REST pública. O footprint sai do tamanho
do array `channels` de cada modo. É o caminho mais fácil.

**GDTF Share** (`gdtf-share.com`) — o padrão da indústria. API REST que exige
login; a listagem já retorna, por fixture, um array de modos com nome e DMX
footprint. O arquivo `.gdtf` é um ZIP com `description.xml`. Suporta DMX breaks
(um aparelho com mais de um endereço). Melhor consumido por um job de servidor
que gera um dump, não por chamada direta do browser.

**Estratégia recomendada:** não integrar API em runtime. Gerar um **seed offline
enxuto** (`fabricante / modelo / modos / footprint / watts`) a partir do OFL,
embarcar no app, e manter o cadastro manual — metade do rig de rental nacional é
genérico chinês que não está em biblioteca nenhuma. O cadastro do usuário é
funcionalidade permanente, não paliativo.

---

## 10. Formatos de troca — o que já se sabe

Para quando entrar exportação para mesa:

- **grandMA3** não exporta patch em CSV nativamente de forma decente; a
  comunidade resolve com plugins Lua. O `PatchImporter` do ma3.tools importa
  patch de CSV ou MVR, criando ou atualizando fixtures. Se for construir um
  export, mirar no CSV que ele aceita
- **MVR (My Virtual Rig)** é o formato que atravessa MA3, Chamsys, Vectorworks e
  Capture. Carrega tipo de fixture, endereço, universo e posição 3D. É o alvo
  certo a médio prazo, mas é ZIP + XML — trabalho real
- Antes de qualquer um dos dois, **PDF de folha de patch** entrega mais valor por
  menos esforço, porque o público é montagem, não programação de mesa

---

## 11. Armadilhas conhecidas

- Não testar só `endereço ≤ 512`; testar `endereço + footprint − 1 ≤ 512`
- Não assumir uma convenção única de dip switch
- Não guardar um registro por aparelho — o grupo é a unidade
- Não usar `localStorage` fora do ambiente de artifact
- Não pedir confirmação em modal para ações destrutivas em campo
- Não tirar o "onde parei" do estado persistido; é a razão de existir do app
