

# Fundo Off-White Quente

## O que muda

Trocar o fundo cinza azulado atual (`hsl(210, 20%, 98%)`) por um branco quente estilo Notion/Figma, atualizando tambem as superficies relacionadas para manter coerencia visual.

## Cores novas

| Token | Antes | Depois | Efeito |
|-------|-------|--------|--------|
| `--background` | `210 20% 98%` (cinza azulado) | `40 20% 99%` (branco quente) | Fundo principal acolhedor |
| `--muted` | `210 16% 95%` | `40 12% 96%` | Areas secundarias harmonizadas |
| `--surface-sunken` | `210 20% 96%` | `40 14% 97%` | Superficies recuadas com mesmo tom |
| `--card` | `0 0% 100%` | Mantido `0 0% 100%` | Cards continuam brancos puros |
| `--border` | `214 18% 90%` | `30 10% 91%` | Bordas com tom neutro-quente |
| `--input` | `214 18% 90%` | `30 10% 91%` | Inputs consistentes |

O dark mode permanece inalterado.

## Detalhes tecnicos

Arquivo unico a editar: **`src/index.css`** — apenas as variaveis dentro de `:root` (modo claro). Sao 5 linhas de CSS alteradas.

