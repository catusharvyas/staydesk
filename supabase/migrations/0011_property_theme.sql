-- Per-property accent colour (brand), decided with the user: the theme is a
-- property-level brand choice like the logo, NOT a per-user preference like
-- dark mode. Dark/light stays in localStorage per device; this is the hue,
-- shared by everyone working that property.
--
-- Stored as a short key, not a colour value. The actual oklch values live in
-- globals.css (one block per key) and src/lib/theme-presets.ts — so the
-- database never holds anything that gets interpolated into CSS, and the set
-- of themes can be re-tuned without a data migration.
--
-- The CHECK constraint is what makes that safe: it guarantees the column can
-- only ever contain a key that has a matching CSS block.
--
-- Why only these eight: --primary-foreground is near-white in both modes, so
-- every accent must stay dark enough for white button text to clear WCAG AA
-- (4.5:1). Holding lightness there, sRGB simply cannot produce a vivid teal,
-- cyan or yellow — they go muddy or khaki. Green/amber/red are attainable but
-- deliberately excluded: they already carry meaning on the room board
-- (available / reserved / maintenance, and red is also --destructive).

alter table properties
  add column theme text not null default 'blue'
  check (theme in ('blue','sky','indigo','violet','purple','magenta','rose','neutral'));

comment on column properties.theme is
  'Accent colour preset key. Must match a [data-theme="..."] block in globals.css and an entry in src/lib/theme-presets.ts.';
