## Directive D087H — Refactor Safety Routine

### 🎯 Objective
Prevent “UX refactor sprawl” from breaking functional code paths by isolating graph logic changes from layout / template experiments. This ensures a stable merge path for all future branches.

---

### ⚙️ Routine Overview
This directive defines a *three-stage safety workflow* any time large refactors or Shadcn UI migrations are underway.

---

### **1️⃣ Commit Stable Work First**
Before doing *any* layout or template work:

```bash
git add src/components/graph src/app/globals.css
git commit -m "feat: graph UX template cleanup and refactor foundation"
```

- ✅ Locks in all graph logic (Canvas, Node, Controls, etc.)  
- ❌ Excludes layout scaffolding, Shadcn components, or UXShell deletions.

---

### **2️⃣ Stash Experimental Work**
All deletions, Shadcn components, and early page rewires must be temporarily stashed:

```bash
git stash push -m "wip: UXShell + prototype deletions and new Shadcn scaffolding"
```

- Keeps your repo clean and functional.  
- Lets you safely pull or merge upstream changes.

---

### **3️⃣ Create Sandbox for Testing**
New layout experiments happen in a dedicated sandbox branch:

```bash
git checkout -b feature/ux-template_sandbox
git stash pop
```

- ✅ Keeps main refactor branch stable.  
- 🧩 Allows side-by-side testing of components without repo contamination.  

Once validated, merge the sandbox into the main refactor branch:

```bash
git checkout feature/ux-template_refactor
git merge feature/ux-template_sandbox
```

---

### 🧱 Success Criteria
- Main `feature/ux-template_refactor` always compiles & runs cleanly.
- Shadcn components are tested in isolation.
- No deleted components (`NavSection`, `Sidebar`, etc.) affect production builds.
- All untracked docs & scripts are committed under `/docs/features` or `/scripts/dev`.

---

### 🔐 Branch Control
| Branch | Purpose | Merge Direction |
|---------|----------|-----------------|
| `feature/ux-template_refactor` | Stable UX + Graph core | → main |
| `feature/ux-template_sandbox` | Layout & Shadcn tests | → feature/ux-template_refactor |
| `main` | Production baseline | ← feature/ux-template_refactor |

