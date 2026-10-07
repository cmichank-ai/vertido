# Vertido

Sort puzzle hybrid-casual. Web vanilla (sin framework) + Capacitor para iOS y Android.

- `npm test` — reglas, solver, generador (niveles 1–500 solubles), config.
- `npm run serve` y abre `http://localhost:5173/public/` — juego en navegador (sin anuncios; rewarded concede recompensa directa para QA).
- `worker/` — Cloudflare Worker de remote config (KV `CONFIG`, claves `base`, `country:MX`, `experiments`).
- `supabase/migrations/` — esquema `vertido` con RLS.
- Plan completo: documento "Vertido — Plan de construcción y plan de negocio".

## Estructura
```
src/core      rules, solver, generator, worker (puros, sin DOM)
src/game      engine (puente al worker), main (UI)
src/platform  config, storage, analytics, ads, iap, haptics
public/       index.html, styles.css
```
