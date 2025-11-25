# Fuxi_EA UI Wireframes (textual)

These wireframes capture the desired flow and presentation without new dependencies (reuse existing components and Recharts only).

## Home / Start
- Top nav: Logo | Project dropdown | Intake | Tech Stack | Digital Enterprise | Portfolio | Status pill.
- Hero card: Project name field; Primary CTA “Open workspace”; Secondary “Explore sample”; subtext “Normalize capabilities, tech, and ecosystem.”
- Outcomes strip (3 items): Clarity (capability map), Efficiency (tech overlaps), Confidence (risk visibility).

## Intake
- Header: “Project Intake” + subtext “Sets the lens for scoring and DE insights.”
- Progress strip: Intake • Tech Stack • Digital Enterprise • Portfolio.
- Right rail summary: Industry, Drivers, Attitude, Capacity.
- Form (linear): Industry cards; Drivers (pick up to 3); Attitude; Change Capacity; Sacred Systems (textarea); Opportunity Zones (cards); Notes (textarea).
- Footer CTA: “Save & continue to Tech Stack”; inline errors near fields.

## Tech Stack
- Header: “Tech Stack Workspace” + subtext “Normalize your apps to spot redundancy before DE analysis.”
- Progress strip.
- Two-column: Left Uploads (Artifacts count; Upload inventory CSV/XLSX 5MB; Upload diagram current/future); Right Normalized Apps table (search box; Name | Vendor | Source | Disposition).
- Footer CTA: “Go to Digital Enterprise.”

## Digital Enterprise
- Header: “Digital Enterprise View” + subtext “Lucid-derived systems and integrations.”
- Progress strip.
- Metric row: Systems | Integrations | Domains (placeholder).
- Chart: Recharts bar/column, top systems by integrations (minimal gridlines).
- Table: Rank | System | Integrations | [View impact].
- Impact panel: Selected system with upstream/downstream counts and lists.
- Upload panel: “Upload Lucid CSV” (5MB) + status text.
- Footer CTA: “Run Portfolio View.”

## Portfolio
- Header: “Portfolio Snapshot” + subtext “Lane overlaps and simplification opportunities.”
- Summary banner: total systems | lanes | overlap lanes | opportunities.
- Lane cards grid: lane label, system count, overlap indicator, small system list; CTA “View overlaps.”
- Opportunities list: single-line summaries.
- Footer CTAs: “Export summary” (optional placeholder) and “Back to Digital Enterprise.”

## Visual & Interaction Notes
- White background, slate/graphite text; single accent for primary buttons.
- Cards: light border, subtle hover shadow; clear title + one-line description + action.
- Buttons: primary + ghost secondary; rounded medium; consistent sizing.
- Inputs: simple border, clear focus ring; inline help (“CSV/XLSX, max 5MB”).
- Errors: inline, concise, near the control.
- Next-step CTA on every page; slim progress strip under nav.
