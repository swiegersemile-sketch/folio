import { useState } from "react";
import { buttonClass, Field, TextInput } from "@/components/folio/ui";
import { cn } from "@/lib/folio/cn";
import { SOCIETIES, societiesFor, type Mandate, type SocietyId, type Work } from "@/lib/folio/model";

function prettyWhen(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function SocietyCard({
  work,
  societyId,
  registrarName,
  locked,
  onChange,
}: {
  work: Work;
  societyId: SocietyId;
  registrarName: string;
  locked: boolean;
  onChange?: (work: Work) => void;
}) {
  const society = SOCIETIES.find((item) => item.id === societyId);
  const mandate = work.mandates[societyId];
  const required = societiesFor(work).includes(societyId);
  const [memberNo, setMemberNo] = useState(mandate.memberNo);
  const [signedName, setSignedName] = useState(mandate.signedName || registrarName);
  const [agree, setAgree] = useState(false);

  if (!society) return null;

  if (!required) {
    return (
      <article className="rounded-md border border-line bg-panel p-4">
        <h3 className="font-medium text-paper">{society.name}</h3>
        <p className="mt-1 text-sm text-mist">No recording, so there is no neighbouring right to lodge here.</p>
      </article>
    );
  }

  function grant() {
    if (!onChange || locked) return;
    const next: Mandate = {
      granted: true,
      memberNo: memberNo.trim(),
      signedName: signedName.trim(),
      grantedAt: new Date().toISOString(),
    };
    onChange({ ...work, mandates: { ...work.mandates, [societyId]: next } });
  }

  function revoke() {
    if (!onChange || locked) return;
    onChange({
      ...work,
      mandates: {
        ...work.mandates,
        [societyId]: { granted: false, memberNo: mandate.memberNo, signedName: mandate.signedName, grantedAt: null },
      },
    });
  }

  return (
    <article className={cn("rounded-md border bg-panel p-4", mandate.granted ? "border-brass" : "border-line")}>
      <p className="text-xs tracking-widest text-brass uppercase">{society.right}</p>
      <h3 className="mt-1 font-serif text-2xl text-paper">{society.name}</h3>
      <p className="mt-1 text-sm text-mist">{society.detail}</p>
      {mandate.granted ? (
        <div className="mt-4">
          <p className="text-sm text-paper">
            Mandate signed by {mandate.signedName}
            {mandate.memberNo ? ` · ${mandate.memberNo}` : ""}
          </p>
          <p className="mt-1 text-sm text-mist">{prettyWhen(mandate.grantedAt)}</p>
          {!locked && onChange ? (
            <button type="button" className={cn(buttonClass("quiet"), "mt-3 px-0")} onClick={revoke}>
              Withdraw mandate
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <ul className="space-y-1 text-sm text-mist">
            {society.scopes.map((scope) => (
              <li key={scope}>Folio may {scope.charAt(0).toLowerCase()}{scope.slice(1)}.</li>
            ))}
          </ul>
          <Field label="Membership number">
            <TextInput value={memberNo} onChange={setMemberNo} placeholder="As it appears on your portal" />
          </Field>
          <Field label="Sign with your name">
            <TextInput value={signedName} onChange={setSignedName} autoComplete="name" />
          </Field>
          <label className="flex items-start gap-3 text-sm text-paper">
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
            />
            <span>I instruct Folio to lodge this work with {society.name} under my membership. Folio never asks for the portal password.</span>
          </label>
          <button
            type="button"
            className={buttonClass("brass")}
            disabled={!onChange || locked || !agree || !memberNo.trim() || !signedName.trim()}
            onClick={grant}
          >
            Grant {society.name} mandate
          </button>
        </div>
      )}
    </article>
  );
}

export function MandateList({
  work,
  onChange,
  locked,
}: {
  work: Work;
  onChange?: (work: Work) => void;
  locked?: boolean;
}) {
  const registrar = work.writers.find((writer) => writer.isRegistrar)?.name ?? work.writers[0]?.name ?? "";
  return (
    <div className="space-y-3">
      {SOCIETIES.map((society) => (
        <SocietyCard
          key={`${work.id}-${society.id}`}
          work={work}
          societyId={society.id}
          registrarName={registrar}
          locked={Boolean(locked)}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
