import React from "react";

const base = "stroke-current text-slate-700";

export const SumIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={base}>
    <path d="M4 3h8M4 3l5 5-5 5h8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={base}>
    <path d="M8 3v10M3 8h10" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const FlowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={base}>
    <path d="M3 4h4l2 4h4M7 12h6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="3" cy="4" r="1" fill="currentColor" />
    <circle cx="7" cy="12" r="1" fill="currentColor" />
    <circle cx="13" cy="12" r="1" fill="currentColor" />
  </svg>
);

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={base}>
    <path d="M3 9l3 3 7-8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const InfinityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={base}>
    <path
      d="M4.5 6c-1.38 0-2.5 1.12-2.5 2.5S3.12 11 4.5 11c1.54 0 2.78-1.29 3.5-2.5.72-1.21 1.96-2.5 3.5-2.5 1.38 0 2.5 1.12 2.5 2.5S12.88 11 11.5 11c-1.54 0-2.78-1.29-3.5-2.5C7.28 7.29 6.04 6 4.5 6z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
