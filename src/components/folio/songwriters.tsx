import { useState } from "react";
import { buttonClass, Field, TextInput } from "@/components/folio/ui";
import { newId, emailOk } from "@/lib/folio/model";
import { useDesk } from "@/lib/folio/store";

export function Songwriters() {
  const songwriters = useDesk((state) => state.songwriters);
  const saveSongwriter = useDesk((state) => state.saveSongwriter);
  const removeSongwriter = useDesk((state) => state.removeSongwriter);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [ipi, setIpi] = useState("");
  const [membership, setMembership] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  function add() {
    if (!name.trim()) return;
    if (!emailOk(email)) {
      setEmailError("An email address is required.");
      return;
    }
    saveSongwriter({ id: newId(), name, surname, ipi, membership, email });
    setName("");
    setSurname("");
    setIpi("");
    setMembership("");
    setEmail("");
    setEmailError("");
    setAdding(false);
    setOpen(true);
  }

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="flex min-h-11 flex-1 items-center justify-between gap-3 text-left"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="font-medium text-paper">My songwriters</span>
          <span className="text-sm text-mist">
            {songwriters.length} · {open ? "Close" : "Open"}
          </span>
        </button>
        <button
          type="button"
          className="key inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line bg-panel text-lg"
          aria-expanded={adding}
          aria-label="Add a songwriter"
          onClick={() => setAdding((value) => !value)}
        >
          +
        </button>
      </div>
      {adding ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="IPI" hint="Leave blank if you don't have one.">
            <TextInput value={ipi} onChange={setIpi} inputMode="numeric" />
          </Field>
          <Field label="Name">
            <TextInput value={name} onChange={setName} />
          </Field>
          <Field label="Surname">
            <TextInput value={surname} onChange={setSurname} />
          </Field>
          <Field label="Membership number" hint="Leave empty if it has not been allocated.">
            <TextInput value={membership} onChange={setMembership} />
          </Field>
          <Field label="Email" hint="Required.">
            <TextInput value={email} onChange={setEmail} inputMode="email" />
          </Field>
          <button type="button" className={buttonClass("line")} onClick={add}>
            Save songwriter
          </button>
          {emailError ? <p className="text-sm text-brass">{emailError}</p> : null}
        </div>
      ) : null}
      {open ? (
        <ul className="mt-3 space-y-2">
          {songwriters.length === 0 ? <li className="text-sm text-mist">None saved yet.</li> : null}
          {songwriters.map((songwriter) => (
            <li key={songwriter.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-panel px-3 py-2">
              <div>
                <p className="font-medium text-paper">{[songwriter.name, songwriter.surname].filter(Boolean).join(" ")}</p>
                <p className="text-sm text-mist">
                  {[songwriter.email, songwriter.ipi && `IPI ${songwriter.ipi}`, songwriter.membership && `Member ${songwriter.membership}`]
                    .filter(Boolean)
                    .join(" · ") || "No IPI or membership number yet"}
                </p>
              </div>
              <button type="button" className={buttonClass("quiet")} onClick={() => removeSongwriter(songwriter.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
