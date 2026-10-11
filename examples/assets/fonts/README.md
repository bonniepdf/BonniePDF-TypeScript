# Bundled example fonts

These Google **Noto** fonts are bundled **only for the examples** — they let the
typography examples (`custom-fonts`, `emojis-and-unicode`) embed real TrueType
fonts with broad Unicode coverage and generate deterministically in Node (the
CI PDF/UA gate) without depending on machine-installed fonts.

| File                           | Used for                                                |
| ------------------------------ | ------------------------------------------------------- |
| `NotoSans-Regular.ttf`         | Latin, Greek, currency, Latin-1 symbols                 |
| `NotoSansMath-Regular.ttf`     | Arrows (U+2190..) and mathematical operators (U+2200..) |
| `NotoSansSymbols2-Regular.ttf` | Dingbats and miscellaneous symbols (U+2600..U+27FF)     |
| `NotoEmoji-Regular.ttf`        | Supplementary-plane emoji (monochrome outlines)         |

**Not shipped to library consumers.** These files live in the `@bonniepdf/examples`
package, which is `"private": true` and is **never published to npm**. The
published `@bonniepdf/core` package does not contain them — adopter bundle size is
unaffected. In the browser the website serves the same fonts from its own
`public/fonts/`; in Node the gate (`scripts/generate-tagged-pdfs.ts`) maps the
`/fonts/` asset URLs to this directory.

## Licence

The Noto fonts are © The Noto Project Authors and licensed under the
**SIL Open Font License, Version 1.1** (see [`OFL.txt`](OFL.txt)), which permits
bundling and embedding. Source: https://github.com/notofonts

`TwemojiMozilla.ttf` supplies COLRv0 vector colour artwork for the separate Colour Emojis example. The original Noto Emoji outline example is unchanged. Twemoji graphics are licensed under CC-BY-4.0; font-building software is Apache-2.0. The bundled `TwemojiMozilla-LICENSE.md`, `TwemojiMozilla-CC-BY-4.0.txt` and `TwemojiMozilla-APACHE-2.0.txt` carry upstream notices. Source: https://github.com/mozilla/twemoji-colr
