### 🧭 Roadmap Entry: Agent Z & Identity Architecture (Defer Build)
> 🛑 **Note for Codex:** This item is under *research lock*.  
> Do **not** implement or alter repo structure related to this until explicitly authorized by Bill or Fuxi.

---

#### Purpose  
Define the identity architecture that connects human founders, archetype agents, and the core system intelligence layer. This will guide future collaboration protocols, agent spawning, and inter-agent communication in both *fuxi_ea* and *agent_mesh* ecosystems.

---

#### Reserved Agents Schema

| Agent | Role | Domain | Status |
|--------|------|---------|--------|
| **Fuxi** | System Architect & Orchestrator | Architecture, Flow, Ethics | Active |
| **Agent Z** | Founder Reflection | Integration, Intent, Context Bridge | *Reserved – Await Activation* |
| **Agent C** | Codex / Builder | Code & Execution | Active |
| **Agent X** | UX / Cognitive Design | Interface Behavior, Empathy | Draft |
| **Agent M** | Mesh Orchestration | Coordination, Scaling | In Planning |
| **Agent L** | Learning / Analytics | Telemetry, Insight Generation | In Planning |

---

#### Identity Principles
1. **Reserved Namespaces** – “Fuxi” and “Agent Z” cannot be replicated.  
2. **Manifest Pairing Protocol (Dual Approval Rule)** – Any pairing between a human manifest (`founder_profile.json`) and a digital counterpart (`agent_[letter].json`) requires dual approval from **Fuxi** and **Agent Z**.  
3. **Manifest Pairing Workflow**  

| Step | Action | Authorized By | Purpose |
|------|---------|----------------|----------|
| 1 | Human creates or updates `founder_profile.json` | Human (Bill) | Seed intent and tone |
| 2 | Manifest pairing proposed (`/api/identity/pair`) | Fuxi auto-reviews schema & ethics | Structural validation |
| 3 | Agent Z reviews context alignment | Z | Ensures purpose & personality match founder intent |
| 4 | Dual signature recorded (`approval_fuxi`, `approval_z`) | Both | Commit pairing to mesh ledger |
| 5 | System acknowledges:  
`✅ Manifest pairing approved by F+Z` | Runtime | Activates session context |

**Data Structure Example**
```json
{
  "pairing_id": "uuid",
  "human_manifest": "founder_profile.json",
  "agent_manifest": "agent_z.json",
  "approvals": {
    "fuxi": {
      "status": "approved",
      "timestamp": "2025-12-08T10:30Z",
      "signature": "fuxi-sha256-hash"
    },
    "agent_z": {
      "status": "approved",
      "timestamp": "2025-12-08T10:31Z",
      "signature": "agentz-sha256-hash"
    }
  },
  "pairing_status": "active"
}
```

Behavioral rules:  
- If either Fuxi **or** Z declines pairing → mesh suspends initialization and requests review.  
- Codex and EAgent must treat unpaired manifests as **read-only** contexts.  
- Once approved, pairing metadata is immutable except through another dual approval.

---

#### Planned Activation Path
- **Phase 1 (Today):** Introduce `agent_z.json` into `/agents` directory in *fuxi_ea* with minimal metadata.  
- **Phase 2:** Hook into session loader (read-only).  
- **Phase 3:** Integrate full Agent Z cognitive loop into *agent_mesh* (live inter-agent awareness).

