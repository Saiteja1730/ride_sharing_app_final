import { clsx } from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'violet' | 'cyan';

const variantMap: Record<BadgeVariant, string> = {
  success: 'bg-green-500/15 text-green-400 border-green-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger:  'bg-red-500/15 text-red-400 border-red-500/20',
  info:    'bg-brand-500/15 text-brand-400 border-brand-500/20',
  neutral: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  violet:  'bg-violet-500/15 text-violet-400 border-violet-500/20',
  cyan:    'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
};

const statusMap: Record<string, BadgeVariant> = {
  searching: 'warning',
  accepted:  'info',
  arriving:  'violet',
  ongoing:   'cyan',
  completed: 'success',
  cancelled: 'danger',
  online:    'success',
  offline:   'neutral',
};

export function Badge({ label, variant, status }: {
  label: string;
  variant?: BadgeVariant;
  status?: string;
}) {
  const resolvedVariant = variant ?? (status ? statusMap[status] : 'neutral') ?? 'neutral';
  const isLive = status && ['searching', 'accepted', 'arriving', 'ongoing', 'online'].includes(status);
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      variantMap[resolvedVariant]
    )}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full bg-current opacity-80',
        isLive && 'animate-pulse'
      )} />
      {label}
    </span>
  );
}
