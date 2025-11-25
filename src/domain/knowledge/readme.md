# Knowledge Domain (Directive 0002a)

Purpose: provide a structured home for reusable analytical logic, schemas, and reference data. This layer stays decoupled from UI and API concerns and will be populated by future reasoning engines (e.g., AI Opportunity Engine in Directive 0003).

Structure
- `schema.ts`: Core types (primitives, friction zones, impact/effort scores, opportunities, metrics).
- `ai_primitives/`: Definitions of AI use case primitives.
- `impact_effort/`: Helpers to classify impact/effort quadrants.
- `industry_cases/`: Reference examples by industry.
- `metrics/`: Calculators (e.g., AI Opportunity Index).
- `index.ts`: Central exports.

Conventions
- Keep logic pure and side-effect free; no UI or network calls.
- Use typed inputs/outputs; avoid new dependencies.
- Extend with additional modules as the reasoning layer matures (e.g., scoring models, domain adapters).

Usage
- Import from `@/domain/knowledge` for typed primitives, scoring helpers, and reference data.
- Wire higher-level controllers (e.g., insights engine) to consume these helpers without coupling UI concerns.
