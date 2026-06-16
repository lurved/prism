interface SectionHeadingProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

/** Consistent section label used across both comparison pages. */
export function SectionHeading({ children, action }: SectionHeadingProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{children}</h2>
      {action}
    </div>
  );
}
