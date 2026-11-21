<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.

<!-- LOVABLE:END -->

- Keep the Lovable TanStack preview route at `/`; use hash navigation inside the browser-only dashboard because the local Windows service has no path fallback.
- Keep local-service reads, polling, SSE parsing and mock fallback in browser-safe modules; no hosted backend is needed for an existing same-origin PC service.
- Maintain a separate Vite static entry/configuration for Windows `wwwroot` delivery without changing the managed TanStack build.
- Keep exact API-path sample payloads in bundled JSON; preserve raw service shapes and derive display units only in the UI.
- Share browser-safe SVG tachometers across performance screens; animate presentation only, never synthesize sensor readings.
- Bundle the generated hardware illustration as compressed WebP for offline Windows delivery; retain its asset pointer for provenance without runtime CDN requests.
- Keep application chrome and RGB presentation controls in Dashboard; lighting changes CSS only, never sensor data or hardware settings.
- Resolve GPU/APU/CPU presentation in the shared browser-safe hardware module; processor traces use utilization, GPU fans use individual reported RPM and liquid flow uses pump RPM, never utilization.
- Keep schematic motherboard inspection data separate from drawing; unknown physical slots, cooling and connections must remain explicitly unknown until supplied by the local service.
- Read cooling solely from /api/cooling every five seconds while relevant views are visible; PC-wide cooling detection must never be assigned to the GPU cooling topology.
- Read memory from /api/memory while Health/System is visible and after health reports change; share reported modules with the slot map and inspector, never infer unnamed slot labels, physical order, activity, or XMP speeds.
- Use shared hover/focus/tap detail reveals for hardware inspection so dense component facts stay off the resting System view.
- Delegate accounts, consent and feedback to the same-origin PC service; /auth/sign-in is a full document navigation, not a TanStack route or hosted authentication flow.
- Keep feedback completion metadata client-side and strip it from chat request messages; offer answer votes only after a successful completed stream.
