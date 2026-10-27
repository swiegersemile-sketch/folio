import { partLabel, roleCode, type Work } from "@/lib/folio/model";

function slug(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "work"
  );
}

function pad(value: string, length: number): string {
  return value.toUpperCase().slice(0, length).padEnd(length, " ");
}

function share5(value: number): string {
  return String(Math.max(0, Math.min(100, Math.round(value))) * 100).padStart(5, "0");
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "UNKNOWN" };
  if (parts.length === 1) return { first: "", last: parts[0] ?? "UNKNOWN" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] ?? "UNKNOWN" };
}

export function packetSlug(work: Work): string {
  return slug(work.title);
}

export function samroNotice(work: Work): string {
  const writers = work.writers
    .map((writer) => `${writer.name}\t${roleCode(writer.role)}\t${writer.ipi || ""}\t${writer.performing}`)
    .join("\n");
  const publishers = work.publishers
    .map((publisher) => `${publisher.name}\tE\t${publisher.ipi || ""}\t${publisher.performing}`)
    .join("\n");
  return [
    "SAMRO NOTIFICATION OF WORKS",
    "Registration type: " + work.registrationType,
    "Title of work: " + work.title,
    "Alternative title: " + (work.altTitle || ""),
    "Duration: " + (work.recording.duration || ""),
    "Text: " + work.textKind,
    "Genre: " + work.catalogue,
    "Type of music: " + work.genre,
    "Performing artist: " + (work.recording.artist || ""),
    "Instrumentation: " + work.instrumentation,
    "",
    "Name\tRole\tIPI\tPR %",
    writers,
    publishers || "(no publisher)",
    "",
    "Prepared by Folio. Paste this into My Music → New notification, or email it to SAMRO. Nothing has been submitted.",
  ].join("\n");
}

export function sampraNotice(work: Work): string {
  const year = work.recording.releasedOn ? work.recording.releasedOn.slice(0, 4) : "";
  const players = (work.recording.musicians ?? [])
    .map((musician) => `${musician.name}\t${partLabel(musician)}\t${musician.status}`)
    .join("\n");
  return [
    "SAMPRA NOTIFICATION OF RECORDED PERFORMANCES",
    "Recording artist: " + (work.recording.artist || ""),
    "Album or single: " + (work.recording.album || work.title),
    "Year of release: " + (year || "unreleased"),
    "Track title: " + work.title,
    "Version title: " + (work.recording.versionTitle || work.title),
    "ISRC: " + (work.recording.isrc || ""),
    "Record label: " + (work.recording.label || ""),
    "Distributor: " + (work.recording.distributor || ""),
    "Featured role: " + work.recording.performerRole,
    "",
    "Name\tPart\tStatus",
    players || "(no other musicians)",
    "",
    "FA featured, OF other featured, NF session. A studio producer who played or directed the session is usually NF.",
    "Prepared by Folio. Enter this in SAMPRA Connect. Nothing has been submitted.",
  ].join("\n");
}

export function capassoCwr(work: Work): string {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const hhmmss = now.toISOString().slice(11, 19).replace(/:/g, "");
  const sender = work.publishers[0]?.name || work.writers.find((writer) => writer.isRegistrar)?.name || "FOLIO";
  const lines = [
    `HDRPB000000199${pad(sender, 44)}01.10${ymd}${hhmmss}${ymd}`,
    "GRHNWR0000102.100000000000",
  ];
  const title = pad(work.title || "UNTITLED", 60);
  lines.push(
    `NWR0000000000000000${title}  FOLIO          01           00000000            POP000000YORI                                                   N00000000000`.slice(
      0,
      208,
    ),
  );

  let seq = 0;
  const next = () => String(++seq).padStart(8, "0");
  const publisher = work.publishers[0];
  if (publisher) {
    const code = "FOLIO00001";
    lines.push(
      `SPU${next()}01${code}${pad(publisher.name, 45)}E ${"0".repeat(15)}${share5(publisher.performing)}${share5(publisher.mechanical)}00000 N`,
    );
    lines.push(`SPT${next()}${code}      ${share5(publisher.performing)}${share5(publisher.mechanical)}05000I2136N001`);
    for (const writer of work.writers) {
      const names = splitName(writer.name);
      const writerCode = pad(names.last, 9).trim().slice(0, 9).padEnd(9, "X");
      lines.push(
        `SWR${next()}${writerCode}${pad(names.last, 45)}${pad(names.first, 30)}${roleCode(writer.role).padEnd(2, " ")}${"0".repeat(12)}${share5(writer.performing)}   ${share5(writer.mechanical)}   00000 N`,
      );
      lines.push(`SWT${next()}${writerCode}${share5(writer.performing)}00000000I2136N001`);
      lines.push(`PWR${next()}${code}${pad(publisher.name, 45)}${writerCode}`);
    }
  } else {
    for (const writer of work.writers) {
      const names = splitName(writer.name);
      const writerCode = pad(names.last, 9).trim().slice(0, 9).padEnd(9, "X");
      lines.push(
        `SWR${next()}${writerCode}${pad(names.last, 45)}${pad(names.first, 30)}${roleCode(writer.role).padEnd(2, " ")}${"0".repeat(12)}${share5(writer.performing)}   ${share5(writer.mechanical)}   00000 N`,
      );
      lines.push(`SWT${next()}${writerCode}${share5(writer.performing)}00000000I2136N001`);
    }
  }

  const groupCount = lines.length - 1;
  lines.push(`GRT0000100000001${String(groupCount).padStart(8, "0")}   0000000000`);
  lines.push(`TRL0000100000001${String(lines.length).padStart(8, "0")}`);
  return lines.join("\n");
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
