Fuxi UI Wireframes & Navigation Model

This document describes the intended UX layout and navigation flow for the Fuxi Enterprise Engine platform.
It captures the working model for the three major workspaces:
	•	Capability Modeling
	•	Tech Stack Modeling
	•	Digital Enterprise View

Use this document as a guide for shaping UI patterns, naming, and page structure.

⸻

1. Page Overview Structure

Home / Start Page (/)
	•	Simple clean layout
	•	Three primary tiles:
	•	Capability Modeling → /project/:id/capabilities (Build → Edit → Score → View)
	•	Tech Stack Modeling → /project/:id/tech-stack (Build → Edit → View)
	•	Digital Enterprise View → /project/:id/digital-enterprise (Analyze)
	•	Text field to create/open a project

⸻

2. Capability Modeling Workspace

Tabs / Modes
	•	Build: Import or define capability map structure
	•	Edit: Refine capability hierarchy & metadata
	•	Score: Assess maturity/impact/value
	•	View: Visualize capability heatmaps / value lens

Pages
	•	/project/:id/capabilities/build
	•	/project/:id/capabilities/edit
	•	/project/:id/capabilities/score
	•	/project/:id/capabilities/view

⸻

3. Tech Stack Modeling Workspace

Tabs / Modes
	•	Build: Import inventory, diagrams, or Lucid CSV
	•	Edit: Update system metadata, clusters, domains
	•	View: System estate map (apps, data, platforms)

Pages
	•	/project/:id/tech-stack/build
	•	/project/:id/tech-stack/edit
	•	/project/:id/tech-stack/view

Upload Types
	•	Inventory (CSV/XLS)
	•	Architecture diagrams (image + OCR/box detection)
	•	Lucid export CSV (nodes + connectors)

⸻

4. Digital Enterprise View

Modes
	•	Analyze: Where capabilities × tech stack meet
	•	Redundancy
	•	Risk
	•	Opportunity
	•	Sequencing

Pages
	•	/project/:id/digital-enterprise

Key Features
	•	Unified model of capabilities + systems + integrations
	•	Visual relationship maps
	•	Opportunity hot-zones
	•	Narrative generation

⸻

5. Navigation Model

Global Navigation
	•	Home
	•	Project (current)
	•	Capabilities
	•	Tech Stack
	•	Digital Enterprise

Local Navigation (within workspace)
	•	Tabs reflect workflow stage

Example:

Capabilities: [ Build | Edit | Score | View ]
Tech Stack:   [ Build | Edit | View ]
Digital Ent:  [ Analyze ]


⸻

6. Consistent UI Pattern Principles
	•	3-column layout maximum on desktop
	•	Soft rounded cards (matching Tech Stack page style)
	•	Minimal color until final polish stage
	•	One upload button per file type
	•	Status + progress indicator for uploads

⸻

7. Next Steps Summary
	1.	Finalize routes for all workspaces
	2.	Remove all legacy demo/ and modernization/ references
	3.	Align Capabilities UI to Tech Stack layout style
	4.	Wire Lucid CSV ingestion into tech-stack build mode
	5.	Connect Digital Enterprise to stored Lucid model

⸻

This document continues to evolve as project structure and UX patterns stabilize. Add notes inline as we refine.
