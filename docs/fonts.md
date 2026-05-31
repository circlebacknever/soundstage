# Fonts

SoundStage self-hosts its three typefaces so typography is consistent and works offline with no
external font requests. `src/app.css` declares an `@font-face` per family pointing at the variable
`.woff2` files in `static/fonts/`; `font-display: swap` keeps text visible on the system fallback
chain until the woff2 loads.

| `@font-face` family | File (`static/fonts/`)          | Source (SIL OFL 1.1)               |
| ------------------- | ------------------------------- | ---------------------------------- |
| `Fraunces`          | `fraunces-variable.woff2`       | github.com/undercasetype/Fraunces  |
| `Nunito`            | `nunito-variable.woff2`         | github.com/googlefonts/nunito      |
| `JetBrains Mono`    | `jetbrains-mono-variable.woff2` | github.com/JetBrains/JetBrainsMono |

## Licensing — why the OFL text isn't served

All three are under the SIL Open Font License 1.1. Each `.woff2` already embeds the copyright notice
and the license in its `name` table (nameID 0 = copyright, 13 = license, 14 = license URL). OFL 1.1
explicitly allows the notice and license to travel "in the appropriate machine-readable metadata
fields within … binary files," so each served font is self-describing and compliant on its own —
the license text does **not** need to be served as a separate file.

The full standalone OFL texts are kept in `docs/font-licenses/` for reference. They live outside
`static/` on purpose so they are not part of the served/built app.

## Regenerating the woff2

Only the upright variable font of each family is shipped — the UI uses Fraunces ~600, Nunito
400/700/800, and JetBrains Mono 400/700, all covered by each font's weight axis (no italics, and the
per-weight static files Google ships are unused). To rebuild from a Google Fonts download:

```sh
uvx --from "fonttools[woff]" fonttools ttLib.woff2 compress \
  -o static/fonts/fraunces-variable.woff2 \
  "Fraunces-VariableFont_SOFT,WONK,opsz,wght.ttf"
```
