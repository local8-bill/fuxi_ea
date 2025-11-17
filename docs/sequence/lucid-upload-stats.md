# Lucid Upload → Digital Enterprise Stats Flow

This describes the Lucid CSV upload path and how stats are surfaced on the Digital Enterprise workspace. Use this as a reference when drawing sequence diagrams in Lucid Chart.

## Actors / lanes
- **Modernization Upload UI** (`src/app/project/[id]/modernization/page.tsx` + ModernizationImportPanel) — triggers file picks.
- **useModernizationArtifacts** (`src/controllers/useModernizationArtifacts.ts`) — chooses the upload endpoint and updates state.
- **Lucid API route** (`src/app/api/mre/artifacts/lucid/route.ts`) — parses the CSV and stores the view.
- **parseLucidCsv** (`src/domain/services/lucidIngestion.ts`) — converts CSV rows into nodes/edges.
- **digitalEnterpriseStore** (`src/domain/services/digitalEnterpriseStore.ts`) — in-memory store keyed by project.
- **Digital Enterprise stats API** (`src/app/api/digital-enterprise/stats/route.ts`) — reads the store for stats.
- **Digital Enterprise page** (`src/app/project/[id]/digital-enterprise/page.tsx`) — fetches stats and renders the tiles.

## Sequence
1. UI calls `uploadLucid(file, projectId)` when the user hits “Upload Artifact” and selects a Lucid CSV.
2. Controller sends a POST to `/api/mre/artifacts/lucid` with the file, projectId, and `view` metadata.
3. The Lucid API route loads the buffer, passes it to `parseLucidCsv`, and awaits its parsed `DigitalEnterpriseItem[]`.
4. The parser returns discrete `system` and `integration` items, including all the label/edge metadata the store needs.
5. The route returns the artifact + parsed `lucidItems` and the controller writes them into `digitalEnterpriseStore` via `saveLucidItemsForProject`.
6. When the Digital Enterprise page mounts, it fetches `/api/digital-enterprise/stats?project=<id>`.
7. The stats route calls `getStatsForProject(projectId)` on the store and returns `{ systemsFuture, integrationsFuture, domainsDetected }`.
8. Stats API returns the counts to the page.
9. The page updates its cards with the returned numbers and continues to render domain listings/selection UI from the cached nodes/edges provided by `useModernizationArtifacts`.

Use this text per step to annotate Lucid chart arrows, and export each diagram as SVG after importing the CSV or manually drawing the lanes.
