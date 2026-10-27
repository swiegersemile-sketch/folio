import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MandateList } from "@/components/folio/mandates";
import { PortalDesks } from "@/components/folio/portal-desks";
import { Page, Wordmark } from "@/components/folio/shell";
import { buttonClass, ErrorList, Field, SelectInput, TextInput } from "@/components/folio/ui";
import { cn } from "@/lib/folio/cn";
import {
  blankWork,
  canSaveDraft,
  clampShare,
  deriveStatus,
  CAPASSO_TERRITORIES,
  CATALOGUES,
  formatIsrc,
  GENRES,
  INSTRUMENTS,
  LANGUAGES,
  MUSICIAN_PARTS,
  PERFORMER_ROLES,
  REGISTRATION_TYPES,
  TEXT_KINDS,
  newId,
  partiesToSign,
  PROS,
  publisherTakesHalf,
  REGISTRAR_DEFAULT,
  ROLES,
  sendForSignature,
  societiesFor,
  STEP_LABELS,
  stepErrors,
  unpublishedEven,
  type Publisher,
  type Recording,
  type Musician,
  type Work,
  type Writer,
} from "@/lib/folio/model";
import { useDesk } from "@/lib/folio/store";

type LoadState = {
  phase: "load" | "missing" | "filed" | "edit";
  work: Work | null;
};

export function Wizard({ routeId, step }: { routeId?: string; step: number }) {
  const navigate = useNavigate();
  const saveWork = useDesk((state) => state.saveWork);
  const stored = useDesk((state) => state.works.find((item) => item.id === (routeId ?? "")));
  const [state, setState] = useState<LoadState>({ phase: "load", work: null });
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    setState((current) => {
      if (!routeId) {
        if (current.work && current.phase === "edit") return current;
        return { phase: "edit", work: current.work ?? blankWork(REGISTRAR_DEFAULT) };
      }
      if (current.work?.id === routeId && current.phase === "edit") return current;
      const found = useDesk.getState().works.find((item) => item.id === routeId);
      if (!found) return { phase: "missing", work: null };
      if (deriveStatus(found) === "filed") return { phase: "filed", work: found };
      return { phase: "edit", work: found };
    });
  }, [routeId]);

  function go(nextStep: number, id: string, replace: boolean) {
    void navigate({
      to: "/register",
      search: { id, step: nextStep },
      replace,
    });
  }

  if (state.phase === "load" || (state.phase === "edit" && !state.work)) {
    return (
      <Page width="sheet">
        <p className="text-mist">Opening the form…</p>
      </Page>
    );
  }

  if (state.phase === "missing" || !state.work) {
    return (
      <Page width="sheet">
        <Wordmark />
        <h1 className="mt-8 font-serif text-4xl">That draft is not on this desk.</h1>
        <Link to="/" className={cn(buttonClass("line"), "mt-6")}>
          Back to the desk
        </Link>
      </Page>
    );
  }

  if (state.phase === "filed" && state.work) {
    const filed = state.work;
    return (
      <Page width="sheet">
        <Wordmark />
        <h1 className="mt-8 font-serif text-4xl">This work is already lodged.</h1>
        <p className="mt-3 max-w-xl text-mist">Lodged notifications stay as they were signed. Open the receipt instead of editing it.</p>
        <Link to="/works/$workId" params={{ workId: filed.id }} className={cn(buttonClass("brass"), "mt-6")}>
          View the lodging
        </Link>
      </Page>
    );
  }

  const work = state.work;
  const errors = showErrors ? stepErrors(work, step) : [];
  const hadLetters = Boolean(stored?.sentAt && stored.confirmations.length > 0);

  function update(next: Work) {
    setState({ phase: "edit", work: next });
  }

  function persistDraft(next: Work) {
    const draft: Work = { ...next, sentAt: null, confirmations: [], filings: [] };
    saveWork(draft);
    return draft;
  }

  function continueNext() {
    const problems = stepErrors(work, step);
    if (problems.length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    const draft = persistDraft(work);
    update(draft);
    go(Math.min(5, step + 1), draft.id, !routeId);
  }

  function saveAndLeave() {
    if (!canSaveDraft(work)) {
      setShowErrors(true);
      return;
    }
    const draft = persistDraft(work);
    void navigate({ to: "/works/$workId", params: { workId: draft.id } });
  }

  function send() {
    const problems = stepErrors(work, 5);
    if (problems.length > 0) {
      setShowErrors(true);
      return;
    }
    const lodged = sendForSignature(work);
    saveWork(lodged);
    void navigate({ to: "/works/$workId", params: { workId: lodged.id } });
  }

  return (
    <Page width="sheet">
      <div className="flex items-center justify-between gap-4">
        <Wordmark />
        <button type="button" className={buttonClass("quiet")} onClick={saveAndLeave}>
          Save draft
        </button>
      </div>
      <div className="mt-6 h-1 rounded-md bg-panel-2">
        <div className="h-1 rounded-md bg-brass" style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }} />
      </div>
      <p className="mt-3 text-xs tracking-widest text-brass uppercase">
        {STEP_LABELS[step]} · {step + 1} / {STEP_LABELS.length}
      </p>
      {hadLetters ? (
        <p className="mt-4 text-sm text-mist">
          Letters are already out. Saving or sending again withdraws them until everyone is asked to sign the new splits.
        </p>
      ) : null}

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (step >= 5) send();
          else continueNext();
        }}
      >
        {step === 0 ? <WorkStep work={work} onChange={update} /> : null}
        {step === 1 ? <WritersStep work={work} onChange={update} /> : null}
        {step === 2 ? <PublishersStep work={work} onChange={update} /> : null}
        {step === 3 ? <RecordingStep work={work} onChange={update} /> : null}
        {step === 4 ? (
          <div>
            <h1 className="font-serif text-4xl text-paper">Mandate the portals</h1>
            <p className="mt-2 max-w-xl text-mist">
              This is your instruction to lodge. Folio does not sign into SAMRO, CAPASSO, or SAMPRA, and it never asks for those passwords.
            </p>
            <div className="mt-6">
              <MandateList work={work} onChange={update} />
            </div>
          </div>
        ) : null}
        {step === 5 ? <ReviewStep work={work} /> : null}
        <ErrorList errors={errors} />
        <div className="sticky bottom-0 z-10 mt-8 flex flex-wrap gap-3 border-t border-line bg-desk py-4">
          {step > 0 ? (
            <button
              type="button"
              className={buttonClass("line")}
              onClick={() => {
                const draft = persistDraft(work);
                update(draft);
                go(step - 1, draft.id, false);
              }}
            >
              Back
            </button>
          ) : (
            <Link to="/" className={buttonClass("line")}>
              Desk
            </Link>
          )}
          <button type="submit" className={buttonClass("brass", "min-w-40 flex-1 md:flex-none")}>
            {step >= 5 ? (partiesToSign(work).length > 0 ? "Send letters" : "Lodge this work") : "Continue"}
          </button>
        </div>
      </form>
    </Page>
  );
}

function WorkStep({ work, onChange }: { work: Work; onChange: (work: Work) => void }) {
  return (
    <div>
      <h1 className="font-serif text-4xl text-paper">SAMRO · the work</h1>
      <p className="mt-2 max-w-xl text-mist">
        My Music, then New notification. Registration type stays CTB unless a publisher is sending the local work.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Title of work">
          <TextInput value={work.title} onChange={(title) => onChange({ ...work, title })} placeholder="Table Mountain After Rain" />
        </Field>
        <Field label="Alternative title" hint="A subtitle or translation. Optional.">
          <TextInput value={work.altTitle} onChange={(altTitle) => onChange({ ...work, altTitle })} />
        </Field>
        <Field label="Duration" hint="Minutes and seconds, as on the SAMRO screen.">
          <TextInput
            value={work.recording.duration}
            onChange={(duration) => onChange({ ...work, recording: { ...work.recording, duration } })}
            placeholder="3:42"
          />
        </Field>
        <Field label="Registration type">
          <SelectInput
            value={work.registrationType}
            options={REGISTRATION_TYPES}
            onChange={(registrationType) => onChange({ ...work, registrationType: registrationType as Work["registrationType"] })}
          />
        </Field>
        <Field label="Text">
          <SelectInput
            value={work.textKind}
            options={TEXT_KINDS}
            onChange={(textKind) => onChange({ ...work, textKind: textKind as Work["textKind"] })}
          />
        </Field>
        <Field label="Genre">
          <SelectInput
            value={work.catalogue}
            options={CATALOGUES}
            onChange={(catalogue) => onChange({ ...work, catalogue: catalogue as Work["catalogue"] })}
          />
        </Field>
        <Field label="Type of music">
          <SelectInput value={work.genre} options={GENRES} onChange={(genre) => onChange({ ...work, genre })} />
        </Field>
        <Field label="Instrumentation">
          <SelectInput
            value={work.instrumentation}
            options={INSTRUMENTS}
            onChange={(instrumentation) => onChange({ ...work, instrumentation: instrumentation as Work["instrumentation"] })}
          />
        </Field>
        <Field label="Performing artist">
          <TextInput
            value={work.recording.artist}
            onChange={(artist) => onChange({ ...work, recording: { ...work.recording, artist } })}
          />
        </Field>
        <Field label="Language">
          <SelectInput value={work.language} options={LANGUAGES} onChange={(language) => onChange({ ...work, language })} />
        </Field>
        <Field label="Date written">
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-line bg-desk px-3 py-3 text-base text-paper"
            value={work.writtenOn}
            onChange={(event) => onChange({ ...work, writtenOn: event.target.value })}
          />
        </Field>
        <Field label="ISWC" hint="CAPASSO lets you leave this blank.">
          <TextInput value={work.iswc} onChange={(iswc) => onChange({ ...work, iswc })} placeholder="T-000.000.000-0" />
        </Field>
      </div>
    </div>
  );
}

function sharePair(performing: number, mechanical: number, onPerforming: (value: number) => void, onMechanical: (value: number) => void) {
  return (
    <div className="flex gap-3">
      <label className="block text-sm text-mist">
        PR %
        <input
          className="mt-1 w-20 rounded-md border border-line bg-desk px-2 py-3 text-right text-base text-paper tabular-nums"
          inputMode="numeric"
          value={String(performing)}
          onChange={(event) => onPerforming(clampShare(event.target.value))}
        />
      </label>
      <label className="block text-sm text-mist">
        MR %
        <input
          className="mt-1 w-20 rounded-md border border-line bg-desk px-2 py-3 text-right text-base text-paper tabular-nums"
          inputMode="numeric"
          value={String(mechanical)}
          onChange={(event) => onMechanical(clampShare(event.target.value))}
        />
      </label>
    </div>
  );
}

function WritersStep({ work, onChange }: { work: Work; onChange: (work: Work) => void }) {
  function setWriter(id: string, patch: Partial<Writer>) {
    onChange({
      ...work,
      writers: work.writers.map((writer) => (writer.id === id ? { ...writer, ...patch } : writer)),
    });
  }

  function makeRegistrar(id: string) {
    onChange({
      ...work,
      writers: work.writers.map((writer) => ({ ...writer, isRegistrar: writer.id === id })),
    });
  }

  function removeWriter(id: string) {
    const next = work.writers.filter((writer) => writer.id !== id);
    if (!next.some((writer) => writer.isRegistrar) && next[0]) next[0] = { ...next[0], isRegistrar: true };
    onChange({ ...work, writers: next });
  }

  function addWriter() {
    const writer: Writer = {
      id: newId(),
      name: "",
      email: "",
      ipi: "",
      role: "author",
      pro: "SAMRO",
      isRegistrar: false,
      performing: 0,
      mechanical: 0,
    };
    onChange({ ...work, writers: [...work.writers, writer] });
  }

  return (
    <div>
      <h1 className="font-serif text-4xl text-paper">Share information</h1>
      <p className="mt-2 max-w-xl text-mist">
        SAMRO calls this the share step. Role codes are C, A, CA, AR, and AD. PR % is the performing share.
      </p>
      <button type="button" className={cn(buttonClass("quiet"), "mt-4 px-0")} onClick={() => onChange(unpublishedEven(work))}>
        Unpublished — writers share 100%
      </button>
      <div className="mt-4 space-y-4">
        {work.writers.map((writer, index) => (
          <article key={writer.id} className="rounded-md border border-line bg-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-medium text-paper">{writer.isRegistrar ? "Registering writer" : `Co-writer ${index}`}</h2>
              {work.writers.length > 1 ? (
                <button type="button" className={buttonClass("quiet")} onClick={() => removeWriter(writer.id)}>
                  Remove
                </button>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <TextInput value={writer.name} onChange={(name) => setWriter(writer.id, { name })} autoComplete="name" />
              </Field>
              <Field label="Email">
                <TextInput
                  value={writer.email}
                  onChange={(email) => setWriter(writer.id, { email })}
                  inputMode="email"
                  autoComplete="email"
                />
              </Field>
              <Field label="Role code">
                <SelectInput
                  value={writer.role}
                  options={ROLES}
                  onChange={(role) => setWriter(writer.id, { role: role as Writer["role"] })}
                />
              </Field>
              <Field label="PR society">
                <SelectInput
                  value={writer.pro}
                  options={PROS}
                  onChange={(pro) => setWriter(writer.id, { pro: pro as Writer["pro"] })}
                />
              </Field>
              <Field label="IPI number" hint="Optional until SAMRO issues one.">
                <TextInput
                  value={writer.ipi}
                  onChange={(ipi) => setWriter(writer.id, { ipi: ipi.replace(/[^\d]/g, "").slice(0, 11) })}
                  inputMode="numeric"
                />
              </Field>
              {sharePair(
                writer.performing,
                writer.mechanical,
                (performing) => setWriter(writer.id, { performing }),
                (mechanical) => setWriter(writer.id, { mechanical }),
              )}
            </div>
            {!writer.isRegistrar ? (
              <button type="button" className={cn(buttonClass("quiet"), "mt-3 px-0")} onClick={() => makeRegistrar(writer.id)}>
                This writer is registering
              </button>
            ) : null}
          </article>
        ))}
      </div>
      <button type="button" className={cn(buttonClass("line"), "mt-4")} onClick={addWriter}>
        Add a co-writer
      </button>
    </div>
  );
}

function PublishersStep({ work, onChange }: { work: Work; onChange: (work: Work) => void }) {
  function setPublisher(id: string, patch: Partial<Publisher>) {
    onChange({
      ...work,
      publishers: work.publishers.map((publisher) => (publisher.id === id ? { ...publisher, ...patch } : publisher)),
    });
  }

  function setWriterShare(id: string, patch: Partial<Writer>) {
    onChange({
      ...work,
      writers: work.writers.map((writer) => (writer.id === id ? { ...writer, ...patch } : writer)),
    });
  }

  function addPublisher() {
    const publisher: Publisher = {
      id: newId(),
      name: "",
      email: "",
      ipi: "",
      performing: 0,
      mechanical: 0,
    };
    onChange({ ...work, publishers: [...work.publishers, publisher] });
  }

  return (
    <div>
      <h1 className="font-serif text-4xl text-paper">CAPASSO · writers in work</h1>
      <p className="mt-2 max-w-xl text-mist">
        Version stays Original, usage stays General usage. MR % is the mechanical share. A publisher is role E, original publisher.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Territory">
          <SelectInput
            value={work.capassoTerritory}
            options={CAPASSO_TERRITORIES}
            onChange={(capassoTerritory) => onChange({ ...work, capassoTerritory: capassoTerritory as Work["capassoTerritory"] })}
          />
        </Field>
        <p className="text-sm text-mist md:pt-7">Music usage stays General usage. CAPASSO expects that for a normal song.</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        <button type="button" className={buttonClass("quiet")} onClick={() => onChange(publisherTakesHalf(work))} disabled={work.publishers.length === 0}>
          Publisher takes half
        </button>
        <button type="button" className={buttonClass("quiet")} onClick={() => onChange(unpublishedEven(work))}>
          No publisher
        </button>
      </div>
      <div className="mt-6 space-y-3">
        {work.writers.map((writer) => (
          <div key={writer.id} className="flex flex-wrap items-end justify-between gap-3 border-t border-line py-3">
            <p className="font-medium text-paper">{writer.name || "Writer"}</p>
            {sharePair(
              writer.performing,
              writer.mechanical,
              (performing) => setWriterShare(writer.id, { performing }),
              (mechanical) => setWriterShare(writer.id, { mechanical }),
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {work.publishers.map((publisher) => (
          <article key={publisher.id} className="rounded-md border border-line bg-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-medium text-paper">Original publisher · E</h2>
              <button
                type="button"
                className={buttonClass("quiet")}
                onClick={() => onChange({ ...work, publishers: work.publishers.filter((item) => item.id !== publisher.id) })}
              >
                Remove
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Publisher name">
                <TextInput value={publisher.name} onChange={(name) => setPublisher(publisher.id, { name })} />
              </Field>
              <Field label="Rights email">
                <TextInput
                  value={publisher.email}
                  onChange={(email) => setPublisher(publisher.id, { email })}
                  inputMode="email"
                />
              </Field>
              <Field label="Publisher IPI" hint="Optional.">
                <TextInput
                  value={publisher.ipi}
                  onChange={(ipi) => setPublisher(publisher.id, { ipi: ipi.replace(/[^\d]/g, "").slice(0, 11) })}
                  inputMode="numeric"
                />
              </Field>
              {sharePair(
                publisher.performing,
                publisher.mechanical,
                (performing) => setPublisher(publisher.id, { performing }),
                (mechanical) => setPublisher(publisher.id, { mechanical }),
              )}
            </div>
          </article>
        ))}
      </div>
      <button type="button" className={cn(buttonClass("line"), "mt-4")} onClick={addPublisher}>
        Add a publisher
      </button>
    </div>
  );
}

function RecordingStep({ work, onChange }: { work: Work; onChange: (work: Work) => void }) {
  function setRecording(patch: Partial<Recording>) {
    onChange({ ...work, recording: { ...work.recording, ...patch } });
  }

  function setMusician(id: string, patch: Partial<Musician>) {
    setRecording({
      musicians: (work.recording.musicians ?? []).map((musician) => (musician.id === id ? { ...musician, ...patch } : musician)),
    });
  }

  return (
    <div>
      <h1 className="font-serif text-4xl text-paper">SAMPRA · the recording</h1>
      <p className="mt-2 max-w-xl text-mist">
        Notification of recorded performances. FA is the featured artist. OF is a featured guest. NF is a session player.
      </p>
      <label className="mt-5 flex items-start gap-3 text-sm text-paper">
        <input
          type="checkbox"
          className="mt-1 size-4"
          checked={work.recording.hasRecording}
          onChange={(event) => setRecording({ hasRecording: event.target.checked })}
        />
        <span>There is a sound recording to notify.</span>
      </label>
      {work.recording.hasRecording ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="ISRC" hint="Country, registrant, year, designation.">
            <TextInput
              value={work.recording.isrc}
              onChange={(isrc) => setRecording({ isrc: formatIsrc(isrc) })}
              placeholder="ZA-K3M-26-00418"
            />
          </Field>
          <Field label="Recording artist">
            <TextInput value={work.recording.artist} onChange={(artist) => setRecording({ artist })} />
          </Field>
          <Field label="Label" hint="Optional.">
            <TextInput value={work.recording.label} onChange={(label) => setRecording({ label })} />
          </Field>
          <Field label="Album or single">
            <TextInput value={work.recording.album} onChange={(album) => setRecording({ album })} />
          </Field>
          <Field label="Version title" hint="Radio edit, explicit, or the same title.">
            <TextInput value={work.recording.versionTitle} onChange={(versionTitle) => setRecording({ versionTitle })} />
          </Field>
          <Field label="Performer role">
            <SelectInput
              value={work.recording.performerRole}
              options={PERFORMER_ROLES}
              onChange={(performerRole) => setRecording({ performerRole: performerRole as Recording["performerRole"] })}
            />
          </Field>
          <Field label="Distributor" hint="Self-distributed is fine.">
            <TextInput value={work.recording.distributor} onChange={(distributor) => setRecording({ distributor })} />
          </Field>
          <Field label="Release date" hint="Leave blank if it is unreleased.">
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-line bg-desk px-3 py-3 text-base text-paper"
              value={work.recording.releasedOn}
              onChange={(event) => setRecording({ releasedOn: event.target.value })}
            />
          </Field>
        </div>
      ) : (
        <p className="mt-4 text-sm text-mist">You can add a master later. This lodging will be composition only.</p>
      )}
      {work.recording.hasRecording ? (
        <div className="mt-8">
          <h2 className="font-serif text-2xl text-paper">Other musicians</h2>
          <p className="mt-1 max-w-xl text-sm text-mist">
            Drums, guitar, vocals, and anyone else who played on the recording. SAMPRA lists each one.
          </p>
          <div className="mt-4 space-y-4">
            {(work.recording.musicians ?? []).map((musician, index) => (
              <article key={musician.id} className="rounded-md border border-line bg-panel p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-paper">Musician {index + 1}</h3>
                  <button
                    type="button"
                    className={buttonClass("quiet")}
                    onClick={() =>
                      setRecording({ musicians: work.recording.musicians.filter((item) => item.id !== musician.id) })
                    }
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Name">
                    <TextInput
                      value={musician.name}
                      onChange={(name) => setMusician(musician.id, { name })}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Part">
                    <SelectInput
                      value={musician.part}
                      options={MUSICIAN_PARTS}
                      onChange={(part) => setMusician(musician.id, { part: part as Musician["part"] })}
                    />
                  </Field>
                  {musician.part === "Other" ? (
                    <Field label="What they played">
                      <TextInput
                        value={musician.partNote}
                        onChange={(partNote) => setMusician(musician.id, { partNote })}
                        placeholder="Violin, log drum…"
                      />
                    </Field>
                  ) : null}
                  <Field label="SAMPRA status">
                    <SelectInput
                      value={musician.status}
                      options={PERFORMER_ROLES}
                      onChange={(status) => setMusician(musician.id, { status: status as Musician["status"] })}
                    />
                  </Field>
                </div>
              </article>
            ))}
          </div>
          <button
            type="button"
            className={cn(buttonClass("line"), "mt-4")}
            onClick={() =>
              setRecording({
                musicians: [
                  ...(work.recording.musicians ?? []),
                  { id: newId(), name: "", part: "Drums", partNote: "", status: "NF" },
                ],
              })
            }
          >
            Add a musician
          </button>
        </div>
      ) : null}
      <p className="mt-6 text-sm text-mist">Societies on this lodging: {societiesFor(work).join(", ").toUpperCase()}.</p>
    </div>
  );
}

function ReviewStep({ work }: { work: Work }) {
  const parties = partiesToSign(work);
  return (
    <div>
      <h1 className="font-serif text-4xl text-paper">{parties.length > 0 ? "Ask them to sign" : "Ready to lodge"}</h1>
      <p className="mt-2 max-w-xl text-mist">
        {parties.length > 0
          ? "Each co-writer and publisher gets a letter. The work lodges when every share is confirmed. In this desk the letters open here — that is the same link an email would carry."
          : "Nobody else holds a share. Lodging uses the mandates you just signed."}
      </p>
      <div className="mt-8">
        <PortalDesks work={work} />
      </div>
      {parties.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {parties.map((party) => (
            <li key={party.id} className="rounded-md border border-line px-4 py-3">
              <p className="font-medium text-paper">{party.name}</p>
              <p className="text-sm text-mist">
                {party.kind === "publisher" ? "Publisher" : "Co-writer"} · {party.email}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
