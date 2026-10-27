import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MandateList } from "@/components/folio/mandates";
import { PacketButtons } from "@/components/folio/packets";
import { PortalDesks } from "@/components/folio/portal-desks";
import { Page, Wordmark } from "@/components/folio/shell";
import { buttonClass, ErrorList, Field, SelectInput, TextInput } from "@/components/folio/ui";
import { cn } from "@/lib/folio/cn";
import { draftSong, type SongDraft } from "@/lib/folio/draft";
import {
  blankWork,
  canSaveDraft,
  clampShare,
  deriveStatus,
  formatIsrc,
  GENRES,
  LANGUAGES,
  MUSICIAN_PARTS,
  newId,
  partiesToSign,
  PERFORMER_ROLES,
  publisherTakesHalf,
  REGISTRAR_DEFAULT,
  ROLES,
  sendForSignature,
  stepErrors,
  unpublishedEven,
  type Musician,
  type MusicianPart,
  type Publisher,
  type Recording,
  type Role,
  type Work,
  type Writer,
} from "@/lib/folio/model";
import { personId, type Person } from "@/lib/folio/people";
import { useDesk } from "@/lib/folio/store";

function isRole(value: string): value is Role {
  return ROLES.some((role) => role.id === value);
}

function isPart(value: string): value is MusicianPart {
  return (MUSICIAN_PARTS as readonly string[]).includes(value);
}

export function SongSheet({ routeId }: { routeId?: string }) {
  const navigate = useNavigate();
  const saveWork = useDesk((state) => state.saveWork);
  const rememberPerson = useDesk((state) => state.rememberPerson);
  const people = useDesk((state) => state.people);
  const [work, setWork] = useState<Work | null>(null);
  const [missing, setMissing] = useState(false);
  const [filed, setFiled] = useState(false);
  const [note, setNote] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!routeId) {
      setWork((current) => current ?? blankWork(REGISTRAR_DEFAULT));
      setMissing(false);
      setFiled(false);
      return;
    }
    const found = useDesk.getState().works.find((item) => item.id === routeId);
    if (!found) {
      setMissing(true);
      setWork(null);
      return;
    }
    setMissing(false);
    setFiled(deriveStatus(found) === "filed");
    setWork(found);
    setSent(Boolean(found.sentAt));
  }, [routeId]);

  function remember(next: Work) {
    for (const writer of next.writers) {
      if (!writer.name.trim()) continue;
      rememberPerson({
        id: personId(writer.name),
        name: writer.name.trim(),
        email: writer.email,
        ipi: writer.ipi,
        role: writer.role,
        pro: writer.pro,
        part: "Vocals",
        writer: true,
        publisher: false,
        player: false,
      });
    }
    for (const publisher of next.publishers) {
      if (!publisher.name.trim()) continue;
      rememberPerson({
        id: personId(publisher.name),
        name: publisher.name.trim(),
        email: publisher.email,
        ipi: publisher.ipi,
        role: "composer",
        pro: "SAMRO",
        part: "Vocals",
        writer: false,
        publisher: true,
        player: false,
      });
    }
    for (const musician of next.recording.musicians ?? []) {
      if (!musician.name.trim()) continue;
      rememberPerson({
        id: personId(musician.name),
        name: musician.name.trim(),
        email: "",
        ipi: "",
        role: "composer",
        pro: "SAMRO",
        part: musician.part,
        writer: false,
        publisher: false,
        player: true,
      });
    }
  }

  function persist(next: Work) {
    const draft: Work = sent ? { ...next, sentAt: null, confirmations: [], filings: [] } : next;
    saveWork(draft);
    remember(draft);
    setWork(draft);
    setSent(false);
    return draft;
  }

  function applyDraft(draft: SongDraft) {
    setWork((current) => {
      const base = current ?? blankWork(REGISTRAR_DEFAULT);
      const writers: Writer[] = draft.writers.map((writer, index) => {
        const known = people.find((person) => person.name.toLowerCase() === writer.name.toLowerCase());
        return {
          id: newId(),
          name: known?.name || writer.name,
          email: known?.email || "",
          ipi: known?.ipi || "",
          role: isRole(writer.role) ? writer.role : known?.role || "composer-author",
          pro: known?.pro || "SAMRO",
          isRegistrar: index === 0,
          performing: writer.performing,
          mechanical: writer.mechanical,
        };
      });
      const publishers: Publisher[] = draft.publisher
        ? [
            {
              id: newId(),
              name: people.find((person) => person.name.toLowerCase() === draft.publisher?.name.toLowerCase())?.name || draft.publisher.name,
              email: people.find((person) => person.name.toLowerCase() === draft.publisher?.name.toLowerCase())?.email || "",
              ipi: people.find((person) => person.name.toLowerCase() === draft.publisher?.name.toLowerCase())?.ipi || "",
              performing: draft.publisher.performing,
              mechanical: draft.publisher.mechanical,
            },
          ]
        : [];
      const musicians: Musician[] = draft.musicians.map((musician) => ({
        id: newId(),
        name: musician.name,
        part: isPart(musician.part) ? musician.part : "Other",
        partNote: isPart(musician.part) ? "" : musician.part,
        status: "NF",
      }));
      return {
        ...base,
        title: draft.title || base.title,
        altTitle: draft.altTitle,
        genre: (GENRES as readonly string[]).includes(draft.genre) ? draft.genre : base.genre,
        language: draft.language || base.language,
        writers: writers.length ? writers : base.writers,
        publishers,
        recording: {
          ...base.recording,
          hasRecording: true,
          artist: draft.artist || writers[0]?.name || base.recording.artist,
          duration: draft.duration || base.recording.duration,
          isrc: draft.isrc ? formatIsrc(draft.isrc) : base.recording.isrc,
          label: draft.label,
          musicians,
        },
      };
    });
  }

  async function askDraft() {
    if (!note.trim() || drafting) return;
    setDrafting(true);
    setDraftError("");
    try {
      const result = await draftSong({
        data: {
          note,
          people: people.map((person) => `${person.name}${person.writer ? " writer" : ""}${person.publisher ? " publisher" : ""}${person.player ? ` plays ${person.part}` : ""}`).join("; "),
        },
      });
      if (!result.ok) {
        setDraftError(result.error);
        return;
      }
      applyDraft(result.draft);
    } catch {
      setDraftError("Grok could not draft that.");
    } finally {
      setDrafting(false);
    }
  }

  if (missing || (routeId && !work && !missing)) {
    if (!work && !missing) {
      return (
        <Page width="sheet">
          <p className="text-mist">Opening the song…</p>
        </Page>
      );
    }
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

  if (!work) {
    return (
      <Page width="sheet">
        <p className="text-mist">Opening the song…</p>
      </Page>
    );
  }

  if (filed) {
    return (
      <Page width="sheet">
        <Wordmark />
        <h1 className="mt-8 font-serif text-4xl">This work is already lodged.</h1>
        <p className="mt-3 text-mist">Download the packets, or start the next song with the same people.</p>
        <PacketButtons work={work} />
        <Link to="/works/$workId" params={{ workId: work.id }} className={cn(buttonClass("brass"), "mt-6")}>
          View the lodging
        </Link>
      </Page>
    );
  }

  const writerPeople = people.filter((person) => person.writer && !person.publisher);
  const publisherPeople = people.filter((person) => person.publisher);
  const playerPeople = people.filter((person) => person.player);

  function setWriter(id: string, patch: Partial<Writer>) {
    setWork({ ...work!, writers: work!.writers.map((writer) => (writer.id === id ? { ...writer, ...patch } : writer)) });
  }

  function addWriter(person?: Person) {
    const writer: Writer = {
      id: newId(),
      name: person?.name || "",
      email: person?.email || "",
      ipi: person?.ipi || "",
      role: person?.role || "author",
      pro: person?.pro || "SAMRO",
      isRegistrar: work!.writers.length === 0,
      performing: 0,
      mechanical: 0,
    };
    if (person && work!.writers.some((item) => item.name.toLowerCase() === person.name.toLowerCase())) return;
    setWork({ ...work!, writers: [...work!.writers, writer] });
  }

  function usePublisher(person: Person) {
    const publisher: Publisher = {
      id: newId(),
      name: person.name,
      email: person.email,
      ipi: person.ipi,
      performing: 0,
      mechanical: 0,
    };
    setWork({ ...work!, publishers: [publisher] });
  }

  function togglePlayer(person: Person) {
    const musicians = work!.recording.musicians ?? [];
    const existing = musicians.find((musician) => musician.name.toLowerCase() === person.name.toLowerCase());
    const next = existing
      ? musicians.filter((musician) => musician.id !== existing.id)
      : [...musicians, { id: newId(), name: person.name, part: person.part, partNote: "", status: "NF" as const }];
    setWork({ ...work!, recording: { ...work!.recording, hasRecording: true, musicians: next } });
  }

  function setRecording(patch: Partial<Recording>) {
    setWork({ ...work!, recording: { ...work!.recording, ...patch } });
  }

  function send() {
    const problems = stepErrors(work!, 5);
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }
    const saved = persist(work!);
    const lodged = sendForSignature(saved);
    saveWork(lodged);
    void navigate({ to: "/works/$workId", params: { workId: lodged.id } });
  }

  return (
    <Page width="sheet">
      <div className="flex items-center justify-between gap-4">
        <Wordmark />
        <Link to="/" className={buttonClass("line")}>
          Desk
        </Link>
      </div>
      <h1 className="mt-8 font-serif text-4xl text-paper">One song</h1>
      <p className="mt-2 max-w-xl text-mist">
        Who wrote it, who played, and the recording. The three portals are the last look, not three forms.
      </p>

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          void askDraft();
        }}
      >
        <Field label="Describe it" hint="Grok fills the song. You still check the shares.">
          <textarea
            className="mt-1 w-full rounded-md border border-line bg-desk px-3 py-3 text-base text-paper"
            rows={3}
            value={note}
            maxLength={800}
            placeholder="Table Mountain. Amahle 30, Jonah 20, Klipdrift takes half. Sibu on drums, Lerato on guitar."
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <button type="submit" className={cn(buttonClass("brass"), "mt-3")} disabled={drafting || !note.trim()}>
          {drafting ? "Drafting…" : "Draft with Grok"}
        </button>
        {draftError ? <p className="mt-2 text-sm text-brass">{draftError}</p> : null}
      </form>

      <section className="mt-8">
        <h2 className="font-serif text-3xl text-paper">The song</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <TextInput value={work.title} onChange={(title) => setWork({ ...work, title })} placeholder="Table Mountain After Rain" />
          </Field>
          <Field label="Alternative title">
            <TextInput value={work.altTitle} onChange={(altTitle) => setWork({ ...work, altTitle })} />
          </Field>
          <Field label="Duration">
            <TextInput
              value={work.recording.duration}
              onChange={(duration) => setRecording({ duration })}
              placeholder="3:42"
            />
          </Field>
          <Field label="Type of music">
            <SelectInput value={work.genre} options={GENRES} onChange={(genre) => setWork({ ...work, genre })} />
          </Field>
          <Field label="Language">
            <SelectInput value={work.language} options={LANGUAGES} onChange={(language) => setWork({ ...work, language })} />
          </Field>
          <Field label="Date written">
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-line bg-desk px-3 py-3 text-base text-paper"
              value={work.writtenOn}
              onChange={(event) => setWork({ ...work, writtenOn: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-3xl text-paper">Who wrote it</h2>
          <button type="button" className={buttonClass("quiet")} onClick={() => setWork(unpublishedEven(work))}>
            Split the writers evenly
          </button>
        </div>
        {writerPeople.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {writerPeople.map((person) => (
              <button key={person.id} type="button" className={buttonClass("line")} onClick={() => addWriter(person)}>
                {person.name}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-4 space-y-4">
          {work.writers.map((writer, index) => (
            <article key={writer.id} className="rounded-md border border-line bg-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-paper">{writer.isRegistrar ? "Registering writer" : `Writer ${index + 1}`}</h3>
                {work.writers.length > 1 ? (
                  <button
                    type="button"
                    className={buttonClass("quiet")}
                    onClick={() => {
                      const writers = work.writers.filter((item) => item.id !== writer.id);
                      if (!writers.some((item) => item.isRegistrar) && writers[0]) writers[0] = { ...writers[0], isRegistrar: true };
                      setWork({ ...work, writers });
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <TextInput value={writer.name} onChange={(name) => setWriter(writer.id, { name })} />
                </Field>
                <Field label="Email">
                  <TextInput value={writer.email} onChange={(email) => setWriter(writer.id, { email })} inputMode="email" />
                </Field>
                <Field label="Role">
                  <SelectInput value={writer.role} options={ROLES} onChange={(role) => setWriter(writer.id, { role: role as Role })} />
                </Field>
                <Field label="IPI">
                  <TextInput value={writer.ipi} onChange={(ipi) => setWriter(writer.id, { ipi: ipi.replace(/[^\d]/g, "").slice(0, 11) })} inputMode="numeric" />
                </Field>
                <Field label="PR %">
                  <TextInput value={String(writer.performing)} onChange={(value) => setWriter(writer.id, { performing: clampShare(value) })} inputMode="numeric" />
                </Field>
                <Field label="MR %">
                  <TextInput value={String(writer.mechanical)} onChange={(value) => setWriter(writer.id, { mechanical: clampShare(value) })} inputMode="numeric" />
                </Field>
              </div>
            </article>
          ))}
        </div>
        <button type="button" className={cn(buttonClass("line"), "mt-4")} onClick={() => addWriter()}>
          Add a writer
        </button>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-3xl text-paper">Publisher</h2>
          <button type="button" className={buttonClass("quiet")} onClick={() => setWork(publisherTakesHalf(work))} disabled={work.publishers.length === 0}>
            Publisher takes half
          </button>
        </div>
        {publisherPeople.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {publisherPeople.map((person) => (
              <button key={person.id} type="button" className={buttonClass("line")} onClick={() => usePublisher(person)}>
                {person.name}
              </button>
            ))}
            <button type="button" className={buttonClass("quiet")} onClick={() => setWork(unpublishedEven(work))}>
              No publisher
            </button>
          </div>
        ) : null}
        {work.publishers.map((publisher) => (
          <article key={publisher.id} className="mt-4 rounded-md border border-line bg-panel p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Publisher">
                <TextInput
                  value={publisher.name}
                  onChange={(name) =>
                    setWork({ ...work, publishers: work.publishers.map((item) => (item.id === publisher.id ? { ...item, name } : item)) })
                  }
                />
              </Field>
              <Field label="Email">
                <TextInput
                  value={publisher.email}
                  onChange={(email) =>
                    setWork({ ...work, publishers: work.publishers.map((item) => (item.id === publisher.id ? { ...item, email } : item)) })
                  }
                  inputMode="email"
                />
              </Field>
              <Field label="PR %">
                <TextInput
                  value={String(publisher.performing)}
                  onChange={(value) =>
                    setWork({
                      ...work,
                      publishers: work.publishers.map((item) => (item.id === publisher.id ? { ...item, performing: clampShare(value) } : item)),
                    })
                  }
                  inputMode="numeric"
                />
              </Field>
              <Field label="MR %">
                <TextInput
                  value={String(publisher.mechanical)}
                  onChange={(value) =>
                    setWork({
                      ...work,
                      publishers: work.publishers.map((item) => (item.id === publisher.id ? { ...item, mechanical: clampShare(value) } : item)),
                    })
                  }
                  inputMode="numeric"
                />
              </Field>
            </div>
          </article>
        ))}
        {work.publishers.length === 0 ? (
          <button
            type="button"
            className={cn(buttonClass("line"), "mt-4")}
            onClick={() => setWork({ ...work, publishers: [{ id: newId(), name: "", email: "", ipi: "", performing: 0, mechanical: 0 }] })}
          >
            Add a publisher
          </button>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-3xl text-paper">Who played</h2>
        <p className="mt-2 text-sm text-mist">Drums, guitar, vocals, and a session producer. SAMPRA gets this list.</p>
        {playerPeople.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {playerPeople.map((person) => {
              const on = (work.recording.musicians ?? []).some((musician) => musician.name.toLowerCase() === person.name.toLowerCase());
              return (
                <button key={person.id} type="button" className={buttonClass(on ? "brass" : "line")} onClick={() => togglePlayer(person)}>
                  {person.name}
                </button>
              );
            })}
          </div>
        ) : null}
        <label className="mt-4 flex items-start gap-3 text-sm text-paper">
          <input
            type="checkbox"
            className="mt-1 size-4"
            checked={work.recording.hasRecording}
            onChange={(event) => setRecording({ hasRecording: event.target.checked })}
          />
          <span>There is a sound recording.</span>
        </label>
        {work.recording.hasRecording ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Recording artist">
              <TextInput value={work.recording.artist} onChange={(artist) => setRecording({ artist })} />
            </Field>
            <Field label="ISRC">
              <TextInput value={work.recording.isrc} onChange={(isrc) => setRecording({ isrc: formatIsrc(isrc) })} placeholder="ZA-K3M-26-00418" />
            </Field>
            <Field label="Label">
              <TextInput value={work.recording.label} onChange={(label) => setRecording({ label })} />
            </Field>
            <Field label="Album or single">
              <TextInput value={work.recording.album} onChange={(album) => setRecording({ album })} />
            </Field>
            <Field label="Featured role">
              <SelectInput
                value={work.recording.performerRole}
                options={PERFORMER_ROLES}
                onChange={(performerRole) => setRecording({ performerRole: performerRole as Recording["performerRole"] })}
              />
            </Field>
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          {(work.recording.musicians ?? []).map((musician) => (
            <div key={musician.id} className="grid gap-3 rounded-md border border-line p-3 md:grid-cols-4">
              <TextInput
                value={musician.name}
                onChange={(name) =>
                  setRecording({
                    musicians: work.recording.musicians.map((item) => (item.id === musician.id ? { ...item, name } : item)),
                  })
                }
              />
              <SelectInput
                value={musician.part}
                options={MUSICIAN_PARTS}
                onChange={(part) =>
                  setRecording({
                    musicians: work.recording.musicians.map((item) => (item.id === musician.id ? { ...item, part: part as MusicianPart } : item)),
                  })
                }
              />
              <SelectInput
                value={musician.status}
                options={PERFORMER_ROLES}
                onChange={(status) =>
                  setRecording({
                    musicians: work.recording.musicians.map((item) =>
                      item.id === musician.id ? { ...item, status: status as Musician["status"] } : item,
                    ),
                  })
                }
              />
              <button
                type="button"
                className={buttonClass("quiet")}
                onClick={() => setRecording({ musicians: work.recording.musicians.filter((item) => item.id !== musician.id) })}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={cn(buttonClass("line"), "mt-3")}
          onClick={() =>
            setRecording({
              hasRecording: true,
              musicians: [...(work.recording.musicians ?? []), { id: newId(), name: "", part: "Drums", partNote: "", status: "NF" }],
            })
          }
        >
          Add a musician
        </button>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl text-paper">What the portals will see</h2>
        <div className="mt-4">
          <PortalDesks work={work} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl text-paper">Your instruction</h2>
        <p className="mt-2 text-sm text-mist">No portal passwords. This only records that Folio may prepare the notification.</p>
        <div className="mt-4">
          <MandateList
            work={work}
            onChange={(next) => {
              setWork(next);
              saveWork(next);
            }}
          />
        </div>
      </section>

      <ErrorList errors={errors} />
      {sent ? <p className="mt-4 text-sm text-brass">Saving or sending again voids the signatures already collected.</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClass("line")}
          disabled={!canSaveDraft(work)}
          onClick={() => {
            const saved = persist(work);
            void navigate({ to: "/register", search: { id: saved.id, step: 0 }, replace: true });
          }}
        >
          Save draft
        </button>
        <button type="button" className={buttonClass("brass")} onClick={send}>
          {partiesToSign(work).length > 0 ? "Send letters" : "Lodge this work"}
        </button>
      </div>
      <p className="mt-4 text-sm text-mist">The packets download from the work once it is saved. Nothing is sent to a society.</p>
    </Page>
  );
}
