import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Flame } from "lucide-react";
import { getWeeklyJournalRecap, type WeeklyRecap } from "@/lib/journal-recap.functions";

export function WeeklyRecapCard() {
  const fn = useServerFn(getWeeklyJournalRecap);
  const { data } = useQuery<WeeklyRecap>({
    queryKey: ["journal-weekly-recap"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });
  if (!data || data.entryCount === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow text-muted-foreground">Last 7 days</p>
          <p className="mt-1 font-serif text-lg text-foreground">
            {data.entryCount} {data.entryCount === 1 ? "entry" : "entries"}
            {data.streakDays > 1 && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-sans text-muted-foreground">
                <Flame className="h-3 w-3" /> {data.streakDays}-day streak
              </span>
            )}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <Stat label="Voice notes" value={data.voiceCount} />
            <Stat label="Seizures" value={data.seizureCount} />
            <Stat label="Missed doses" value={data.missedDoses} />
          </div>

          {data.triggers.length > 0 && (
            <div className="mt-4">
              <p className="label-eyebrow text-muted-foreground">Mentioned often</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.triggers.map((t) => (
                  <span
                    key={t.key}
                    className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-foreground"
                  >
                    {t.label} · {t.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.topTags.length > 0 && (
            <div className="mt-3">
              <p className="label-eyebrow text-muted-foreground">Top tags</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.topTags.map((t) => (
                  <span
                    key={t.tag}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {t.tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link
            to="/journal"
            className="mt-4 inline-block text-xs text-muted-foreground underline underline-offset-2 hover:no-underline"
          >
            Open journal →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-serif text-xl tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-muted-foreground">{label}</p>
    </div>
  );
}