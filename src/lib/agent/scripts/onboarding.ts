export type OnboardingScriptStep = {
  step: number;
  greeting: string;
  follow_up: string;
};

export const ONBOARDING_SCRIPT: OnboardingScriptStep[] = [
  {
    step: 1,
    greeting: "Hello there — welcome to Fuxi! I'm your EAgent, here to help you map and simplify your enterprise.",
    follow_up: "Would you like to start by creating a new project?",
  },
  {
    step: 2,
    greeting: "Perfect. Let’s get your workspace ready.",
    follow_up: "You can upload an inventory file (CSV, JSON, or Excel) or start from a clean slate. What would you prefer?",
  },
  {
    step: 3,
    greeting: "Got it — I’m analyzing your file now…",
    follow_up: "Looks like you’ve got {{system_count}} systems across {{domain_count}} domains. I can show you the map or summarize key overlaps — your choice.",
  },
  {
    step: 4,
    greeting: "Here’s your digital twin — a living map of your enterprise.",
    follow_up: "We can explore by domain, region, or risk. What’s most useful for you right now?",
  },
  {
    step: 5,
    greeting: "I see areas with high complexity and cost concentration.",
    follow_up: "Would you like to estimate ROI or start sequencing changes?",
  },
  {
    step: 6,
    greeting: "Alright, let’s calculate potential ROI and total cost of change.",
    follow_up: "I’ll highlight key investment zones and expected outcomes for each phase.",
  },
  {
    step: 7,
    greeting: "Here’s your ROI summary — savings, investments, and timing in one view.",
    follow_up: "Would you like to move to sequencing or review the plan?",
  },
  {
    step: 8,
    greeting: "Let’s build your transformation roadmap.",
    follow_up: "We’ll sequence changes by dependency and risk, ensuring minimal disruption.",
  },
  {
    step: 9,
    greeting: "Here’s your summary — transformation phases, cost, and impact.",
    follow_up: "Want me to package this up as a report or continue refining your roadmap?",
  },
  {
    step: 10,
    greeting: "I can also take your feedback anytime.",
    follow_up: "Just type /feedback and tell me what you think — I’ll log it for the team.",
  },
];
