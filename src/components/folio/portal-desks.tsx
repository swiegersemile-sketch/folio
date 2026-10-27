import type { ReactNode } from "react";
import { partLabel, roleCode, roleLabel, societiesFor, type Work } from "@/lib/folio/model";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 border-t border-line py-2 text-sm">
      <dt className="text-mist">{label}</dt>
      <dd className="text-paper">{value || "—"}</dd>
    </div>
  );
}

function Screen({
  kicker,
  path,
  children,
}: {
  kicker: string;
  path: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-line bg-panel">
      <header className="border-b border-line px-4 py-3">
        <p className="text-xs tracking-widest text-brass uppercase">{kicker}</p>
        <p className="mt-1 text-sm text-mist">{path}</p>
      </header>
      <div className="px-4 py-2">{children}</div>
    </section>
  );
}

export function PortalDesks({ work }: { work: Work }) {
  const duration = work.recording.duration || "—";

  const open = societiesFor(work);

  return (
    <div className="space-y-4">
      <p className="text-sm text-mist">Only the societies this song opened. Nothing here is submitted.</p>
      <Screen kicker="SAMRO" path="My Music → New notification">
        <dl>
          <Row label="Registration type" value={work.registrationType === "OU" ? "OU · Publisher, local" : "CTB · Composer/author, local"} />
          <Row label="Assignment music" value="No" />
          <Row label="Title of work" value={work.title} />
          <Row label="Alternative title" value={work.altTitle} />
          <Row label="Duration" value={duration} />
          <Row label="Text" value={work.textKind} />
          <Row label="Genre" value={work.catalogue} />
          <Row label="Type of music" value={work.genre} />
          <Row label="Performing artist" value={work.recording.artist} />
          <Row label="Instrumentation" value={work.instrumentation} />
        </dl>
        <p className="mt-4 text-xs tracking-widest text-mist uppercase">Share information</p>
        <ul className="mt-1">
          {work.writers.map((writer) => (
            <li key={writer.id} className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-line py-2 text-sm">
              <span className="text-paper">{writer.name || "Unnamed"}</span>
              <span className="text-mist">{roleCode(writer.role)}</span>
              <span className="tabular-nums text-paper">PR {writer.performing}%</span>
            </li>
          ))}
          {work.publishers.map((publisher) => (
            <li key={publisher.id} className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-line py-2 text-sm">
              <span className="text-paper">{publisher.name || "Publisher"}</span>
              <span className="text-mist">E</span>
              <span className="tabular-nums text-paper">PR {publisher.performing}%</span>
            </li>
          ))}
        </ul>
      </Screen>
      {open.includes("capasso") ? (
      <Screen kicker="CAPASSO" path="Music works → Add musical work">
        <dl>
          <Row label="ISWC" value={work.iswc || "Leave blank"} />
          <Row label="Version type" value="Original" />
          <Row label="Music usage" value="General usage" />
          <Row label="Territory" value={work.capassoTerritory} />
          <Row label="Lyric adaptation" value="Blank" />
          <Row label="Arrangement" value="Blank" />
          <Row label="Library" value="No" />
        </dl>
        <p className="mt-4 text-xs tracking-widest text-mist uppercase">Writers in work</p>
        <ul className="mt-1">
          {work.writers.map((writer) => (
            <li key={writer.id} className="border-t border-line py-2 text-sm">
              <p className="text-paper">{writer.name || "Unnamed"}</p>
              <p className="text-mist">
                {roleLabel(writer.role)} · copyright {writer.mechanical}% · MR {writer.mechanical}% · PR {writer.performing}% · MR society CAPASSO · PR society SAMRO
              </p>
            </li>
          ))}
          <li className="border-t border-line py-2 text-sm text-mist">
            {work.publishers.length
              ? `Original publisher · ${work.publishers.map((publisher) => `${publisher.name} · MR ${publisher.mechanical}%`).join("; ")}`
              : "Original publisher · none"}
          </li>
        </ul>
        {work.recording.hasRecording ? (
          <dl className="mt-2">
            <Row label="Recording title" value={work.title} />
            <Row label="Version" value={work.recording.versionTitle || work.title} />
            <Row label="ISRC" value={work.recording.isrc} />
          </dl>
        ) : null}
      </Screen>
      ) : null}
      {open.includes("sampra") ? (
      <Screen kicker="SAMPRA" path="Who made it with you">
          <dl>
            <Row label="Recording artist" value={work.recording.artist} />
            <Row label="Track title" value={work.title} />
            <Row label="ISRC" value={work.recording.isrc} />
            <Row label="Record label" value={work.recording.label} />
          </dl>
          <p className="mt-4 text-xs tracking-widest text-mist uppercase">The people</p>
          <ul>
            {work.recording.musicians.map((musician) => (
              <li key={musician.id} className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-line py-2 text-sm">
                <span className="text-paper">{musician.name || "Unnamed"}</span>
                <span className="text-mist">{partLabel(musician)}</span>
                <span className="text-paper">{musician.status}</span>
              </li>
            ))}
          </ul>
      </Screen>
      ) : null}
    </div>
  );
}
