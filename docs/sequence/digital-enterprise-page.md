# Digital Enterprise Page Render & Interaction Flow

This file outlines the client-side rendering and interactions inside `/project/[id]/digital-enterprise`. Each numbered step translates directly into a lane/message in a Lucid UML diagram.

## Actors
- **Digital Enterprise page (client)** — `src/app/project/[id]/digital-enterprise/page.tsx`
- **useModernizationArtifacts controller** — exposes `digitalEnterprise.future`, nodes, and edges.
- **Digital Enterprise stats API** — `/api/digital-enterprise/stats` (GET).
- **digitalEnterpriseStore** — persists Lucid views keyed by project.
- **UI cards & system list** — the DOM elements that show stats and allow selection.

## Steps
1. The page mounts and subscribes to `useModernizationArtifacts`, so it always has the latest nodes/edges produced by past uploads.
2. A `useEffect` fetches `/api/digital-enterprise/stats?project=<id>` and waits for the JSON response.
3. The stats endpoint now calls `getStatsForProject(projectId)` on `digitalEnterpriseStore`, which reads the `DigitalEnterpriseItem`s saved by the Lucid upload route.
4. Stats returns `{ systemsFuture, integrationsFuture, domainsDetected }` derived from system/integration counts so far.
5. The page stores those counts and renders the three stat tiles accordingly.
6. Nodes are grouped by domain (using `node.domainHint || "Unassigned"`) and shown as cards with mini lists (first 20 systems + "+ N more…" when needed).
7. When a row is clicked, the page highlights it and surfaces upstream/downstream counts computed from the cached `edges` array.
8. The detail card on the right (or below on mobile) shows `Name`, `Kind`, and the upstream/downstream totals.

Copy these lane/step descriptions into Lucid and export the finished diagram as SVG for onboarding or documentation purposes.
