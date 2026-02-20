interface StatCardProps {
  value: string | number;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-ih-surface dark:bg-ih-surface-dark rounded-2xl p-5 flex-1">
      <div className="text-[32px] font-semibold text-ih-text dark:text-ih-text-dark tracking-tight">
        {value}
      </div>
      <div className="text-[13px] text-ih-text-secondary dark:text-ih-text-secondary-dark">{label}</div>
    </div>
  );
}
