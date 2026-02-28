import { type ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  Info,
  XCircle,
  Loader2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   STAT CARD — Animated metric cards with sparkline area
   ═══════════════════════════════════════════════════ */

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
  subtitle?: string;
  className?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', iconBg: 'bg-blue-100', ring: 'ring-blue-200' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', iconBg: 'bg-emerald-100', ring: 'ring-emerald-200' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', iconBg: 'bg-purple-100', ring: 'ring-purple-200' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', iconBg: 'bg-orange-100', ring: 'ring-orange-200' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', iconBg: 'bg-red-100', ring: 'ring-red-200' },
  teal: { bg: 'bg-teal-50', icon: 'text-teal-600', iconBg: 'bg-teal-100', ring: 'ring-teal-200' },
};

export function StatCard({ title, value, icon: Icon, change, changeType = 'neutral', color = 'blue', subtitle, className }: StatCardProps) {
  const colors = colorMap[color];
  const TrendIcon = changeType === 'positive' ? TrendingUp : changeType === 'negative' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)' }}
      className={cn(
        'bg-white rounded-2xl border border-slate-200/80 p-5 cursor-default',
        'transition-colors duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-slate-500 truncate">{title}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-[28px] font-bold text-slate-800 mt-1 tracking-tight"
          >
            {value}
          </motion.p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon className={cn('w-3.5 h-3.5', 
                changeType === 'positive' ? 'text-emerald-500' :
                changeType === 'negative' ? 'text-red-500' : 'text-slate-400'
              )} />
              <p className={cn('text-xs font-medium',
                changeType === 'positive' ? 'text-emerald-600' :
                changeType === 'negative' ? 'text-red-600' : 'text-slate-500'
              )}>
                {change}
              </p>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl ring-1', colors.iconBg, colors.ring)}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
      </div>
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════
   CARD — Flexible container with header / actions
   ═══════════════════════════════════════════════════ */

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: ReactNode;
  noPadding?: boolean;
  animate?: boolean;
}

export function Card({ children, className = '', title, subtitle, icon: HeaderIcon, action, noPadding, animate = true }: CardProps) {
  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate ? {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  } : {};

  return (
    <Wrapper
      {...(wrapperProps as Record<string, unknown>)}
      className={cn('bg-white rounded-2xl border border-slate-200/80 shadow-sm', className)}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            {HeaderIcon && (
              <div className="p-1.5 bg-primary-50 rounded-lg">
                <HeaderIcon className="w-4 h-4 text-primary-600" />
              </div>
            )}
            <div>
              {title && <h3 className="text-[15px] font-semibold text-slate-800">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </Wrapper>
  );
}


/* ═══════════════════════════════════════════════════
   BADGE — Status / category labels
   ═══════════════════════════════════════════════════ */

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const badgeColors = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/80',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/80',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200/80',
};

const dotColors = {
  default: 'bg-slate-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
};

export function Badge({ children, variant = 'default', size = 'sm', dot, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      badgeColors[variant],
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', dotColors[variant])} />}
      {children}
    </span>
  );
}


/* ═══════════════════════════════════════════════════
   BUTTON — Consistent button styles
   ═══════════════════════════════════════════════════ */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
  iconRight?: React.ElementType;
  loading?: boolean;
  children: ReactNode;
}

const buttonVariants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm shadow-primary-600/20',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-600/20',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-600/20',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary', size = 'md', icon: LeftIcon, iconRight: RightIcon, loading, children, className, disabled, ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150',
        'focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : LeftIcon && <LeftIcon className="w-4 h-4" />}
      {children}
      {RightIcon && !loading && <RightIcon className="w-4 h-4" />}
    </button>
  );
});
Button.displayName = 'Button';


/* ═══════════════════════════════════════════════════
   INPUT — Form inputs with labels
   ═══════════════════════════════════════════════════ */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, icon: Icon, className, ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
            'transition-all duration-150 placeholder:text-slate-400',
            Icon && 'pl-10',
            error && 'border-red-300 focus:ring-red-500/20 focus:border-red-400',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';


/* ═══════════════════════════════════════════════════
   SELECT — Styled select dropdown
   ═══════════════════════════════════════════════════ */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  icon?: React.ElementType;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, error, options, icon: Icon, className, ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
            'transition-all duration-150 appearance-none cursor-pointer',
            Icon && 'pl-10',
            error && 'border-red-300 focus:ring-red-500/20 focus:border-red-400',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
});
Select.displayName = 'Select';


/* ═══════════════════════════════════════════════════
   TEXTAREA — Styled textarea
   ═══════════════════════════════════════════════════ */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, className, ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
          'transition-all duration-150 placeholder:text-slate-400 resize-none',
          error && 'border-red-300 focus:ring-red-500/20 focus:border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
});
Textarea.displayName = 'Textarea';


/* ═══════════════════════════════════════════════════
   ALERT — Contextual notifications
   ═══════════════════════════════════════════════════ */

interface AlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const alertConfig = {
  info: { bg: 'bg-blue-50 border-blue-200', icon: Info, iconColor: 'text-blue-500', titleColor: 'text-blue-800', textColor: 'text-blue-700' },
  success: { bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-500', titleColor: 'text-emerald-800', textColor: 'text-emerald-700' },
  warning: { bg: 'bg-amber-50 border-amber-200', icon: AlertCircle, iconColor: 'text-amber-500', titleColor: 'text-amber-800', textColor: 'text-amber-700' },
  danger: { bg: 'bg-red-50 border-red-200', icon: XCircle, iconColor: 'text-red-500', titleColor: 'text-red-800', textColor: 'text-red-700' },
};

export function Alert({ children, variant = 'info', title, className, dismissible, onDismiss }: AlertProps) {
  const config = alertConfig[variant];
  const AlertIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn('flex gap-3 px-4 py-3 rounded-xl border', config.bg, className)}
    >
      <AlertIcon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-sm font-semibold', config.titleColor)}>{title}</p>}
        <div className={cn('text-sm', config.textColor)}>{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 transition-colors">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════
   EMPTY STATE — Placeholder for empty content
   ═══════════════════════════════════════════════════ */

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════
   LOADING SPINNER — With optional label
   ═══════════════════════════════════════════════════ */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className = '', label }: LoadingSpinnerProps) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn(sizeMap[size], 'border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin')} />
      {label && <p className="text-sm text-slate-500 animate-pulse">{label}</p>}
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   SKELETON — Loading placeholder
   ═══════════════════════════════════════════════════ */

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines }: SkeletonProps) {
  if (lines) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn('skeleton h-4', i === lines - 1 && 'w-3/4')} />
        ))}
      </div>
    );
  }
  return <div className={cn('skeleton', className)} />;
}


/* ═══════════════════════════════════════════════════
   PROGRESS BAR — Animated progress indicator
   ═══════════════════════════════════════════════════ */

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  size?: 'sm' | 'md';
  striped?: boolean;
  className?: string;
}

const progressColors = {
  blue: 'bg-primary-500',
  green: 'bg-emerald-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

export function ProgressBar({ value, max = 100, label, showPercentage, color = 'blue', size = 'md', striped, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-xs">
          {label && <span className="font-medium text-slate-600">{label}</span>}
          {showPercentage && <span className="text-slate-500">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn('bg-slate-100 rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2.5')}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', progressColors[color], striped && 'progress-stripe')}
        />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   AVATAR — User avatar with fallback initials
   ═══════════════════════════════════════════════════ */

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

const avatarSizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
const statusDotSizes = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
const statusDotColors = { online: 'bg-emerald-500', offline: 'bg-slate-400', busy: 'bg-red-500' };

export function Avatar({ name, src, size = 'md', status, className }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <div className={cn('relative inline-flex', className)}>
      {src ? (
        <img src={src} alt={name} className={cn('rounded-full object-cover', avatarSizes[size])} />
      ) : (
        <div className={cn(
          'rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white',
          'flex items-center justify-center font-semibold',
          avatarSizes[size]
        )}>
          {initials}
        </div>
      )}
      {status && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
          statusDotSizes[size],
          statusDotColors[status]
        )} />
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   TOOLTIP — Simple tooltip wrapper
   ═══════════════════════════════════════════════════ */

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className={cn(
        'absolute left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg text-xs font-medium',
        'bg-slate-800 text-white whitespace-nowrap pointer-events-none',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50',
        position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
      )}>
        {content}
        <div className={cn(
          'absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45',
          position === 'top' ? '-bottom-1' : '-top-1'
        )} />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   DIVIDER — Section separator
   ═══════════════════════════════════════════════════ */

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (!label) return <hr className={cn('border-slate-200', className)} />;
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <hr className="flex-1 border-slate-200" />
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      <hr className="flex-1 border-slate-200" />
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   PAGE HEADER — Consistent page title area
   ═══════════════════════════════════════════════════ */

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, badge, actions, className }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2.5 bg-primary-50 rounded-xl border border-primary-100 mt-0.5">
            <Icon className="w-5 h-5 text-primary-600" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════
   TAB GROUP — Horizontal tab navigation
   ═══════════════════════════════════════════════════ */

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

interface TabGroupProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabGroup({ tabs, activeTab, onChange, className }: TabGroupProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-slate-100 rounded-xl', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              isActive
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-600'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   MODAL — Accessible overlay dialog
   ═══════════════════════════════════════════════════ */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

const modalSizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({ open, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className={cn('relative bg-white rounded-2xl shadow-2xl w-full z-10', modalSizes[size])}
      >
        {title && (
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
        )}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   AI STATUS INDICATOR — Shows AI system status
   ═══════════════════════════════════════════════════ */

interface AIStatusProps {
  status: 'idle' | 'thinking' | 'processing' | 'complete' | 'error';
  label?: string;
  className?: string;
}

const aiStatusConfig = {
  idle: { dot: 'bg-slate-400', text: 'text-slate-500', label: 'Ready' },
  thinking: { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-600', label: 'AI Thinking...' },
  processing: { dot: 'bg-blue-400 animate-pulse-dot', text: 'text-blue-600', label: 'Processing...' },
  complete: { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Complete' },
  error: { dot: 'bg-red-500', text: 'text-red-600', label: 'Error' },
};

export function AIStatus({ status, label, className }: AIStatusProps) {
  const config = aiStatusConfig[status];
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('w-2 h-2 rounded-full', config.dot)} />
      <span className={cn('text-xs font-medium', config.text)}>
        {label || config.label}
      </span>
    </div>
  );
}
