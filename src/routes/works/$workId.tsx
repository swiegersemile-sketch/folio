import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MandateList } from "@/components/folio/mandates";
import { PacketButtons } from "@/components/folio/packets";
import { PortalDesks } from "@/components/folio/portal-desks";
import { Page, Wordmark } from "@/components/folio/shell";
import { buttonClass, StatusPill } from "@/components/folio/ui";
import { cn } from "@/lib/folio/cn";
import {
  blankWork,
  deriveStatus,
  listAnd,
  lodgingPacket,
  mandatesReady,
  newId,
  societyName,
  tryLodge,
  waitingNames,
  type Work,
} from "@/lib/folio/model";
import { previewPathPrefix } from "@/lib/preview-path-prefix";
import { useDesk } from "@/lib/folio/store";

export const Route = createFileRoute("/works/$workId")({
  component: WorkPage,
});

function WorkPage() {
  const { workId } = Route.useParams();
  const navigate = useNavigate();
  const work = useDesk((state) => state.works.find((item) => item.id === workId));
  const saveWork = useDesk((state) => state.saveWork);
  const removeWork = useDesk((state) => state.removeWork);
  const [copied, setCopied] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (removed) {
    return (
      <Page width="sheet">
        <Wordmark />
        <h1 className="mt-8 font-serif text-4xl">Draft removed.</h1>
        <Link to="/" className={cn(buttonClass("brass"), "mt-6")}>
          Back to the desk
        </Link>
      </Page>
    );
  }

  if (!work) {
    return (
      <Page width="sheet">
        <Wordmark />
        <h1 className="mt-8 font-serif text-4xl">That work is not on this desk.</h1>
        <Link to="/" className={cn(buttonClass("line"), "mt-6")}>
          Back to the desk
        </Link>
      </Page>
    );
  }

  const status = deriveStatus(work);
  const filed = status === "filed";
  const waiting = waitingNames(work);
  const disputed = work.confirmations.filter((item) => item.status === "disputed");

  function onMandates(next: Work) {
    saveWork(next.sentAt ? tryLodge(next) : next);
  }

  async function copyPacket() {
    const text = lodgingPacket(work as Work);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Page width="sheet">
      <div className="flex items-center justify-between gap-4">
        <Wordmark />
        {!filed ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass("line")}
              onClick={() => {
                const blank = blankWork(work.writers.find((writer) => writer.isRegistrar)?.name || "Writer");
                const next = {
                  ...blank,
                  writers: work.writers.map((writer) => ({ ...writer, id: newId() })),
                  publishers: work.publishers.map((publisher) => ({ ...publisher, id: newId() })),
                  recording: {
                    ...work.recording,
                    isrc: "",
                    musicians: (work.recording.musicians ?? []).map((musician) => ({ ...musician, id: newId() })),
                  },
                  mandates: work.mandates,
                  title: "",
                  altTitle: "",
                };
                saveWork(next);
                void navigate({ to: "/register", search: { id: next.id, step: 0 } });
              }}
            >
              Same people, new song
            </button>
            <Link to="/register" search={{ id: work.id, step: 0 }} className={buttonClass("line")}>
              Revise
            </Link>
          </div>
        ) : null}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <StatusPill status={status} />
        {filed ? <Seal /> : null}
      </div>
      <div className="mt-8">
        <h2 className="font-serif text-3xl text-paper">Portal layout</h2>
        <div className="mt-4">
          <PortalDesks work={work} />
        </div>
      </div>

      {status === "awaiting" ? (
        <section className="mt-8">
          <h2 className="font-serif text-3xl text-paper">Letters</h2>
          <p className="mt-2 text-mist">Waiting on {listAnd(waiting)}. Open a letter to sign as that person. In production, this link is the email.</p>
          <ul className="mt-4 space-y-3">
            {work.confirmations.map((item) => (
              <li key={item.token} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-4">
                <div>
                  <p className="font-medium text-paper">{item.name}</p>
                  <p className="text-sm text-mist">
                    {item.email} · {item.status === "confirmed" ? "Signed" : item.status === "disputed" ? "Flagged" : "Not yet"}
                  </p>
                </div>
                {item.status === "pending" ? (
                  <div className="flex flex-wrap gap-2">
                    <Link to="/sign/$token" params={{ token: item.token }} className={buttonClass("brass")}>
                      Sign as {item.name}
                    </Link>
                    <button
                      type="button"
                      className={buttonClass("line")}
                      onClick={() => {
                        const prefix = previewPathPrefix(window.location.hostname, window.location.pathname) ?? "";
                        void navigator.clipboard.writeText(`${window.location.origin}${prefix}/sign/${item.token}`);
                      }}
                    >
                      Copy link
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {disputed.length > 0 && !filed ? (
        <section className="mt-8 rounded-md border border-brass p-4">
          <h2 className="font-serif text-2xl">Split flagged</h2>
          {disputed.map((item) => (
            <p key={item.token} className="mt-2 text-sm text-mist">
              {item.name}: {item.note || "No note was left."}
            </p>
          ))}
          <Link to="/register" search={{ id: work.id, step: 1 }} className={cn(buttonClass("brass"), "mt-4")}>
            Revise the shares
          </Link>
        </section>
      ) : null}

      {filed ? (
        <section className="mt-8">
          <h2 className="font-serif text-3xl text-paper">Desk references</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {work.filings.map((filing) => (
              <li key={filing.society} className="flex items-center justify-between gap-3 py-3">
                <span className="text-paper">{societyName(filing.society)}</span>
                <span className="font-medium text-brass tabular-nums">{filing.reference}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-mist">
            These are Folio desk references for a complete, signed notification. Each society still has to accept the work onto its own register. Folio does not pretend the portal has already done that.
          </p>
        </section>
      ) : null}

      {!filed && status === "ready" && !mandatesReady(work) ? (
        <p className="mt-6 text-sm text-brass">Signatures are in. Restore the mandates below and Folio will lodge.</p>
      ) : null}

      <section className="mt-8">
        <h2 className="font-serif text-3xl text-paper">Mandates</h2>
        <div className="mt-4">
          <MandateList work={work} locked={filed} onChange={filed ? undefined : onMandates} />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl text-paper">Notification</h2>
          <button type="button" className={buttonClass("line")} onClick={() => void copyPacket()}>
            {copied ? "Copied" : "Copy packet"}
          </button>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-panel p-4 text-sm whitespace-pre-wrap text-mist">
          {lodgingPacket(work)}
        </pre>
        <PacketButtons work={work} />
        <p className="mt-3 text-sm text-mist">
          The CWR is a draft in the society file shape. CAPASSO still has to approve who sends it. Nothing here is submitted.
        </p>
      </section>

      {status === "draft" ? (
        <button
          type="button"
          className={cn(buttonClass("quiet"), "mt-6 px-0")}
          onClick={() => {
            removeWork(work.id);
            setRemoved(true);
          }}
        >
          Remove this draft
        </button>
      ) : null}
    </Page>
  );
}

function Seal() {
  return (
    <span className="seal-in inline-flex size-16 items-center justify-center rounded-full border border-brass font-serif text-xs tracking-widest text-brass uppercase">
      Lodged
    </span>
  );
}
