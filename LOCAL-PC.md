# AIAnalyze on your Windows PC

The Lovable preview uses the same dashboard as the local app, with fixture fallback. It is not a connection to your PC.

## Static Windows-service delivery

Run `bun run build:local` to produce `dist-local/index.html` and bundled assets. Copy the **contents** of `dist-local` to the service's `wwwroot`. Open `http://127.0.0.1:5280/`. This entry is plain React and static assets, with no Node server, remote fonts, analytics or external image requests.

All app navigation uses hash URLs, and all service requests use relative `/api/...` paths. The static build uses `base: '/'`, as required by the Windows service (not Electron). `?mock=1` explicitly uses the bundled `src/features/aianalyze/ui-fixtures.json`; the first failed status request also switches to fixtures. Sample mode is visibly labeled. Later service failures show a service-unavailable state.

## Existing local endpoints

No service or Anthropic credentials are created here. The existing Windows service supplies health runs, measurements, alerts and chat. API payloads follow the uploaded fixtures. Session detail fixtures are provided only for session 14; other sample detail links honestly report missing data. Chat sends JSON to `/api/chat` and reads server-sent events. API keys are never handled by the UI.

The local build is configured but the production artifact size and behavior with a real Windows service must be checked during packaging. Offline assets are bundled directly; a service worker or PWA is unnecessary for a locally served PC app.

## Cooling service

`GET /api/cooling` is polled every 5 seconds while Health, Live or System is visible. HTTP 503 means waiting for the first reading, not a failed PC service. The exact desktop and laptop examples are bundled in `cooling-fixtures.json`.

GPU fans are matched by adapter name; each rotates only when its own RPM is positive and zero-RPM mode is off. Percent controls illustrative animation speed, not a physical rotation simulation. Null readings remain unknown. PC-wide `coolingType` is labelled as detected with `coolingTypeReason`; Liquid does not prove the GPU itself has a liquid block. Pumps and CPU/case fans are shown separately. Cooling errors clear animated readings until a successful response. The motherboard remains schematic.

## Memory service

`GET /api/memory` is read on Health/System entry, every 30 seconds while visible, and when the health report timestamp changes. HTTP 503 means waiting for the first health check. The exact supplied desktop sample is bundled in `memory-fixtures.json`. Installed sticks retain service slot, bank and channel labels; remaining slots are unnamed and empty. The schematic groups installed sticks in reported order, not an inferred motherboard layout. Configured MT/s is the main speed; a higher reported speed is secondary. Null values stay unknown, with no inferred XMP speed or RAM activity. The service's check is shown under the slot map; Health uses its existing check if supplied, otherwise includes the memory endpoint's check once. Ask about this uses the existing local assistant.
