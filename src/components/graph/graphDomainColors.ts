const DOMAIN_ACCENTS: Record<string, string> = {
  commerce: "#FCD34D",
  finance: "#93C5FD",
  "order management": "#86EFAC",
  operations: "#86EFAC",
  supply: "#A5B4FC",
  "supply chain": "#A5B4FC",
  retail: "#F9A8D4",
  data: "#A5B4FC",
  default: "#E5E7EB",
};

export function getDomainAccent(domain?: string | null): string {
  if (!domain) return DOMAIN_ACCENTS.default;
  const key = domain.trim().toLowerCase();
  return DOMAIN_ACCENTS[key] ?? DOMAIN_ACCENTS.default;
}

export function getDomainAccentStyle(domain?: string | null) {
  return { backgroundColor: getDomainAccent(domain) };
}
