import { format, parseISO } from "date-fns";
import { partLabel, roleLabel, shareTotal, type Work } from "@/lib/folio/model";
import { SplitBar } from "@/components/folio/ui";

function prettyDay(value: string): string {
  if (!value) return "Date not set";
  const date = value.length === 10 ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "d MMM yyyy");
}

export function WorkSummary({ work }: { work: Work }) {
  const segments = [
    ...work.writers.map((writer) => ({ id: writer.id, label: writer.name || "Writer", performing: writer.performing })),
    ...work.publishers.map((publisher) => ({
      id: publisher.id,
      label: publisher.name || "Publisher",
      performing: publisher.performing,
    })),
  ];
  const mechanical = shareTotal(work, "mechanical");

  return (
    <div>
      <h2 className="font-serif text-4xl text-paper">{work.title.trim() || "Untitled work"}</h2>
      {work.altTitle.trim() ? <p className="mt-1 text-mist">Also known as {work.altTitle.trim()}</p> : null}
      <p className="mt-2 text-sm text-mist">
        {work.language} · {work.genre} · written {prettyDay(work.writtenOn)} · {work.territory}
        {work.iswc.trim() ? ` · ISWC ${work.iswc.trim()}` : ""}
      </p>
      <div className="mt-5">
        <SplitBar segments={segments} />
        <p className="mt-1 text-sm tabular-nums text-mist">
          {mechanical === 100 ? "Mechanical shares balanced" : `Mechanical shares ${mechanical}%`}
        </p>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-mist">
            <tr>
              <th className="py-2 pr-3 font-medium">Party</th>
              <th className="px-3 py-2 text-right font-medium">Performing</th>
              <th className="py-2 pl-3 text-right font-medium">Mechanical</th>
            </tr>
          </thead>
          <tbody>
            {work.writers.map((writer) => (
              <tr key={writer.id} className="border-t border-line">
                <td className="py-3 pr-3">
                  <span className="text-paper">{writer.name || "Unnamed writer"}</span>
                  <span className="mt-0.5 block text-mist">
                    {roleLabel(writer.role)}
                    {writer.isRegistrar ? " · registering" : ""}
                  </span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-paper">{writer.performing}%</td>
                <td className="py-3 pl-3 text-right tabular-nums text-paper">{writer.mechanical}%</td>
              </tr>
            ))}
            {work.publishers.map((publisher) => (
              <tr key={publisher.id} className="border-t border-line">
                <td className="py-3 pr-3">
                  <span className="text-paper">{publisher.name || "Unnamed publisher"}</span>
                  <span className="mt-0.5 block text-mist">Publisher</span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-paper">{publisher.performing}%</td>
                <td className="py-3 pl-3 text-right tabular-nums text-paper">{publisher.mechanical}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 rounded-md border border-line bg-panel p-4">
        <p className="text-xs tracking-widest text-brass uppercase">Recording</p>
        {work.recording.hasRecording ? (
          <div className="mt-2">
            <p className="font-serif text-2xl tracking-wide text-paper tabular-nums">{work.recording.isrc || "ISRC missing"}</p>
            <p className="mt-1 text-sm text-mist">
              {work.recording.artist || "Artist not set"}
              {work.recording.label ? ` · ${work.recording.label}` : ""}
              {work.recording.duration ? ` · ${work.recording.duration}` : ""}
            </p>
            {(work.recording.musicians ?? []).length > 0 ? (
              <p className="mt-2 text-sm text-mist">
                {(work.recording.musicians ?? [])
                  .map((musician) => `${musician.name || "Unnamed"} · ${partLabel(musician)}`)
                  .join(", ")}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-mist">No master yet. SAMPRA stays out of this lodging.</p>
        )}
      </div>
    </div>
  );
}
