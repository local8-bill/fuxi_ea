"use client";
import React, { useMemo } from "react";
import { useCapabilities } from "@/features/capabilities/CapabilityProvider";
import { DEFAULT_SCORES, compositeScore } from "@/features/capabilities/utils";

export function GridView() {
  const { byId, children, roots, setOpenId, query, domain, weights } = useCapabilities();

  const filteredRoots = useMemo(()=> {
    const q = query.trim().toLowerCase();
    return roots
      .map(id=>byId[id])
      .filter(c => (domain==="All Domains"? true : c.domain===domain))
      .filter(c => (q? c.name.toLowerCase().includes(q) : true));
  }, [roots, byId, query, domain]);

  return (
    <div className="grid-auto">
      {filteredRoots.map(l1 => {
        const childIds = children[l1.id] ?? [];
        const score = compositeScore(
          childIds.length? averageChild(childIds, byId, children) : (l1.scores ?? DEFAULT_SCORES),
          weights
        );
        return (
          <div key={l1.id} className="card hover:bg-slate-50 cursor-pointer" onClick={()=>setOpenId(l1.id)}>
            <div className="flex items-center justify-between">
              <div className="font-medium">{l1.name}</div>
              <span className="badge">{Math.round(score*100)} / 100</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">{childIds.length} sub-capabilities</div>
          </div>
        );
      })}
    </div>
  );
}

function averageChild(ids:string[], byId:any, children:any) {
  const gather = (id:string): number[] => {
    const kids = children[id] ?? [];
    if (!kids.length) {
      const s = byId[id].scores ?? { ...DEFAULT_SCORES };
      const raw = (s.opportunity+s.maturity+s.techFit+s.strategicAlignment+s.peopleReadiness)/5;
      return [raw];
    }
    return kids.flatMap(gather);
  };
  const vals = ids.flatMap(gather);
  const avg = vals.length ? vals.reduce((a:number,b:number)=>a+b,0)/vals.length : 0;
  return { opportunity: avg, maturity: avg, techFit: avg, strategicAlignment: avg, peopleReadiness: avg };
}
