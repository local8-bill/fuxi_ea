
# Fuxi User Journey Blueprint

## Overview
Fuxi is an AI-assisted capability modeling and scoring workspace. It enables users to create, assess, and visualize enterprise capability maps using AI suggestions, uploads, or manual building tools.

---

## User Journey Flow
1. Landing Page (`/`)
2. New Project Wizard (`/new`)
   - Upload existing capability map
   - Build from scratch
   - AI suggest baseline (industry)
3. Project Workspace (`/project/[id]`)
   - Builder
   - Scoring
   - Insights
   - Settings

### High-level Flow Diagram
```
[Landing]
   ↓
[New Project Wizard]
   ├── Upload Map
   ├── Build from Scratch
   └── AI Suggest (Industry)
         ↓
   [Project Builder]
         ↓
   [Scoring Mode]
         ↓
   [Insights Mode]
         ↓
   [Settings / Export]
```

---

## 1. Landing Page
**Purpose:** Entry point for users to create or open projects.

**Primary Actions:**
- Create new project
- Import JSON
- Open existing projects

**Visual Layout:**
```
+--------------------------------------------------+
|  FUXI                                            |
|--------------------------------------------------|
| [Create New Project]  [Import JSON]  [Open List] |
|--------------------------------------------------|
| Recent Projects:                                 |
|  - Digital Retail Map                            |
|  - Supply Chain Optimization                     |
+--------------------------------------------------+
```

---

## 2. New Project Wizard
**Purpose:** Collect metadata and select how to initialize the capability map.

**Steps:**
1. Basic Info (name, industry)
2. Choose creation type (Build, Upload, AI Suggest)
3. Preview or adjust imported/suggested capabilities
4. Create → redirect to `/project/[id]/builder`

**Wireframe:**
```
+------------------------------------------+
| New Project Wizard                       |
|------------------------------------------|
| Step 1: Basic Info                       |
|  [Project Name  ___________]             |
|  [Industry      v Retail   ]             |
|                                          |
| Step 2: Choose Type                      |
|  [ Build ] [ Upload ] [ AI Suggest ]     |
|                                          |
| Step 3: Preview                          |
|  [Capability Hierarchy Tree]             |
|                                          |
| [Create Project]                         |
+------------------------------------------+
```

---

## 3. Project Workspace
**Purpose:** Unified hub for all project interactions.

**Tabs:** Builder | Scoring | Insights | Settings

**URL Pattern:** `/project/[id]`

**Shared Header:**
```
Project: Digital Retail Transformation
Industry: Retail
Tabs: [Builder] [Scoring] [Insights] [Settings]
```

---

### 3.1 Builder Mode
**URL:** `/project/[id]/builder`

**Goal:** Build, edit, and structure the capability map.

**Actions:**
- Add or remove capabilities
- Edit hierarchy
- AI suggest missing items
- Import/export structure

**Wireframe:**
```
+--------------------------------------------------+
| [Add L1] [Add L2] [AI Suggest]                  |
|--------------------------------------------------|
| L1: Customer Experience                         |
|   ├─ L2: Omnichannel                            |
|   │   ├─ L3: Chatbots                           |
|   │   └─ L3: Customer Insights                  |
|   └─ L2: Commerce Platform                      |
|--------------------------------------------------|
| [Preview Map]                                   |
+--------------------------------------------------+
```

---

### 3.2 Scoring Mode
**URL:** `/project/[id]/scoring`

**Goal:** Assess maturity, alignment, and readiness for each capability.

**Key Features:**
- Domain filter and search
- Grid and heatmap views
- Scoring sliders (1–5)
- Weighted composite calculation
- Export JSON

**Wireframe:**
```
+--------------------------------------------------+
| [TopBar: Search | Domain | View | Weights]       |
|--------------------------------------------------|
|  Capability Grid                                 |
|   - Customer Experience  → Score: 4.2            |
|   - Supply Chain Efficiency → Score: 3.1         |
|--------------------------------------------------|
| [Scoring Drawer opens on click]                  |
+--------------------------------------------------+
```

---

### 3.3 Insights Mode
**URL:** `/project/[id]/insights`

**Goal:** Summarize results and provide AI-driven recommendations.

**Features:**
- Domain rollup charts (bar/radar)
- AI narrative ("Focus areas")
- Export PDF/JSON

**Wireframe:**
```
+--------------------------------------------------+
| Insights Summary                                 |
|--------------------------------------------------|
| Avg Maturity: 3.6 | Alignment: 4.1              |
|--------------------------------------------------|
| [Radar Chart by Domain]                         |
|--------------------------------------------------|
| AI Insight:                                     |
| "Customer Experience strong, Supply Chain weak." |
|--------------------------------------------------|
| [Export PDF] [Compare Baselines]                |
+--------------------------------------------------+
```

---

### 3.4 Settings
**URL:** `/project/[id]/settings`

**Goal:** Manage project metadata and backups.

**Wireframe:**
```
+--------------------------------------------------+
| Project Settings                                 |
|--------------------------------------------------|
| Name: [Digital Retail Capability Model]          |
| Industry: [Retail]                               |
|--------------------------------------------------|
| [Duplicate Project] [Delete Project]             |
| [Export JSON]                                   |
+--------------------------------------------------+
```

---

## 4. Data Model
**Storage:** Local-first, later cloud.

**Schema Overview:**
```ts
Project {
  meta: { id, name, industry, createdAt, updatedAt },
  capabilities: Capability[],
  weights: { maturity, techFit, strategicAlignment, peopleReadiness, opportunity }
}
```

---

## 5. AI Touchpoints
| Stage | AI Function |
|-------|--------------|
| New Project | Suggest baseline maps |
| Builder | Add missing capabilities |
| Scoring | Give coaching insights |
| Insights | Generate recommendations |
| Upload | Interpret images into structures |

---

## 6. Future Expansion
| Feature | Description |
|----------|-------------|
| Collaboration | Multi-user projects |
| Versioning | Compare current vs. target |
| Evidence | Attach supporting docs |
| Templates | Pre-built industry baselines |
| Integrations | API sync with LeanIX, ArchiMate |
