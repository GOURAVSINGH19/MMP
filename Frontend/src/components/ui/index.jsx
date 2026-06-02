import * as React from "react";

// Helper function to combine Tailwind classes
const cn = (...classes) => classes.filter(Boolean).join(" ");

// --- BUTTON COMPONENT (Shadcn style + Antigravity) ---
export const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] cursor-pointer tracking-wide";

  const variants = {
    default: "bg-brand-primary text-white shadow-md hover:bg-brand-primary/90 hover:shadow-brand-primary/20 hover:shadow-lg",
    destructive: "bg-red-500 text-white shadow-sm hover:bg-red-650 hover:shadow-red-500/20 hover:shadow-lg",
    outline: "border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm hover:bg-slate-50 text-slate-700",
    secondary: "bg-brand-accent/20 text-brand-primary hover:bg-brand-accent/30",
    ghost: "hover:bg-slate-100/80 text-slate-700",
    link: "text-brand-primary underline-offset-4 hover:underline",
    glow: "bg-brand-primary text-white shadow-[0_4px_20px_rgba(232,89,60,0.25)] hover:bg-brand-primary/95 hover:shadow-[0_6px_25px_rgba(232,89,60,0.45)] hover:scale-[1.02]",
    // Strip-specific styles
    strip: "bg-strip-primary text-white hover:bg-strip-accent shadow-md hover:scale-[1.01]",
    // Antigravity variants
    dark: "bg-brand-dark text-white hover:opacity-90 border border-brand-dark shadow-sm",
    'dark-secondary': "bg-white border border-slate-200 text-slate-600 hover:border-brand-dark hover:text-brand-dark",
  };

  const sizes = {
    default: "h-11 px-5 py-2 text-sm",
    sm: "h-9 rounded-lg px-4 text-xs",
    lg: "h-12 rounded-xl px-8 text-base",
    icon: "h-11 w-11"
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

// --- CARD COMPONENT (Shadcn style with premium glassmorphism option) ---
export const Card = ({ className, glass = false, ...props }) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200/80 bg-white text-slate-950 shadow-sm ring-1 ring-black/[0.02] transition-all duration-300 hover:shadow-md",
      glass && "bg-white/80 border-white/60 backdrop-blur-xl shadow-xl ring-1 ring-black/[0.03]",
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6 sm:p-8", className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("font-bold leading-none tracking-tight text-2xl text-slate-900", className)} {...props} />
);

export const CardDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-slate-500/90 leading-relaxed", className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 sm:p-8 pt-0", className)} {...props} />
);

export const CardFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center p-6 sm:p-8 pt-0", className)} {...props} />
);

// --- INPUT COMPONENT (Shadcn style) ---
export const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/80 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

// --- LABEL COMPONENT (Shadcn style) ---
export const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-semibold uppercase tracking-wider text-slate-500 select-none",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

// --- SELECT COMPONENT ---
export const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/80 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

// --- BADGE COMPONENT ---
export const Badge = ({ className, variant = "default", ...props }) => {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 border shadow-sm";

  const variants = {
    default: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-green-500/10 text-green-600 border-green-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    danger: "bg-red-500/10 text-red-600 border-red-500/20"
  };

  return <span className={cn(baseStyles, variants[variant], className)} {...props} />;
};

// --- TABLE COMPONENT (Premium Shadcn style) ---
export const TableContainer = ({ className, ...props }) => (
  <div className="w-full overflow-auto rounded-xl border border-slate-250 bg-white/70 backdrop-blur-md shadow-inner">
    <table className={cn("w-full caption-bottom text-sm border-collapse", className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }) => (
  <thead className={cn("bg-slate-50/70 border-b border-slate-200", className)} {...props} />
);

export const TableBody = ({ className, ...props }) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

export const TableRow = ({ className, ...props }) => (
  <tr
    className={cn(
      "border-b border-slate-200 transition-colors duration-200 hover:bg-slate-50/50 data-[state=selected]:bg-slate-100",
      className
    )}
    {...props}
  />
);

export const TableHead = ({ className, ...props }) => (
  <th
    className={cn(
      "h-12 px-4 text-left align-middle font-bold text-slate-500 [&:has([role=checkbox])]:pr-0 border-b border-slate-250",
      className
    )}
    {...props}
  />
);

export const TableCell = ({ className, ...props }) => (
  <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
);

// --- ANTIGRAVITY COMPONENTS ---

// Btn component (simpler variant of Button)
export const Btn = ({ children, onClick, variant = 'outline', size = 'sm', className = '', disabled, loading }) => {
  const base = 'inline-flex items-center gap-1.5 rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { 
    sm: 'text-xs px-3 py-1.5', 
    md: 'text-sm px-4 py-2', 
    lg: 'text-sm px-5 py-2.5' 
  };
  const variants = {
    outline: 'border border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 bg-white',
    dark: 'bg-zinc-900 text-accent border border-zinc-900 hover:opacity-85',
    success: 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100',
    danger: 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100',
    ghost: 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  );
};

// Antigravity Input component
export const AGInput = ({ label, ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs uppercase tracking-wider font-medium text-gray-700">{label}</label>}
      <input
        className="w-full px-3 py-2 border border-black/10 rounded-md text-sm bg-white text-black placeholder:text-gray-400 focus:outline-none focus:border-black/20 transition-colors"
        {...props}
      />
    </div>
  );
};

// Error Box component
export const ErrorBox = ({ message }) => {
  const AlertTriangle = () => (
    <svg width="15" height="15" viewBox="0 0 15 15" className="mt-0.5 shrink-0" fill="none">
      <path d="M7.5 0.5L0.5 13.5H14.5L7.5 0.5Z" stroke="currentColor" strokeWidth="1"/>
    </svg>
  );
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex gap-2 items-start">
      <AlertTriangle />
      {message}
    </div>
  );
};
