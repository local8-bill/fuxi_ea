# 🧭 FUXI PARTNER PROTOCOL

A lightweight protocol for working seamlessly with your AI architect (Fuxi).  
Follow these conventions to ensure perfect context, no data loss, and frictionless collaboration.

---

### 🔹 1. Environment Snapshot (Where You Are)

Show me:
    pwd
    git status -s
    # If running a dev server:
    npm run dev (port?)

**Why:** Tells me your current repo, branch, and what’s running.

---

### 🔹 2. File Context (What’s Inside)

Show me structure + key files:
    ls src/ui/siren-system
    head -40 src/ui/siren-system/button.tsx

**Why:** I use this as ground truth, not memory. I never guess or overwrite.

---

### 🔹 3. Intent Flag (What You Want Me To Do)
    INTENT: verify | extend | refactor | cleanup | rollback

**Why:** Locks my behavior to that mode. “Verify” = no file writes.

---

### 🔹 4. Scope (What System or Layer)
    SCOPE: Fuxi_EA | SIREN UX | agent_mesh | data ingestion

**Why:** Prevents cross-system edits.

---

### 🔹 5. Diff Flow
1. You show current file.  
2. I respond with unified diff.  
3. You confirm → I apply.  
4. I mark checkpoint.

Example:
    CHECKPOINT: SIREN v1.0 verified baseline

---

### 🔹 6. Context Switch
    CONTEXT SWITCH → mesh
    CONTEXT SWITCH → fuxi_ea

**Why:** Keeps environment references clean.

---

### 🔹 7. Output Control
    OUTPUT: diff only | summary | script-ready

**Why:** Controls verbosity and response format.

---

### 🔹 8. Safety Net
    INTENT: rollback
    SCOPE: current edit

**Why:** I’ll revert to the last verified checkpoint.

---

### 🔹 9. Efficiency Hack
    INTENT: audit
    SCOPE: ui consistency

**Why:** Analysis-only mode — no edits, just review.

---

### 🔹 10. Verify Mode
    VERIFY MODE ON

**Why:** Forces proof for every action.

---

Fuxi remembers patterns, not states — your precision keeps us synced.  
Treat this as your **flight checklist** across Fuxi_EA, Mesh, or SIREN.

