import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/folio/cn";
import type { DeskStatus } from "@/lib/folio/model";

const variants = {
  brass: "bg-brass text-ink",
  line: "border border-line bg-panel text-paper",
  quiet: "text-mist",
} as const;

export type ButtonVariant = keyof typeof variants;

export function buttonClass(variant: ButtonVariant = "brass", className?: string) {
  return cn(
    "key inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40",
    variants[variant],
    className,
  );
}

export const fieldClass =
  "mt-1 w-full rounded-md border border-line bg-desk px-3 py-3 text-base text-paper placeholder:text-mist";

export function ExampleMark({ label, text }: { label: string; text: string }) {
  const tipId = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-md text-lg leading-none text-brass"
        aria-expanded={open}
        aria-controls={tipId}
        aria-label={`Example for ${label}`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        *
      </button>
      {open ? (
        <span id={tipId} role="note" className="absolute top-11 right-0 z-10 w-56 rounded-md border border-line bg-panel p-3 text-sm text-paper">
          {text}
        </span>
      ) : null}
    </span>
  );
}

export function Field({
  label,
  hint,
  example,
  children,
}: {
  label: string;
  example?: string;
  hint?: string;
  children: ReactNode;
}) {
  const id = useId();
  const control = isValidElement(children) ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children;
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm text-mist">
          {label}
        </label>
        {example ? <ExampleMark label={label} text={example} /> : null}
      </div>
      {control}
      {hint ? <span className="mt-1 block text-sm text-mist">{hint}</span> : null}
    </div>
  );
}

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "numeric" | "decimal";
}) {
  return (
    <input
      id={id}
      className={fieldClass}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete ?? "off"}
      inputMode={inputMode}
      enterKeyHint="go"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function SelectInput({
  id,
  value,
  onChange,
  options,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | { id: string; label: string }[];
}) {
  return (
    <select id={id} className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => {
        const id = typeof option === "string" ? option : option.id;
        const label = typeof option === "string" ? option : option.label;
        return (
          <option key={id} value={id}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function StatusPill({ status }: { status: DeskStatus }) {
  const label =
    status === "draft"
      ? "Draft"
      : status === "awaiting"
        ? "Awaiting signatures"
        : status === "disputed"
          ? "Disputed"
          : status === "ready"
            ? "Ready to lodge"
            : "Lodged";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-1 text-xs font-medium",
        status === "filed" || status === "ready" ? "border-brass text-brass" : "border-line text-mist",
      )}
    >
      {label}
    </span>
  );
}

export function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="mt-4 space-y-1 text-sm text-brass" role="alert">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}

export function SplitBar({
  segments,
}: {
  segments: { id: string; label: string; performing: number }[];
}) {
  const total = segments.reduce((sum, segment) => sum + segment.performing, 0);
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-md bg-panel-2" aria-hidden="true">
        {segments.map((segment, index) => (
          <div
            key={segment.id}
            className="h-2 bg-brass"
            style={{ width: `${segment.performing}%`, opacity: 1 - index * 0.18 }}
          />
        ))}
      </div>
      <p className="mt-2 text-sm tabular-nums text-mist">
        {total === 100 ? "Performing shares balanced" : `Performing shares ${total}%`}
      </p>
    </div>
  );
}
