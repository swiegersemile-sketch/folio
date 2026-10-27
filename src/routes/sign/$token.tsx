import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Page, Wordmark } from "@/components/folio/shell";
import { buttonClass } from "@/components/folio/ui";
import { cn } from "@/lib/folio/cn";
import { listAnd, roleLabel, societyName, societiesFor, waitingNames, type Confirmation, type Work } from "@/lib/folio/model";
import { useDesk } from "@/lib/folio/store";

export const Route = createFileRoute("/sign/$token")({
  component: SignPage,
});

function findLetter(works: Work[], token: string): { work: Work; confirmation: Confirmation } | null {
  for (const work of works) {
    const confirmation = work.confirmations.find((item) => item.token === token);
    if (confirmation) return { work, confirmation };
  }
  return null;
}

function SignPage() {
  const { token } = Route.useParams();
  const works = useDesk((state) => state.works);
  const respond = useDesk((state) => state.respond);
  const found = findLetter(works, token);
  const [note, setNote] = useState("");
  const [disputing, setDisputing] = useState(false);

  if (!found) {
    return (
      <Page width="letter">
        <Wordmark />
        <h1 className="mt-10 font-serif text-4xl">This letter is not on the desk.</h1>
        <p className="mt-3 text-mist">Signature links belong to the catalogue in this browser. Ask the registrar to send it again from their desk.</p>
        <Link to="/" className={cn(buttonClass("line"), "mt-6")}>
          Folio desk
        </Link>
      </Page>
    );
  }

  const { work, confirmation } = found;
  const share = shareFor(work, confirmation);
  const locked = work.filings.length > 0;
  const othersWaiting = waitingNames(work).filter((name) => name !== confirmation.name);
  const next = work.confirmations.find((item) => item.status === "pending" && item.token !== token);

  return (
    <Page width="letter">
      <Wordmark />
      <p className="mt-10 text-xs tracking-widest text-brass uppercase">
        {confirmation.status === "pending" ? "Signature requested" : confirmation.status === "confirmed" ? "Signed" : "Flagged"}
      </p>
      <h1 className="mt-2 font-serif text-4xl text-paper">{work.title}</h1>
      <p className="mt-3 text-mist">
        {registrarName(work)} is registering this work and named you as {confirmation.kind === "publisher" ? "publisher" : roleLabel(share.role)}.
      </p>
      <p className="mt-6 text-sm text-mist">Your share</p>
      <div className="mt-2 grid grid-cols-2 gap-4">
        <p>
          <span className="block font-serif text-5xl text-brass tabular-nums">{share.performing}%</span>
          <span className="text-sm text-mist">Performing</span>
        </p>
        <p>
          <span className="block font-serif text-5xl text-brass tabular-nums">{share.mechanical}%</span>
          <span className="text-sm text-mist">Mechanical</span>
        </p>
      </div>
      <p className="mt-6 text-sm text-mist">Everyone on the work</p>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {work.writers.map((writer) => (
          <li key={writer.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className={writer.id === confirmation.partyId ? "text-paper" : "text-mist"}>{writer.name}</span>
            <span className="tabular-nums text-mist">
              {writer.performing}% · {writer.mechanical}%
            </span>
          </li>
        ))}
        {work.publishers.map((publisher) => (
          <li key={publisher.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className={publisher.id === confirmation.partyId ? "text-paper" : "text-mist"}>{publisher.name}</span>
            <span className="tabular-nums text-mist">
              {publisher.performing}% · {publisher.mechanical}%
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-mist">
        Lodging to {societiesFor(work).map(societyName).join(", ")}
        {work.recording.hasRecording && work.recording.isrc ? ` · ISRC ${work.recording.isrc}` : ""}.
      </p>

      <div className="mt-8" aria-live="polite">
        {confirmation.status === "confirmed" && locked ? (
          <div>
            <p className="font-serif text-2xl text-paper">Signed, and the work is lodged.</p>
            <ul className="mt-3 space-y-1 text-sm text-brass tabular-nums">
              {work.filings.map((filing) => (
                <li key={filing.society}>
                  {societyName(filing.society)} {filing.reference}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {confirmation.status === "confirmed" && !locked ? (
          <p className="font-serif text-2xl text-paper">
            Signed.{othersWaiting.length > 0 ? ` Still waiting on ${listAnd(othersWaiting)}.` : ""}
          </p>
        ) : null}
        {confirmation.status === "disputed" ? (
          <p className="font-serif text-2xl text-paper">You flagged this share. The registrar has to revise it before anyone can lodge.</p>
        ) : null}
        {confirmation.note ? <p className="mt-2 text-sm text-mist">{confirmation.note}</p> : null}
      </div>

      {!locked && confirmation.status === "pending" && !disputing ? (
        <div className="mt-8 flex flex-col gap-3">
          <button type="button" className={buttonClass("brass")} onClick={() => respond(token, "confirmed", "")}>
            Confirm my share
          </button>
          <button type="button" className={buttonClass("line")} onClick={() => setDisputing(true)}>
            This isn't right
          </button>
        </div>
      ) : null}

      {!locked && disputing && confirmation.status === "pending" ? (
        <form
          className="mt-8"
          onSubmit={(event) => {
            event.preventDefault();
            respond(token, "disputed", note);
          }}
        >
          <label className="block text-sm text-mist">
            What should change?
            <textarea
              className="mt-1 min-h-28 w-full rounded-md border border-line bg-panel px-3 py-3 text-base text-paper"
              value={note}
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="submit" className={buttonClass("brass")}>
              Send the flag
            </button>
            <button type="button" className={buttonClass("quiet")} onClick={() => setDisputing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {!locked && confirmation.status !== "pending" ? (
        <button
          type="button"
          className={cn(buttonClass("quiet"), "mt-6 px-0")}
          onClick={() => respond(token, confirmation.status === "confirmed" ? "disputed" : "confirmed", note)}
        >
          {confirmation.status === "confirmed" ? "Change to a flag" : "Confirm instead"}
        </button>
      ) : null}

      <div className="mt-8 flex flex-col gap-3">
        {next ? (
          <Link to="/sign/$token" params={{ token: next.token }} className={buttonClass("brass")}>
            Sign as {next.name}
          </Link>
        ) : null}
        <Link to="/works/$workId" params={{ workId: work.id }} className={buttonClass("line")}>
          Open the work
        </Link>
      </div>
    </Page>
  );
}

function registrarName(work: Work): string {
  return work.writers.find((writer) => writer.isRegistrar)?.name || "The registrar";
}

function shareFor(work: Work, confirmation: Confirmation): { performing: number; mechanical: number; role: "composer-author" | "author" | "composer" | "arranger" | "translator" } {
  if (confirmation.kind === "writer") {
    const writer = work.writers.find((item) => item.id === confirmation.partyId);
    return { performing: writer?.performing ?? 0, mechanical: writer?.mechanical ?? 0, role: writer?.role ?? "author" };
  }
  const publisher = work.publishers.find((item) => item.id === confirmation.partyId);
  return { performing: publisher?.performing ?? 0, mechanical: publisher?.mechanical ?? 0, role: "author" };
}
