"use client";

import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, domain: string) => void;
  domainSuggestions: string[]; // existing domains to hint
};

export function AddL1Dialog({ open, onClose, onCreate, domainSuggestions }: Props) {
  const [name, setName] = React.useState("");
  const [domain, setDomain] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName("");
      setDomain("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="card p-4" style={{ width: 420 }}>
        <div className="font-semibold text-lg mb-2">Add L1 Capability</div>

        <label className="text-sm">Name</label>
        <input
          className="input w-full mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Order Management"
        />

        <label className="text-sm">Domain</label>
        <input
          className="input w-full mb-3"
          list="domain-suggest"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g., Core Ops"
        />
        <datalist id="domain-suggest">
          {domainSuggestions.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>

        <div className="flex gap-2 justify-end">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onCreate(name, domain);
              onClose();
            }}
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}