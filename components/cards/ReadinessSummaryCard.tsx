import { cardSurface } from "./shared";

export function ReadinessSummaryCard({
  daysLeft,
  readinessScore,
}: {
  daysLeft: number;
  readinessScore: number;
}) {
  const circleRadius = 54;
  const circumference = 2 * Math.PI * circleRadius;
  const progress = Math.max(0, Math.min(100, readinessScore));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <section
      className={`${cardSurface("relative flex flex-col overflow-hidden px-5 py-5 text-[#f7f4ea]")} readiness-card-shell`}
    >
      <div className="relative z-10 mx-auto mt-6 h-40 w-40 sm:h-48 sm:w-48 xl:h-full xl:w-full">
        <svg
          className="absolute inset-0 h-full w-full -rotate-90 drop-shadow-lg"
          viewBox="0 0 140 140"
        >
          <circle
            cx="70"
            cy="70"
            r={circleRadius}
            fill="none"
            stroke="color-mix(in srgb, var(--accent) 16%, transparent)"
            strokeWidth="12"
          />
          <circle
            cx="70"
            cy="70"
            r={circleRadius}
            fill="none"
            stroke="var(--accent)"
            strokeLinecap="round"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-[color:var(--trip-card-muted-text)]">Days left</p>
          <p className="mt-1 text-[2.45rem] font-semibold leading-none tracking-[-0.08em] sm:text-[3rem]">
            {daysLeft}
          </p>
        </div>
      </div>
    </section>
  );
}
