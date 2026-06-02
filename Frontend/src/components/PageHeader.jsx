export default function PageHeader({ icon: Icon, badge, title, description, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-primary/5 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-strip-primary/5 blur-2xl" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          {badge && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-brand-primary">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {badge}
            </div>
          )}
          <h1 className="m-0 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
