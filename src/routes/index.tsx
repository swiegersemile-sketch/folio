import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DeskClerk } from "@/components/folio/clerk";
import { Gate } from "@/components/folio/gate";
import { Page } from "@/components/folio/shell";
import { buttonClass, SplitBar } from "@/components/folio/ui";
import { cn } from "@/lib/folio/cn";
import { deriveStatus, listAnd, societiesFor, waitingNames, type Work } from "@/lib/folio/model";
import { useDesk } from "@/lib/folio/store";

export const Route = createFileRoute("/")({
  component: Home,
});

const STEPS = [
  { title: "Who wrote it?", body: "Names and splits. That is SAMRO.", tone: "text-samro" },
  { title: "Already registered?", body: "A new recording collapses SAMRO and opens CAPASSO and SAMPRA.", tone: "text-capasso" },
  { title: "Is it recorded?", body: "Under the SAMRO form. Yes opens CAPASSO and SAMPRA on the same page.", tone: "text-sampra" },
];

const GROUPS = [
  {
    id: "draft",
    title: "Drafts",
    note: "Started, not sent.",
    rule: "border-line",
    titleClass: "text-paper",
  },
  {
    id: "awaiting",
    title: "Awaiting signatures",
    note: "Sent. Still waiting on someone.",
    rule: "border-sampra",
    titleClass: "text-sampra",
  },
  {
    id: "filed",
    title: "Lodged",
    note: "The packet is ready.",
    rule: "border-capasso",
    titleClass: "text-capasso",
  },
] as const;

function groupOf(work: Work) {
  const status = deriveStatus(work);
  if (status === "filed") return "filed";
  if (status === "draft") return "draft";
  return "awaiting";
}

function Home() {
  const admitted = useDesk((state) => state.admitted);
  const works = useDesk((state) => state.works);
  const resetSamples = useDesk((state) => state.resetSamples);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((current) => ({ [id]: !current[id] }));
  const ordered = works.slice().sort((a, b) => a.title.localeCompare(b.title));
  const demo = works.find((work) => work.id === "work-table-mountain");
  const showDemo = demo ? deriveStatus(demo) === "awaiting" : false;

  if (!admitted) return <Gate />;

  return (
    <Page>
      <header>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <img src="/folio-mark-v3.jpg" alt="" className="mb-4 w-full max-w-xl rounded-md" />
            <h1 className="font-serif text-4xl text-paper md:text-5xl">
              Register your rights<sup className="text-brass">*</sup>
            </h1>
            <p className="mt-2 text-sm text-mist">* Only if you are a member of SAMRO, CAPASSO, or SAMPRA.</p>
          </div>
          <Link to="/register" search={{ step: 0 }} className={buttonClass("brass")}>
            Register a work
          </Link>
        </div>
        <nav className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          {GROUPS.map((group) => {
            const count = ordered.filter((work) => groupOf(work) === group.id).length;
            const expanded = Boolean(open[group.id]);
            return (
              <button
                key={group.id}
                type="button"
                className={cn(buttonClass(expanded ? "brass" : "line"), "min-h-11")}
                aria-expanded={expanded}
                onClick={() => toggle(group.id)}
              >
                {group.title} {count}
              </button>
            );
          })}
        </nav>
        {GROUPS.map((group) => {
          if (!open[group.id]) return null;
          const items = ordered.filter((work) => groupOf(work) === group.id);
          return (
            <div key={group.id} className="mt-4">
              <p className="text-sm text-mist">{group.note}</p>
              {items.length === 0 ? (
                <p className="mt-3 text-sm text-mist">None.</p>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {items.map((work) => (
                    <WorkCard key={work.id} work={work} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </header>
      <p className="mt-4 max-w-2xl text-mist">
        SAMRO stays open unless the song is already registered. A recorded song opens CAPASSO and SAMPRA on the same page.
      </p>
      <ol className="mt-8 grid gap-6 border-t border-line pt-6 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <p className={`font-serif text-lg ${step.tone}`}>{index + 1}</p>
            <h2 className="mt-1 font-medium text-paper">{step.title}</h2>
            <p className="mt-1 text-sm text-mist">{step.body}</p>
          </li>
        ))}
      </ol>
      {showDemo && demo ? (
        <section className="mt-8 border-t-4 border-brass pt-2">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
            aria-expanded={Boolean(open.demo)}
            onClick={() => toggle("demo")}
          >
            <span className="font-serif text-2xl text-paper">Table Mountain After Rain</span>
            <span className="text-sm text-mist">{open.demo ? "Close" : "Open"}</span>
          </button>
          {open.demo ? (
            <div className="mt-3">
              <p className="text-mist">
                Waiting on {listAnd(waitingNames(demo))}. Open each letter, confirm the share, and the work lodges itself.
              </p>
              <Link to="/works/$workId" params={{ workId: demo.id }} className={cn(buttonClass("brass"), "mt-4")}>
                Open the work
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}
      <DeskClerk works={works} />
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="max-w-xl text-sm text-mist">
          Folio keeps the notification, the mandate, and the signature trail. SAMRO, CAPASSO, and SAMPRA still accept each work onto their own registers.
        </p>
        <button type="button" className={buttonClass("quiet")} onClick={resetSamples}>
          Restore examples
        </button>
      </footer>
    </Page>
  );
}

function WorkCard({ work }: { work: Work }) {
  const status = deriveStatus(work);
  const waiting = waitingNames(work);
  const segments = [
    ...work.writers.map((writer) => ({ id: writer.id, label: writer.name, performing: writer.performing })),
    ...work.publishers.map((publisher) => ({ id: publisher.id, label: publisher.name, performing: publisher.performing })),
  ];
  const line =
    status === "filed"
      ? work.filings.map((filing) => filing.reference).join(" · ")
      : status === "awaiting"
        ? `Waiting on ${listAnd(waiting)}`
        : status === "disputed"
          ? "A collaborator flagged the split"
          : status === "draft"
            ? "Not sent yet"
            : "Signatures are in";

  return (
    <Link
      to="/works/$workId"
      params={{ workId: work.id }}
      className="block rounded-md border border-line bg-panel p-5 transition-colors hover:border-brass"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-2xl text-paper">{work.title}</h3>
      </div>
      <p className="mt-1 text-sm text-mist">
        {work.genre} · {work.language}
      </p>
      <div className="mt-4">
        <SplitBar segments={segments} />
      </div>
      <p className="mt-3 text-sm text-mist">{line}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {societiesFor(work).map((id) => (
          <SocietyDot key={id} name={id === "samro" ? "SAMRO" : id === "capasso" ? "CAPASSO" : "SAMPRA"} on={work.mandates[id].granted} />
        ))}
      </div>
    </Link>
  );
}

function SocietyDot({ name, on, offLabel }: { name: string; on: boolean; offLabel?: string }) {
  return (
    <span className={cn("rounded-md border px-2 py-1 text-xs", on ? "border-brass text-brass" : "border-line text-mist")}>
      {name}
      {on ? "" : offLabel ? ` · ${offLabel}` : ""}
    </span>
  );
}
