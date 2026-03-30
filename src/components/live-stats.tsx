"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ScanStats {
  databasesScanned: number;
  vulnerabilitiesDetected: number;
  securityChecks: number;
  avgScoreImprovement: number;
}

const FALLBACK: ScanStats = {
  databasesScanned: 100,
  vulnerabilitiesDetected: 2400,
  securityChecks: 12000,
  avgScoreImprovement: 34,
};

const ANIMATION_DURATION_MS = 1200;

function formatNumber(value: number): string {
  if (value >= 10_000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
  }
  return `${value.toLocaleString("en-US")}+`;
}

function useCountUp(target: number, shouldAnimate: boolean): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!shouldAnimate || target === 0) {
      setCurrent(0);
      return;
    }

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, shouldAnimate]);

  return current;
}

interface StatItemProps {
  readonly value: number;
  readonly label: string;
  readonly suffix?: string;
  readonly shouldAnimate: boolean;
  readonly isPercentage?: boolean;
}

function StatItem({ value, label, suffix, shouldAnimate, isPercentage }: StatItemProps) {
  const animated = useCountUp(value, shouldAnimate);
  const display = isPercentage ? `${animated}%` : `${formatNumber(animated)}`;

  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-semibold text-sand-900 tabular-nums">
        {display}
        {suffix && <span className="text-sand-400 text-lg ml-1">{suffix}</span>}
      </div>
      <p className="text-sm text-sand-500 mt-2">{label}</p>
    </div>
  );
}

interface LiveStatsProps {
  readonly compact?: boolean;
}

export function LiveStats({ compact }: LiveStatsProps = {}) {
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("fetch failed");
        const data: ScanStats = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setStats(FALLBACK);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) {
        setIsVisible(true);
      }
    },
    [],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [observerCallback]);

  const shouldAnimate = isVisible && stats !== null;
  const data = stats ?? FALLBACK;

  return (
    <section
      ref={sectionRef}
      className={compact ? "py-8" : "px-8 py-16 max-w-4xl mx-auto"}
    >
      <div className={compact ? "space-y-6" : "grid grid-cols-2 md:grid-cols-4 gap-8"}>
        <StatItem
          value={data.databasesScanned}
          label="Databases Scanned"
          shouldAnimate={shouldAnimate}
        />
        <StatItem
          value={data.vulnerabilitiesDetected}
          label="Vulnerabilities Found"
          shouldAnimate={shouldAnimate}
        />
        <StatItem
          value={data.securityChecks}
          label="Security Checks Run"
          shouldAnimate={shouldAnimate}
        />
        <StatItem
          value={data.avgScoreImprovement}
          label="Avg. Score Improvement"
          shouldAnimate={shouldAnimate}
          isPercentage
        />
      </div>
    </section>
  );
}
