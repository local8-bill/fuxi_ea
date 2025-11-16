#!/usr/bin/env bash
set -euo pipefail

# Change this if the repo name ever changes
REPO="local8-bill/fuxi_ea"

echo "Creating issues in $REPO ..."
echo

gh issue create -R "$REPO" \
  -t "Unified ingestion pipeline (Artifact → RawTable → Interpreter)" \
  -b $'Create a shared ingestion core that converts any spreadsheet (Excel/CSV/JSON) or parsed PDF into a neutral RawTable model. All feature-specific importers (Capabilities Modeler, Tech Stack Modeler, etc.) should interpret this shared format rather than rolling their own parsers.' \
  -l enhancement -l ingestion -l architecture

gh issue create -R "$REPO" \
  -t "Column mapping wizard for client spreadsheets" \
  -b $'Add a small wizard to map client-specific columns (Application/App Name/System, Tower/Domain/LOB, Disposition, etc.) to Fuxi’s canonical schema. Include heuristics + AI suggestions + ability to save mapping profiles per client/template.' \
  -l enhancement -l ingestion -l ui-ux

gh issue create -R "$REPO" \
  -t "App ↔ capability mapping (Cognition Stage 2+)" \
  -b $'Improve app-to-capability mapping: confidence scores, AI explanations, highlighting ambiguous mappings, and user override workflow that feeds back into the reasoning model.' \
  -l feature -l capabilities -l ai

gh issue create -R "$REPO" \
  -t "Dependency inference v2 (data/process/integration)" \
  -b $'Enhance dependency extraction from architecture diagrams and inventories. Distinguish data flows vs process flows vs integration hops, and compute structural criticality of systems in those chains.' \
  -l enhancement -l dependencies -l ai

gh issue create -R "$REPO" \
  -t "Roadmap Engine v2 (scenario + impact analysis)" \
  -b $'Extend the modernization roadmap engine to support multiple scenarios (OMS-first, Commerce-first, Data-first), per-stage risk/complexity/value scoring, and change-impact analysis when reordering stages.' \
  -l feature -l roadmap -l modernization-engine

gh issue create -R "$REPO" \
  -t "Engagement persistence layer (multi-project storage)" \
  -b $'Add a persistence layer (JSON/DB) that stores projects, artifacts, capability models, normalized inventories, dependency graphs, and roadmap scenarios so users can return to and iterate on an engagement.' \
  -l architecture -l enhancement

gh issue create -R "$REPO" \
  -t "Visualization layer (system map, dependencies, roadmap timeline)" \
  -b $'Introduce visual components for: system cluster maps, domain overlays, dependency graphs, and a simple roadmap timeline (Gantt-lite) to improve communication with stakeholders.' \
  -l feature -l ui-ux -l roadmap

gh issue create -R "$REPO" \
  -t "Business ↔ technology fusion engine" \
  -b $'Connect business capabilities and technology stack so Fuxi can detect missing capability coverage, redundancies, and value friction zones between business and IT.' \
  -l capabilities -l modernization-engine -l enhancement

gh issue create -R "$REPO" \
  -t "Advanced artifact intelligence (PPTX/PDF/screenshots)" \
  -b $'Improve artifact extraction: support PPTX, multi-page PDFs, and messy screenshots. Parse boxes/arrows/legends from diagrams and convert them into systems, flows, and dispositions.' \
  -l ai -l ingestion

gh issue create -R "$REPO" \
  -t "Consultant guidance layer (risks, decisions, EA value summary)" \
  -b $'Add a guidance layer that surfaces: critical decisions needed per phase, top risks and mitigations, and a concise EA value-creation summary that can drop straight into client decks/SOWs.' \
  -l enhancement -l roadmap

gh issue create -R "$REPO" \
  -t "Modernization workspace UX enhancements" \
  -b $'Improve the modernization workspace: better artifact management, ability to ignore systems, compare current vs future vs inventory views, annotate systems, and manage versions of diagrams.' \
  -l ui-ux -l modernization-engine

gh issue create -R "$REPO" \
  -t "Industry templates (retail, DTC, supply chain)" \
  -b $'Provide pre-baked capability and roadmap templates for key domains (retail commerce, DTC, supply chain, etc.) so new engagements can start from opinionated defaults instead of a blank slate.' \
  -l enhancement -l capabilities

gh issue create -R "$REPO" \
  -t "Export enhancements (Excel + PDF + CSV bundle)" \
  -b $'Improve exports so users can download: Excel views for inventories and roadmaps, CSV for dependencies, and PDFs for executive summaries/EA value-creation narratives.' \
  -l enhancement -l ui-ux

gh issue create -R "$REPO" \
  -t "Joshua ↔ Fuxi integration (CLI orchestration)" \
  -b $'Expose ingestion, normalization, cognition, and roadmap generation as Joshua CLI commands (e.g., /ingest, /normalize, /generate-roadmap) so the whole flow can be driven from the terminal/voice.' \
  -l feature -l architecture

gh issue create -R "$REPO" \
  -t "Risk scoring prototype for high-risk systems" \
  -b $'Prototype a risk scoring model that combines structural risk (centrality, number of dependencies) and sequencing risk (how early it appears in the roadmap) to flag high-risk systems automatically.' \
  -l risk -l enhancement

gh issue create -R "$REPO" \
  -t "High-risk systems view (modernization dashboard)" \
  -b $'Create a dedicated view that surfaces high-risk systems, their dependencies, and the phases they participate in, so sequencing decisions are obvious to stakeholders.' \
  -l ui-ux -l risk -l modernization-engine

echo
echo "Done. Go to GitHub → Issues and then use “Add item from repository” in your Project to pull them into the board."