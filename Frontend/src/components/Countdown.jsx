import { useEffect, useState } from 'react';

function getTimeLeft(targetDate) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    ended: false,
  };
}

export default function Countdown({ targetDate, className = '' }) {
  const [time, setTime] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) return null;

  if (time.ended) {
    return (
      <p className={`text-sm font-semibold text-brand-primary ${className}`}>
        Race day has started — good luck, runners!
      </p>
    );
  }

  const units = [
    { label: 'Days', value: time.days },
    { label: 'Hours', value: time.hours },
    { label: 'Min', value: time.minutes },
    { label: 'Sec', value: time.seconds },
  ];

  const onDark = !className.includes('text-slate');

  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
      {units.map(({ label, value }) => (
        <div
          key={label}
          className={`min-w-[4.5rem] rounded-xl border px-3 py-2 text-center ${
            onDark
              ? 'border-white/20 bg-white/10 backdrop-blur-sm'
              : 'border-slate-200 bg-brand-light/50'
          }`}
        >
          <div className={`text-2xl font-black tabular-nums ${onDark ? 'text-white' : 'text-slate-900'}`}>
            {String(value).padStart(2, '0')}
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-widest ${onDark ? 'text-white/60' : 'text-slate-500'}`}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
