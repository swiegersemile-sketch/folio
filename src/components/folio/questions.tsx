import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Gate } from "@/components/folio/gate";
import { MandateList } from "@/components/folio/mandates";
import { PacketButtons } from "@/components/folio/packets";
import { PortalDesks } from "@/components/folio/portal-desks";
import { Page } from "@/components/folio/shell";
import { Songwriters } from "@/components/folio/songwriters";
import { buttonClass, ErrorList, ExampleMark, Field, SelectInput, TextInput } from "@/components/folio/ui";
import { cn } from "@/lib/folio/cn";
import {
  blankWork,
  CAPASSO_TERRITORIES,
  clampShare,
  exampleSong,
  formatIsrc,
  MUSICIAN_PARTS,
  newId,
  partiesToSign,
  PERFORMER_ROLES,
  REGISTRAR_DEFAULT,
  ROLES,
  sendForSignature,
  shareTotal,
  societiesFor,
  stepErrors,
  type MusicianPart,
  type Role,
  type Work,
  type Writer,
} from "@/lib/folio/model";
import { useDesk } from "@/lib/folio/store";

function Section({ tone, kicker, title, children }: { tone: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <header className={cn("rounded-md px-5 py-6 text-on-society", tone)}>
        <p className="text-xs tracking-widest uppercase">{kicker}</p>
        <h2 className="mt-2 font-serif text-4xl">{title}</h2>
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Questions({ routeId }: { routeId?: string }) {
  const admitted = useDesk((state) => state.admitted);
  const saveWork = useDesk((state) => state.saveWork);
  const saveSongwriter = useDesk((state) => state.saveSongwriter);
  const navigate = useNavigate();
  const [work, setWork] = useState<Work | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!routeId) {
      setWork((current) => current ?? blankWork(REGISTRAR_DEFAULT));
      return;
    }
    const found = useDesk.getState().works.find((item) => item.id === routeId);
    if (!found) {
      setMissing(true);
      return;
    }
    setWork(found);
  }, [routeId]);

  if (!admitted) return <Gate />;
  if (missing) {
    return (
      <Page width="sheet">
        <h1 className="font-serif text-4xl">That song is not on this desk.</h1>
        <Link to="/" className={cn(buttonClass("line"), "mt-6")}>
          Back
        </Link>
      </Page>
    );
  }
  if (!work) return <Page width="sheet"><p className="text-mist">Opening the song…</p></Page>;

  const showRecording = work.alreadyRegistered || work.released;

  function keep(current: Work) {
    const exists = useDesk.getState().works.some((item) => item.id === current.id);
    const typed =
      current.title.trim().length > 0 ||
      current.alreadyRegistered ||
      current.released ||
      current.writers.some((writer) => writer.name.trim() || writer.email.trim() || writer.ipi.trim() || writer.performing > 0) ||
      current.publishers.some((publisher) => publisher.name.trim() || publisher.mechanical > 0) ||
      current.recording.isrc.trim().length > 0 ||
      current.recording.label.trim().length > 0 ||
      (current.recording.musicians ?? []).some((musician) => musician.name.trim());
    if (exists || typed) saveWork(current);
  }

  function fill() {
    const next = exampleSong(work!);
    setWork(next);
    for (const writer of next.writers) {
      const parts = writer.name.trim().split(/\s+/);
      const surname = parts.length > 1 ? parts[parts.length - 1] : "";
      const name = parts.length > 1 ? parts.slice(0, -1).join(" ") : writer.name;
      saveSongwriter({ id: writer.id, name, surname, ipi: writer.ipi, membership: "", email: writer.email });
    }
  }

  function back() {
    keep(work!);
    void navigate({ to: "/" });
  }

  function setWriter(id: string, patch: Partial<Writer>) {
    setWork({ ...work!, writers: work!.writers.map((writer) => (writer.id === id ? { ...writer, ...patch } : writer)) });
  }

  function setAlready(checked: boolean) {
    setWork({
      ...work!,
      alreadyRegistered: checked,
      released: checked ? true : work!.released,
      recording: { ...work!.recording, hasRecording: checked ? true : work!.recording.hasRecording },
    });
  }

  function setRecorded(checked: boolean) {
    setWork({
      ...work!,
      released: checked,
      recording: { ...work!.recording, hasRecording: checked },
    });
  }

  function send() {
    const problems = stepErrors(work!, 5);
    if (problems.length) {
      setErrors(problems);
      return;
    }
    const lodged = sendForSignature(work!);
    saveWork(lodged);
    void navigate({ to: "/works/$workId", params: { workId: lodged.id } });
  }

  return (
    <Page width="sheet">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass("line")} onClick={back}>
          Back
        </button>
        <button type="button" className={buttonClass("line")} onClick={fill}>
          Fill the example
        </button>
      </div>
      <h1 className="mt-6 font-serif text-5xl text-paper">Register the song</h1>
      <label className="mt-6 flex min-h-11 items-center gap-3 text-paper">
        <input
          type="checkbox"
          checked={work.alreadyRegistered}
          onChange={(event) => setAlready(event.target.checked)}
        />
        Is the song already written and registered?
      </label>

      {!work.alreadyRegistered ? (
        <Section tone="bg-samro" kicker="SAMRO · Performing right" title="Who wrote it?">
          <Songwriters />
          <Field label="Title" example="Table Mountain After Rain">
            <TextInput value={work.title} onChange={(title) => setWork({ ...work, title })} />
          </Field>
          <div className="mt-4 grid gap-4">
            {work.writers.map((writer, index) => (
              <article key={writer.id} className="rounded-md border border-line bg-panel p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{writer.isRegistrar ? "You" : `Writer ${index + 1}`}</h3>
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
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Field label="Name" example="Amahle">
                    <TextInput value={writer.name} onChange={(name) => setWriter(writer.id, { name })} />
                  </Field>
                  <Field label="Email" hint="Required." example="amahle@example.com">
                    <TextInput value={writer.email} onChange={(email) => setWriter(writer.id, { email })} inputMode="email" />
                  </Field>
                  <Field label="Songwriter IPI" example="00123456789. Leave it blank if you don't have one.">
                    <TextInput
                      value={writer.ipi}
                      onChange={(ipi) => setWriter(writer.id, { ipi: ipi.replace(/[^\d]/g, "").slice(0, 11) })}
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Role" example="CA if you wrote the music and the words.">
                    <SelectInput value={writer.role} options={ROLES} onChange={(role) => setWriter(writer.id, { role: role as Role })} />
                  </Field>
                  <Field label="Share %" example="100 if you wrote it alone. Otherwise the split, and the shares must total 100.">
                    <TextInput
                      value={writer.performing ? String(writer.performing) : ""}
                      onChange={(value) => setWriter(writer.id, { performing: clampShare(value) })}
                      inputMode="numeric"
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
              setWork({
                ...work,
                writers: [...work.writers, { id: newId(), name: "", email: "", ipi: "", role: "author", pro: "SAMRO", isRegistrar: false, performing: 0, mechanical: 0 }],
              })
            }
          >
            Add a writer
          </button>
          <p className="mt-4 text-sm text-mist">Shares total {shareTotal(work, "performing")}%.</p>
          <label className="mt-6 flex min-h-11 items-center gap-3 text-paper">
            <input type="checkbox" checked={work.released} onChange={(event) => setRecorded(event.target.checked)} />
            Is this song recorded?
          </label>
        </Section>
      ) : (
        <Field label="Title" example="Table Mountain After Rain">
          <TextInput value={work.title} onChange={(title) => setWork({ ...work, title })} />
        </Field>
      )}

      {showRecording ? (
        <>
          <Section tone="bg-capasso" kicker="CAPASSO · Mechanical right" title="The mechanical split">
            <Songwriters />
            <Field label="Territory" example="Domestic">
              <SelectInput
                value={work.capassoTerritory}
                options={CAPASSO_TERRITORIES}
                onChange={(capassoTerritory) => setWork({ ...work, capassoTerritory: capassoTerritory as Work["capassoTerritory"] })}
              />
            </Field>
            <div className="mt-4 space-y-3">
              {work.writers.map((writer) => (
                <Field key={writer.id} label={`${writer.name || "Writer"} · mechanical %`} example="Often the same as the performing share.">
                  <TextInput
                    value={writer.mechanical ? String(writer.mechanical) : ""}
                    onChange={(value) => setWriter(writer.id, { mechanical: clampShare(value) })}
                    inputMode="numeric"
                  />
                </Field>
              ))}
              {work.publishers.map((publisher) => (
                <article key={publisher.id} className="rounded-md border border-line bg-panel p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-medium">Publisher</h3>
                    <button
                      type="button"
                      className={buttonClass("quiet")}
                      onClick={() => setWork({ ...work, publishers: work.publishers.filter((item) => item.id !== publisher.id) })}
                    >
                      Close
                    </button>
                  </div>
                  <Field label="Publisher" example="Klipdrift Music Publishing">
                    <TextInput
                      value={publisher.name}
                      onChange={(name) => setWork({ ...work, publishers: work.publishers.map((item) => (item.id === publisher.id ? { ...item, name } : item)) })}
                    />
                  </Field>
                  <div className="mt-3">
                    <Field label="Publisher mechanical %">
                      <TextInput
                        value={publisher.mechanical ? String(publisher.mechanical) : ""}
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
            </div>
            {work.publishers.length === 0 ? (
              <button
                type="button"
                className={cn(buttonClass("line"), "mt-4")}
                onClick={() => setWork({ ...work, publishers: [{ id: newId(), name: "", email: "", ipi: "", performing: 0, mechanical: 0 }] })}
              >
                Add a publisher
              </button>
            ) : null}
            <p className="mt-4 text-sm text-mist">Mechanical shares total {shareTotal(work, "mechanical")}%.</p>
          </Section>

          <Section tone="bg-sampra" kicker="SAMPRA · The recording" title="Who made it with you?">
            <div className="flex items-start justify-between gap-3">
              <p className="text-mist">Vocals, drums, guitar, and anyone else in the room.</p>
              <ExampleMark label="who played" text="Sibusiso Khumalo, drums, non-featured." />
            </div>
            <div className="mt-4 space-y-3">
              {(work.recording.musicians ?? []).map((musician) => (
                <div key={musician.id} className="grid gap-3 rounded-md border border-line bg-panel p-3 md:grid-cols-4">
                  <TextInput
                    value={musician.name}
                    onChange={(name) =>
                      setWork({
                        ...work,
                        recording: {
                          ...work.recording,
                          musicians: work.recording.musicians.map((item) => (item.id === musician.id ? { ...item, name } : item)),
                        },
                      })
                    }
                  />
                  <SelectInput
                    value={musician.part}
                    options={MUSICIAN_PARTS}
                    onChange={(part) =>
                      setWork({
                        ...work,
                        recording: {
                          ...work.recording,
                          musicians: work.recording.musicians.map((item) => (item.id === musician.id ? { ...item, part: part as MusicianPart } : item)),
                        },
                      })
                    }
                  />
                  <SelectInput
                    value={musician.status}
                    options={PERFORMER_ROLES}
                    onChange={(status) =>
                      setWork({
                        ...work,
                        recording: {
                          ...work.recording,
                          musicians: work.recording.musicians.map((item) =>
                            item.id === musician.id ? { ...item, status: status as "FA" | "OF" | "NF" } : item,
                          ),
                        },
                      })
                    }
                  />
                  <button
                    type="button"
                    className={buttonClass("quiet")}
                    onClick={() =>
                      setWork({
                        ...work,
                        recording: { ...work.recording, musicians: work.recording.musicians.filter((item) => item.id !== musician.id) },
                      })
                    }
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
                setWork({
                  ...work,
                  recording: {
                    ...work.recording,
                    musicians: [...(work.recording.musicians ?? []), { id: newId(), name: "", part: "Vocals", partNote: "", status: "NF" }],
                  },
                })
              }
            >
              Add someone
            </button>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="ISRC" example="ZA-K3M-26-00418">
                <TextInput value={work.recording.isrc} onChange={(isrc) => setWork({ ...work, recording: { ...work.recording, isrc: formatIsrc(isrc) } })} />
              </Field>
              <Field label="Label" example="Klipdrift Records">
                <TextInput value={work.recording.label} onChange={(label) => setWork({ ...work, recording: { ...work.recording, label } })} />
              </Field>
            </div>
          </Section>
        </>
      ) : null}

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="font-serif text-3xl">Check, then send</h2>
        <p className="mt-2 text-mist">{societiesFor(work).join(", ").toUpperCase() || "SAMRO"}. Folio prepares the packet. It does not submit anything.</p>
        <div className="mt-4">
          <PortalDesks work={work} />
        </div>
        <div className="mt-6">
          <MandateList work={work} onChange={(next) => { setWork(next); saveWork(next); }} />
        </div>
        <PacketButtons work={work} />
        <ErrorList errors={errors} />
        <button type="button" className={cn(buttonClass("brass"), "mt-6")} onClick={send}>
          {partiesToSign(work).length > 0 ? "Send letters" : "Lodge this work"}
        </button>
      </section>
    </Page>
  );
}
