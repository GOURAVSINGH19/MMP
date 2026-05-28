import * as React from "react";

// Helper function to combine Tailwind classes
const cn = (...classes) => classes.filter(Boolean).join(" ");

// --- BUTTON COMPONENT (Shadcn style) ---
export const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer";

  const variants = {
    default: "bg-purple-600 text-white shadow hover:bg-purple-700 hover:shadow-purple-500/20 hover:shadow-lg",
    destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-red-500/20 hover:shadow-lg",
    outline: "border border-slate-200 dark:border-slate-800 bg-transparent shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700",
    ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
    link: "text-purple-600 underline-offset-4 hover:underline",
    glow: "bg-purple-600 text-white shadow-[0_0_15px_rgba(170,59,255,0.3)] hover:bg-purple-700 hover:shadow-[0_0_25px_rgba(170,59,255,0.6)] hover:scale-[1.02]"
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 rounded-md px-3 text-xs",
    lg: "h-11 rounded-lg px-8 text-base",
    icon: "h-10 w-10"
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
      "rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 shadow-sm ring-1 ring-black/10 dark:ring-white/10 transition-all duration-300",
      glass && "bg-white/10 dark:bg-slate-900/20 border-white/20 dark:border-slate-800/40 backdrop-blur-lg shadow-xl ring-1 ring-black/5 dark:ring-white/5",
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("font-semibold leading-none tracking-tight text-xl text-slate-900 dark:text-white", className)} {...props} />
);

export const CardDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-slate-500 dark:text-slate-400", className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

export const CardFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
);

// --- INPUT COMPONENT (Shadcn style) ---
export const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 dark:focus:ring-white/5 dark:focus:border-slate-700 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ring-1 ring-black/5 dark:ring-white/5",
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
      "text-sm font-semibold leading-none text-slate-700 dark:text-slate-350 select-none",
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
        "flex h-10 w-full rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 dark:focus:ring-white/5 dark:focus:border-slate-700 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ring-1 ring-black/5 dark:ring-white/5",
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
    default: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    success: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
  };

  return <span className={cn(baseStyles, variants[variant], className)} {...props} />;
};

// --- TABLE COMPONENT (Premium Shadcn style) ---
export const TableContainer = ({ className, ...props }) => (
  <div className="w-full overflow-auto rounded-xl border border-slate-250 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md shadow-inner">
    <table className={cn("w-full caption-bottom text-sm border-collapse", className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }) => (
  <thead className={cn("bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800", className)} {...props} />
);

export const TableBody = ({ className, ...props }) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

export const TableRow = ({ className, ...props }) => (
  <tr
    className={cn(
      "border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-slate-800",
      className
    )}
    {...props}
  />
);

export const TableHead = ({ className, ...props }) => (
  <th
    className={cn(
      "h-12 px-4 text-left align-middle font-bold text-slate-500 dark:text-slate-400 [&:has([role=checkbox])]:pr-0 border-b border-slate-250 dark:border-slate-800",
      className
    )}
    {...props}
  />
);

export const TableCell = ({ className, ...props }) => (
  <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
);
