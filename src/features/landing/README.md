# Landing page assets

The landing page uses just **3 photographs**. All safely sourced from
Wikimedia Commons (CC BY-SA). Attribution is baked into the landing
page footer.

If a file is missing, the landing page gracefully falls back to a warm
bronze gradient with a Landmark icon — the layout will not break.

## Files expected

Drop these into `public/monuments/`:

| Filename                       | Wikimedia search                                     |
|--------------------------------|------------------------------------------------------|
| `taj-mahal-hero.jpg`           | "Taj Mahal at dawn" or "Taj Mahal reflecting pool"   |
| `built-heritage-example.jpg`   | "Kailasa Temple Ellora" or "Konark Sun Temple"       |
| `antiquity-example.jpg`        | "Chola bronze Nataraja" or "Chola bronze sculpture"  |

## Sizing recommendations

- **`taj-mahal-hero.jpg`** — landscape, 2400×1350 or wider. Optimise to
  under 400KB. This is the hero; use the best photo you can find.
- **The two register photos** — 1600×900 (16:9 aspect). Optimise to
  under 250KB each.

## Swapping to ASI's own photography

Once ASI's photo library is accessible, replace the three files in
`public/monuments/`. The paths in `src/features/landing/monumentAssets.js`
stay the same — no code changes needed.

