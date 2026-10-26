# SCiPnet rules

These are rules the project owner has given over time. Follow them for every change. Add each new rule here when it comes up.

## Language and naming

- The interface is German.
- Some names stay English as on the SCP Wiki:
  - **Mobile Task Force:** "Mobile Task Force", "Mobile Task Forces" and "MTF". Never write "Einsatzkraft" or "Einsatzkräfte" for them.
  - **Unit nicknames:** "Nine-Tailed Fox", "See No Evil" and so on.
  - **Class names:**
    - Containment: Safe, Euclid, Keter, Esoteric.
    - Secondary: Thaumiel.
    - Disruption: Dark, Vlam, Keneq, Ekhi, Amida.
    - Risk: Notice, Caution, Warning, Danger, Critical.
  - **Group of Interest names.**
- Labels around those names are German, for example "Eindämmungsklasse:" or "Zugewiesene Mobile Task Force:".
- Wiki content (icons, insignias, mission texts) is CC BY-SA 3.0. Keep a `LICENSE.txt` next to the image folders (`images/archive/acs/`, `images/archive/mtf/`).
- The word "Admonition" never appears anywhere. The warning banner on SCP files is called "Warnhinweis".

## Shapes and layout

- **Corners:** cards, banners, chips and panels are rounded with `var(--radius)`, or `999px` for pills. Do not use square cards or cut corners made with `clip-path`.
- **No tilted shapes:**
  - No skewed or rotated decoration: stamps, badges, tags and bars stay at 0°.
  - Rotation is only for real motion: a spinning ring, a gauge.
  - Rotation is also allowed for geometry that needs it, such as a diamond or arrows in the ACS emblem.
- **Icons:** draw them as SVG or use a mask. Do not use Unicode glyphs (⚠, ✓ and so on) as icons.
- **Room to breathe:** icons and text never touch borders or rings. This covers icons inside the octagon, the gauge label and the two icons in the class pill.
- **Equal sizes:** icons that sit side by side are the same size, like the three icons on the archive hub.
- **Lists match:** the overviews (SCP list, field reports, personnel, Mobile Task Forces, Groups of Interest) share one card language:
  - a coloured top edge
  - a soft colour wash on a solid `--card-bg`
  - a dashed line above the card footer
- **Side rails:**
  - Every tab has side rails on wide screens.
  - The right rail shows context for the current section. When a new section appears, give it its own rail content.

## Colour and themes

- **Both modes:** every element works in dark and in light mode. Never hard-code a black background. Each theme defines its own palette.
- **Solid banners:** banners and classification panels have solid backgrounds, not see-through ones. `--surface` is a gradient in light mode, so colour mixes use `--card-bg` or `--acs-bg` as their base.
- **One colour per state:** a status and everything that belongs to it use the same colour. This includes text, border, dot and the dot's pulse ring.
  - Einsatzbereit: green.
  - Im Einsatz: orange.
  - Bereitschaft: blue.
  - Klassifiziert: red.
- **Accent colour:** logos in the accent colour use the real asset. The SCP Foundation logo is `images/scipnet_terminal/scp_logo.svg`, not the SCiPnet emblem.

## Groups of Interest

- **Own vibe:** each group has its own palette, typeface, mark and texture.
  - Valravn: steel, ice blue and a condensed military typeface.
  - Marshall, Carter and Dark: black lacquer, gold and a serif typeface.
- **Shared frame for every group:**
  - `var(--radius)` corners.
  - The same layout order.
    - Overview card: banner, then body, then footer.
    - File page (`.gf`): cover (logo, name, tagline, status pill, threat meter), then a figures strip, then numbered sections in the main column with side cards (Steckbrief, Weisung der Foundation, Begegnungen) on the right.
  - Readable text: body text on GoI pages and overview cards at least 16px.
  - The 3-bar threat meter.
  - A "Weisung der Foundation" box.
  - The same padding.
- **Light palette:** every group defines one under `.crt[data-mode='light']`.
- **No tilted elements:** the shape rules above apply to groups too, so no tilted stamps and no slanted cut corners.

## Motion

- **Entrances:** animate on `translate` (`.rise`, `--i` for stagger). Hover then uses `transform`, so the two never fight or jump.
- **Filterable lists:** use `FILTER_CARD` from `src/scipnet/filterAnim.ts`.
- **Fills and gauges:** fill up visibly from empty. Animate `stroke-dashoffset`, not a jump.
- **Clipping entrances:** an entrance animation that clips must end with a clip larger than the box, `inset(-4px)`. Otherwise borders get cut at fractional pixels.
- **Reduced motion:** honour `prefers-reduced-motion`.

## Sound

- **Cut sounds:** a sound that has to end early fades out. Use the `TRIM` table in `src/lib/sound.ts`; never cut a sound off hard.
- **Success:** a success uses `ui_success`, plus the success animation (`SuccessMark`).

## Specific components

- **Brain scan:**
  - Region fills and their highlights stay under the 2D line art.
  - Nothing is drawn on top that would light up the line art itself.
  - The regions are cut out roughly.
- **Cursor:** change the cursor itself, not the hover frame.
- **Redactions (`Redacted`):** never break a sentence apart.
- **S.C.I.P.A.:**
  - Explanations of site concepts (classes, clearance and so on) come from her script in `src/data/assistant.ts`, not from the model.
  - Answers can show ACS icons as chips (`icons`).
  - A side rail question asked while her tab is open continues the chat; the tab never reloads. Her greeting and its voice stay.
- **Field report cards:** no round icon badge next to the report ID; it looks cartoonish.

## Working

- **Commits:** commit after each change.
- **Checking:** check visually with Playwright (dev server on port 5199) in dark and in light mode before reporting.
