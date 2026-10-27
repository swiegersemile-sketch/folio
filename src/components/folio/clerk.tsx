import { useState } from "react";
import { askDesk, type DeskTurn } from "@/lib/folio/clerk";
import { deriveStatus, partLabel, roleCode, type Work } from "@/lib/folio/model";
import { buttonClass, fieldClass } from "@/components/folio/ui";

const STARTERS = ["What is still unsigned?", "Where does a producer go?"];

function snapshotOf(works: Work[]): string {
  if (works.length === 0) return "No works on the desk.";
  return works
    .map((work) => {
      const writers = work.writers
        .map((writer) => `${writer.name || "Unnamed"} ${roleCode(writer.role)} PR ${writer.performing} MR ${writer.mechanical}`)
        .join("; ");
      const publishers = work.publishers.length
        ? work.publishers.map((publisher) => `${publisher.name} E PR ${publisher.performing} MR ${publisher.mechanical}`).join("; ")
        : "none";
      const musicians = (work.recording.musicians ?? [])
        .map((musician) => `${musician.name || "Unnamed"} ${partLabel(musician)} ${musician.status}`)
        .join("; ");
      const filings = work.filings.length
        ? work.filings.map((filing) => `${filing.society} ${filing.reference}`).join("; ")
        : "not lodged";
      return [
        work.title || "Untitled",
        `status ${deriveStatus(work)}`,
        `writers ${writers}`,
        `publishers ${publishers}`,
        work.recording.hasRecording
          ? `recording ${work.recording.artist || "unnamed"} ISRC ${work.recording.isrc || "missing"} ${musicians ? `musicians ${musicians}` : "no extra musicians"}`
          : "no recording",
        filings,
      ].join(" | ");
    })
    .join("\n");
}

export function DeskClerk({ works }: { works: Work[] }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<DeskTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function send(text: string) {
    const next = text.trim();
    if (!next || pending) return;
    setQuestion("");
    setError("");
    setPending(true);
    const history = turns.slice(-6);
    setTurns((current) => [...current, { role: "user", text: next }]);
    try {
      const result = await askDesk({ data: { question: next, history, snapshot: snapshotOf(works) } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTurns((current) => [...current, { role: "assistant", text: result.text }]);
    } catch {
      setError("Grok could not answer just now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-8 rounded-md border border-line bg-panel p-5">
      <p className="text-xs tracking-widest text-brass uppercase">Grok on the desk</p>
      <h2 className="mt-2 font-serif text-3xl text-paper">Ask about a work</h2>
      <p className="mt-2 max-w-2xl text-sm text-mist">
        Grok can read the songs on this desk. It does not sign into SAMRO, CAPASSO, or SAMPRA.
      </p>
      {turns.length > 0 ? (
        <ol className="mt-4 space-y-3">
          {turns.map((turn, index) => (
            <li key={`${turn.role}-${index}`} className="border-t border-line pt-3">
              <p className="text-xs tracking-widest text-mist uppercase">{turn.role === "user" ? "You" : "Grok"}</p>
              <p className="mt-1 whitespace-pre-wrap text-paper">{turn.text}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {error ? <p className="mt-3 text-sm text-brass">{error}</p> : null}
      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          void send(question);
        }}
      >
        <label className="block">
          <span className="sr-only">Question for Grok</span>
          <textarea
            className={fieldClass}
            rows={2}
            value={question}
            maxLength={500}
            placeholder="Which shares are still waiting?"
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="submit" className={buttonClass("brass")} disabled={pending || !question.trim()}>
            {pending ? "Asking…" : "Ask Grok"}
          </button>
          {STARTERS.map((starter) => (
            <button key={starter} type="button" className={buttonClass("line")} disabled={pending} onClick={() => void send(starter)}>
              {starter}
            </button>
          ))}
        </div>
      </form>
    </section>
  );
}
