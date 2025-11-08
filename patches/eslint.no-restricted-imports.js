// Add to .eslintrc.js
module.exports = { rules: {
  "no-restricted-imports": ["error", { patterns: [
    { group: ["@/adapters/*"], message: "UI/controllers must depend on domain ports, not adapters." },
    { group: ["@/content/*"], message: "Access content via a Content service." },
    { group: ["@/config/*"], message: "Read config through a Config port/service." }
  ]}]
}};
