#!/usr/bin/env python3
"""Aggregate reasoning logs into learning corpus for ALE."""

from __future__ import annotations

import json
from pathlib import Path
from statistics import mean

ROOT = Path(__file__).resolve().parents[1]
REASONING_FILE = ROOT / "src" / "data" / "ale" / "reasoning_log.json"
CORPUS_FILE = ROOT / "src" / "data" / "ale" / "learning_corpus.json"


def load_events() -> list[dict]:
    if not REASONING_FILE.exists():
        return []
    try:
        return json.loads(REASONING_FILE.read_text())
    except json.JSONDecodeError:
        return []


def build_corpus(events: list[dict]) -> list[dict]:
    summary: dict[str, dict[str, list[float] | int]] = {}
    for event in events:
        tags = event.get("context_tags") or []
        if not isinstance(tags, list):
            continue
        risk = event.get("risk_score")
        if not isinstance(risk, (int, float)):
            risk = 0.5
        for raw_tag in tags:
            if not isinstance(raw_tag, str) or not raw_tag:
                continue
            tag = raw_tag.strip()
            bucket = summary.setdefault(tag, {"occurrences": 0, "risks": []})
            bucket["occurrences"] += 1
            bucket["risks"].append(float(risk))
    corpus = []
    for tag, data in summary.items():
        risks = data["risks"] or [0.5]
        avg_risk = float(mean(risks))
        strength = min(1.0, avg_risk + data["occurrences"] / 100)
        corpus.append(
            {
                "tag": tag,
                "occurrences": data["occurrences"],
                "average_risk": round(avg_risk, 2),
                "recommendation_strength": round(strength, 2),
                "recommendation": f"Monitor {tag.replace('_', ' ')} during sequencing.",
            }
        )
    corpus.sort(key=lambda entry: entry["occurrences"], reverse=True)
    return corpus


def main() -> None:
    events = load_events()
    corpus = build_corpus(events)
    CORPUS_FILE.parent.mkdir(parents=True, exist_ok=True)
    CORPUS_FILE.write_text(json.dumps(corpus, indent=2))
    print(f"Wrote {len(corpus)} learning entries to {CORPUS_FILE}")


if __name__ == "__main__":
    main()
