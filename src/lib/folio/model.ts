export type SocietyId = "samro" | "capasso" | "sampra";

export type Role = "composer" | "author" | "composer-author" | "arranger" | "translator";

export type Pro = "SAMRO" | "CAPASSO" | "Other" | "None yet";

export type RegistrationType = "CTB" | "OU";

export type TextKind = "Music and text" | "Music" | "Text";

export type Catalogue = "Popular" | "Serious";

export type Instrumentation = "IV" | "IS" | "VS";

export type CapassoTerritory = "Domestic" | "International";

export type PerformerRole = "FA" | "OF" | "NF";

export type MusicianPart =
  | "Vocals"
  | "Backing vocals"
  | "Guitar"
  | "Bass"
  | "Drums"
  | "Percussion"
  | "Keys"
  | "Piano"
  | "Saxophone"
  | "Trumpet"
  | "Synth"
  | "Programming"
  | "Other";

export type Musician = {
  id: string;
  name: string;
  part: MusicianPart;
  partNote: string;
  status: PerformerRole;
};

export type Writer = {
  id: string;
  name: string;
  email: string;
  ipi: string;
  role: Role;
  pro: Pro;
  isRegistrar: boolean;
  performing: number;
  mechanical: number;
};

export type Publisher = {
  id: string;
  name: string;
  email: string;
  ipi: string;
  performing: number;
  mechanical: number;
};

export type Recording = {
  hasRecording: boolean;
  artist: string;
  isrc: string;
  label: string;
  duration: string;
  releasedOn: string;
  album: string;
  versionTitle: string;
  distributor: string;
  performerRole: PerformerRole;
  musicians: Musician[];
};

export type Mandate = {
  granted: boolean;
  memberNo: string;
  signedName: string;
  grantedAt: string | null;
};

export type Confirmation = {
  token: string;
  partyId: string;
  kind: "writer" | "publisher";
  name: string;
  email: string;
  status: "pending" | "confirmed" | "disputed";
  note: string;
  respondedAt: string | null;
};

export type Filing = {
  society: SocietyId;
  reference: string;
  filedAt: string;
};

export type Work = {
  id: string;
  title: string;
  altTitle: string;
  language: string;
  genre: string;
  writtenOn: string;
  territory: string;
  iswc: string;
  registrationType: RegistrationType;
  textKind: TextKind;
  catalogue: Catalogue;
  instrumentation: Instrumentation;
  capassoTerritory: CapassoTerritory;
  released: boolean;
  alreadyRegistered: boolean;
  writers: Writer[];
  publishers: Publisher[];
  recording: Recording;
  mandates: Record<SocietyId, Mandate>;
  confirmations: Confirmation[];
  filings: Filing[];
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeskStatus = "draft" | "awaiting" | "disputed" | "ready" | "filed";

export const SOCIETIES: {
  id: SocietyId;
  name: string;
  long: string;
  right: string;
  detail: string;
  scopes: string[];
}[] = [
  {
    id: "samro",
    name: "SAMRO",
    long: "Southern African Music Rights Organisation",
    right: "Performing right",
    detail: "Live shows, broadcast, and public performance of the composition.",
    scopes: ["Lodge this musical work", "Submit writer and publisher splits", "Quote your membership number"],
  },
  {
    id: "capasso",
    name: "CAPASSO",
    long: "Composers, Authors and Publishers Association",
    right: "Mechanical right",
    detail: "Reproduction — downloads, physical copies, and streaming mechanicals.",
    scopes: ["Lodge the mechanical shares", "Name the publisher", "Attach this notification"],
  },
  {
    id: "sampra",
    name: "SAMPRA",
    long: "South African Music Performance Rights Association",
    right: "Neighbouring right",
    detail: "The sound recording: performers and the label. An ISRC is required.",
    scopes: ["Lodge the recording", "Submit the ISRC", "Name the artist and label"],
  },
];

export const GENRES = [
  "Amapiano",
  "Afro house",
  "Gqom",
  "Kwaito",
  "Hip hop",
  "Jazz",
  "Gospel",
  "Maskandi",
  "Mbaqanga",
  "Pop",
  "R&B",
  "Traditional",
  "Other",
] as const;

export const LANGUAGES = [
  "English",
  "Afrikaans",
  "isiZulu",
  "isiXhosa",
  "Sesotho",
  "Setswana",
  "Sepedi",
  "Xitsonga",
  "siSwati",
  "Tshivenda",
  "Other",
] as const;

export const ROLES: { id: Role; label: string }[] = [
  { id: "composer-author", label: "CA · Composer/Author" },
  { id: "composer", label: "C · Composer" },
  { id: "author", label: "A · Author" },
  { id: "arranger", label: "AR · Arranger" },
  { id: "translator", label: "AD · Adaptor" },
];

export const PROS: Pro[] = ["SAMRO", "CAPASSO", "Other", "None yet"];

export const TERRITORIES = ["World", "Southern Africa", "South Africa"] as const;

export const STEP_LABELS = ["SAMRO", "Shares", "CAPASSO", "SAMPRA", "Mandate", "Review"] as const;

export const REGISTRATION_TYPES: { id: RegistrationType; label: string }[] = [
  { id: "CTB", label: "CTB · Composer/author, local work" },
  { id: "OU", label: "OU · Publisher, local contract" },
];

export const TEXT_KINDS: TextKind[] = ["Music and text", "Music", "Text"];

export const CATALOGUES: Catalogue[] = ["Popular", "Serious"];

export const INSTRUMENTS: { id: Instrumentation; label: string }[] = [
  { id: "IV", label: "IV · Instruments and voice" },
  { id: "IS", label: "IS · Instruments solo" },
  { id: "VS", label: "VS · Voice solo" },
];

export const CAPASSO_TERRITORIES: CapassoTerritory[] = ["Domestic", "International"];

export const PERFORMER_ROLES: { id: PerformerRole; label: string }[] = [
  { id: "FA", label: "FA · Featured performer" },
  { id: "OF", label: "OF · Other featured" },
  { id: "NF", label: "NF · Non-featured / session" },
];

export const MUSICIAN_PARTS: MusicianPart[] = [
  "Vocals",
  "Backing vocals",
  "Guitar",
  "Bass",
  "Drums",
  "Percussion",
  "Keys",
  "Piano",
  "Saxophone",
  "Trumpet",
  "Synth",
  "Programming",
  "Other",
];

export const REGISTRAR_DEFAULT = "Emile Swiegers";

export function emptyMandate(): Mandate {
  return { granted: false, memberNo: "", signedName: "", grantedAt: null };
}

export function normalizeWork(input: Work): Work {
  const recording = input.recording;
  return {
    ...input,
    registrationType: input.registrationType || "CTB",
    textKind: input.textKind || "Music and text",
    catalogue: input.catalogue || "Popular",
    instrumentation: input.instrumentation || "IV",
    capassoTerritory: input.capassoTerritory || "Domestic",
    released: typeof input.released === "boolean" ? input.released : (input.recording?.musicians?.length ?? 0) > 0,
    alreadyRegistered: Boolean(input.alreadyRegistered),
    recording: {
      ...recording,
      album: recording?.album || "",
      versionTitle: recording?.versionTitle || "",
      distributor: recording?.distributor || "",
      performerRole: recording?.performerRole || "FA",
      musicians: (recording?.musicians ?? []).map((musician) => ({
        id: musician.id,
        name: musician.name || "",
        part: musician.part || "Vocals",
        partNote: musician.partNote || "",
        status: musician.status || "NF",
      })),
    },
  };
}

export function partLabel(musician: Musician): string {
  if (musician.part === "Other") return musician.partNote.trim() || "Other";
  return musician.part;
}

export function roleLabel(role: Role): string {
  return ROLES.find((item) => item.id === role)?.label ?? role;
}

export function roleCode(role: Role): string {
  switch (role) {
    case "composer-author":
      return "CA";
    case "composer":
      return "C";
    case "author":
      return "A";
    case "arranger":
      return "AR";
    default:
      return "AD";
  }
}

export function societyName(id: SocietyId): string {
  return SOCIETIES.find((item) => item.id === id)?.name ?? id;
}

export function shareTotal(work: Work, key: "performing" | "mechanical"): number {
  return [...work.writers, ...work.publishers].reduce((sum, party) => sum + (Number(party[key]) || 0), 0);
}

export function emailOk(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ipiOk(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^\d{9,11}$/.test(trimmed);
}

export function formatIsrc(raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const parts = [compact.slice(0, 2), compact.slice(2, 5), compact.slice(5, 7), compact.slice(7, 12)].filter(Boolean);
  return parts.join("-");
}

export function isrcOk(value: string): boolean {
  return /^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/.test(value);
}

export function durationOk(value: string): boolean {
  if (!value.trim()) return true;
  return /^\d{1,2}:[0-5]\d$/.test(value.trim());
}

export function partiesToSign(work: Work): { id: string; kind: "writer" | "publisher"; name: string; email: string }[] {
  return [
    ...work.writers
      .filter((writer) => !writer.isRegistrar)
      .map((writer) => ({ id: writer.id, kind: "writer" as const, name: writer.name.trim(), email: writer.email.trim() })),
    ...work.publishers.map((publisher) => ({
      id: publisher.id,
      kind: "publisher" as const,
      name: publisher.name.trim(),
      email: publisher.email.trim(),
    })),
  ];
}

export function societiesFor(work: Work): SocietyId[] {
  if (work.alreadyRegistered) return ["capasso", "sampra"];
  const ids: SocietyId[] = ["samro"];
  if (work.released) ids.push("capasso", "sampra");
  return ids;
}

export function mandatesReady(work: Work): boolean {
  return societiesFor(work).every((id) => work.mandates[id].granted);
}

export function deriveStatus(work: Work): DeskStatus {
  if (work.filings.length > 0) return "filed";
  if (!work.sentAt) return "draft";
  if (work.confirmations.some((item) => item.status === "disputed")) return "disputed";
  if (work.confirmations.some((item) => item.status === "pending")) return "awaiting";
  if (!mandatesReady(work)) return "ready";
  return "ready";
}

export function statusLabel(status: DeskStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "awaiting":
      return "Awaiting signatures";
    case "disputed":
      return "Disputed";
    case "ready":
      return "Ready to lodge";
    case "filed":
      return "Lodged";
  }
}

export function referenceFor(society: SocietyId, id: string): string {
  let hash = 0;
  const source = `${society}:${id}`;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 33 + source.charCodeAt(index)) >>> 0;
  }
  const number = (hash % 90000) + 10000;
  if (society === "samro") return `SMR-26-${number}`;
  if (society === "capasso") return `CAP-26-${number}`;
  return `SPR-26-${number}`;
}

export function tryLodge(work: Work): Work {
  if (work.filings.length > 0) return work;
  if (!work.sentAt) return work;
  if (!mandatesReady(work)) return work;
  if (work.confirmations.some((item) => item.status !== "confirmed")) return work;
  const filedAt = new Date().toISOString();
  return {
    ...work,
    updatedAt: filedAt,
    filings: societiesFor(work).map((society) => ({
      society,
      reference: referenceFor(society, work.id),
      filedAt,
    })),
  };
}

export function sendForSignature(work: Work): Work {
  const now = new Date().toISOString();
  const confirmations: Confirmation[] = partiesToSign(work).map((party) => ({
    token: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
    partyId: party.id,
    kind: party.kind,
    name: party.name,
    email: party.email,
    status: "pending",
    note: "",
    respondedAt: null,
  }));
  return tryLodge({
    ...work,
    confirmations,
    filings: [],
    sentAt: now,
    updatedAt: now,
  });
}

export function listAnd(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function waitingNames(work: Work): string[] {
  return work.confirmations.filter((item) => item.status === "pending").map((item) => item.name);
}

export function clampShare(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Math.min(100, Number.parseInt(digits, 10));
}

function evenSplit(count: number, total: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  let remainder = total - base * count;
  return Array.from({ length: count }, () => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return base + extra;
  });
}

export function unpublishedEven(work: Work): Work {
  const shares = evenSplit(work.writers.length, 100);
  return {
    ...work,
    publishers: [],
    writers: work.writers.map((writer, index) => ({
      ...writer,
      performing: shares[index] ?? 0,
      mechanical: shares[index] ?? 0,
    })),
  };
}

export function publisherTakesHalf(work: Work): Work {
  if (work.publishers.length === 0 || work.writers.length === 0) return work;
  const writerShares = evenSplit(work.writers.length, 50);
  const publisherShares = evenSplit(work.publishers.length, 50);
  return {
    ...work,
    writers: work.writers.map((writer, index) => ({
      ...writer,
      performing: writerShares[index] ?? 0,
      mechanical: writerShares[index] ?? 0,
    })),
    publishers: work.publishers.map((publisher, index) => ({
      ...publisher,
      performing: publisherShares[index] ?? 0,
      mechanical: publisherShares[index] ?? 0,
    })),
  };
}

export function stepErrors(work: Work, step: number): string[] {
  const errors: string[] = [];
  if (step === 0 || step === 5) {
    if (!work.title.trim()) errors.push("Give the work a title.");
    if (!work.writtenOn) errors.push("Add the date it was written.");
    if (!durationOk(work.recording?.duration ?? "")) errors.push("Duration should look like 3:42, or stay blank.");
  }
  if (step === 1 || step === 5) {
    if (work.writers.length === 0) errors.push("Add the writer who is registering this work.");
    work.writers.forEach((writer, index) => {
      const who = writer.name.trim() || `Writer ${index + 1}`;
      if (!writer.name.trim()) errors.push(`Name writer ${index + 1}.`);
      if (!emailOk(writer.email)) errors.push(`Add a real email for ${who}.`);
      if (!ipiOk(writer.ipi)) errors.push(`${who}'s IPI should be 9 to 11 digits, or leave it blank.`);
    });
    if (!work.writers.some((writer) => writer.isRegistrar)) errors.push("Mark which writer is registering the work.");
  }
  if (step === 2 || step === 5) {
    work.publishers.forEach((publisher, index) => {
      const who = publisher.name.trim() || `Publisher ${index + 1}`;
      if (!publisher.name.trim()) errors.push(`Name publisher ${index + 1}.`);
      if (!emailOk(publisher.email)) errors.push(`Add a real email for ${who}.`);
      if (!ipiOk(publisher.ipi)) errors.push(`${who}'s IPI should be 9 to 11 digits, or leave it blank.`);
    });
    const performing = shareTotal(work, "performing");
    if (performing !== 100) errors.push(`Performing shares total ${performing}%. They need to total 100%.`);
    if (work.released) {
      const mechanical = shareTotal(work, "mechanical");
      if (mechanical !== 100) errors.push(`Mechanical shares total ${mechanical}%. They need to total 100%.`);
    }
  }
  if ((step === 3 || step === 5) && societiesFor(work).includes("sampra")) {
    if (!work.recording.artist.trim()) errors.push("Name the recording artist.");
    if (!isrcOk(work.recording.isrc)) errors.push("ISRC should look like ZA-K3M-26-00418.");
    (work.recording.musicians ?? []).forEach((musician, index) => {
      if (!musician.name.trim()) errors.push(`Name the person ${index + 1}.`);
      if (musician.part === "Other" && !musician.partNote.trim()) errors.push(`Say what ${musician.name.trim() || `person ${index + 1}`} did.`);
    });
    if (!work.recording.label.trim()) errors.push("Name the label.");
  }
  if (step === 4 || step === 5) {
    if (societiesFor(work).includes("samro") && !work.mandates.samro.granted) errors.push("Grant the SAMRO mandate.");
    if (societiesFor(work).includes("capasso") && !work.mandates.capasso.granted) errors.push("Grant the CAPASSO mandate.");
    if (societiesFor(work).includes("sampra") && !work.mandates.sampra.granted) errors.push("Grant the SAMPRA mandate.");
  }
  return errors;
}

export function canSaveDraft(work: Work): boolean {
  return work.title.trim().length > 0;
}

export function lodgingPacket(work: Work): string {
  const lines = [
    "FOLIO WORK NOTIFICATION",
    "",
    `Title: ${work.title.trim() || "Untitled"}`,
    work.altTitle.trim() ? `Alternative title: ${work.altTitle.trim()}` : "",
    `Language: ${work.language}`,
    `Genre: ${work.genre}`,
    `Written: ${work.writtenOn || "—"}`,
    `Territory: ${work.territory}`,
    work.iswc.trim() ? `ISWC: ${work.iswc.trim()}` : "ISWC: to be assigned",
    "",
    "WRITERS",
    ...work.writers.map(
      (writer) =>
        `${writer.name || "Unnamed"} · ${roleLabel(writer.role)} · ${writer.pro} · IPI ${writer.ipi.trim() || "pending"} · performing ${writer.performing}% · mechanical ${writer.mechanical}%${writer.isRegistrar ? " · registering writer" : ""}`,
    ),
    "",
    work.publishers.length ? "PUBLISHERS" : "PUBLISHERS",
    ...(work.publishers.length
      ? work.publishers.map(
          (publisher) =>
            `${publisher.name} · IPI ${publisher.ipi.trim() || "pending"} · performing ${publisher.performing}% · mechanical ${publisher.mechanical}%`,
        )
      : ["Unpublished. Writers hold 100%."]),
    "",
    "RECORDING",
    work.recording.hasRecording
      ? [
          `Artist: ${work.recording.artist || "—"}`,
          `Role: ${work.recording.performerRole || "FA"}`,
          `Album or single: ${work.recording.album || work.title || "—"}`,
          `Version: ${work.recording.versionTitle || "—"}`,
          `ISRC: ${work.recording.isrc || "—"}`,
          `Label: ${work.recording.label || "—"}`,
          `Distributor: ${work.recording.distributor || "—"}`,
          `Duration: ${work.recording.duration || "—"}`,
          `Released: ${work.recording.releasedOn || "unreleased"}`,
          ...(work.recording.musicians ?? []).map(
            (musician) => `Musician: ${musician.name || "Unnamed"} · ${partLabel(musician)} · ${musician.status}`,
          ),
        ].join("\n")
      : "No master recording. SAMPRA is not in this lodging.",
    "",
    "MANDATES",
    ...societiesFor(work).map((id) => {
      const mandate = work.mandates[id];
      return `${societyName(id)}: ${mandate.granted ? `granted by ${mandate.signedName} · membership ${mandate.memberNo}` : "not granted"}`;
    }),
    "",
    "SIGNATURES",
    ...(work.confirmations.length
      ? work.confirmations.map((item) => {
          const when = item.respondedAt ? item.respondedAt.slice(0, 10) : "waiting";
          const note = item.note.trim() ? ` · “${item.note.trim()}”` : "";
          return `${item.name} <${item.email}> · ${item.kind} · ${item.status} · ${when}${note}`;
        })
      : ["No co-writer or publisher. The registering writer signed by lodging."]),
    "",
    "DESK REFERENCES",
    ...(work.filings.length
      ? work.filings.map((filing) => `${societyName(filing.society)} ${filing.reference}`)
      : ["Not lodged yet."]),
    "",
    "Folio keeps this notification, the mandate, and the signature trail. Each society still has to accept the work onto its own register.",
  ];
  return lines.filter((line) => line !== "").join("\n");
}

function writer(partial: Omit<Writer, "id"> & { id: string }): Writer {
  return partial;
}

function publisher(partial: Publisher): Publisher {
  return partial;
}

function granted(memberNo: string, signedName: string, grantedAt: string): Mandate {
  return { granted: true, memberNo, signedName, grantedAt };
}

export function seedWorks(): Work[] {
  const table: Work = {
    id: "work-table-mountain",
    title: "Table Mountain After Rain",
    altTitle: "",
    language: "English",
    genre: "Amapiano",
    writtenOn: "2026-08-14",
    territory: "World",
    iswc: "",
    registrationType: "CTB",
    textKind: "Music and text",
    catalogue: "Popular",
    instrumentation: "IV",
    capassoTerritory: "Domestic",
    released: true,
    alreadyRegistered: false,
    writers: [
      writer({
        id: "w-amahle",
        name: "Amahle Dlamini",
        email: "amahle.dlamini@example.com",
        ipi: "00123456789",
        role: "composer-author",
        pro: "SAMRO",
        isRegistrar: true,
        performing: 30,
        mechanical: 30,
      }),
      writer({
        id: "w-jonah",
        name: "Jonah Pietersen",
        email: "jonah.pietersen@example.com",
        ipi: "00987654321",
        role: "author",
        pro: "SAMRO",
        isRegistrar: false,
        performing: 20,
        mechanical: 20,
      }),
    ],
    publishers: [
      publisher({
        id: "p-klipdrift",
        name: "Klipdrift Music Publishing",
        email: "rights@klipdrift-music.example",
        ipi: "00555111222",
        performing: 50,
        mechanical: 50,
      }),
    ],
    recording: {
      hasRecording: true,
      artist: "Amahle Dlamini & Jonah Pietersen",
      isrc: "ZA-K3M-26-00418",
      label: "Klipdrift Records",
      duration: "3:42",
      releasedOn: "",
      album: "Table Mountain After Rain",
      versionTitle: "",
      distributor: "Self-distributed",
      performerRole: "FA",
      musicians: [
        { id: "m-drums", name: "Sibusiso Khumalo", part: "Drums", partNote: "", status: "NF" },
        { id: "m-guitar", name: "Lerato Molefe", part: "Guitar", partNote: "", status: "NF" },
        { id: "m-vox", name: "Amahle Dlamini", part: "Vocals", partNote: "", status: "FA" },
      ],
    },
    mandates: {
      samro: granted("MBR-448210", "Amahle Dlamini", "2026-10-20T08:00:00.000Z"),
      capasso: granted("CAP-22911", "Amahle Dlamini", "2026-10-20T08:02:00.000Z"),
      sampra: granted("SPR-7781", "Amahle Dlamini", "2026-10-20T08:04:00.000Z"),
    },
    confirmations: [
      {
        token: "jonah-rain",
        partyId: "w-jonah",
        kind: "writer",
        name: "Jonah Pietersen",
        email: "jonah.pietersen@example.com",
        status: "pending",
        note: "",
        respondedAt: null,
      },
      {
        token: "klipdrift-rain",
        partyId: "p-klipdrift",
        kind: "publisher",
        name: "Klipdrift Music Publishing",
        email: "rights@klipdrift-music.example",
        status: "pending",
        note: "",
        respondedAt: null,
      },
    ],
    filings: [],
    sentAt: "2026-10-20T08:10:00.000Z",
    createdAt: "2026-10-20T08:00:00.000Z",
    updatedAt: "2026-10-20T08:10:00.000Z",
  };

  const street: Work = {
    id: "work-long-street",
    title: "Long Street, 2am",
    altTitle: "",
    language: "English",
    genre: "Jazz",
    writtenOn: "2025-11-02",
    territory: "World",
    iswc: "T-345.678.901-0",
    registrationType: "CTB",
    textKind: "Music",
    catalogue: "Popular",
    instrumentation: "IS",
    capassoTerritory: "Domestic",
    released: true,
    alreadyRegistered: false,
    writers: [
      writer({
        id: "w-lindiwe",
        name: "Lindiwe Naidoo",
        email: "lindiwe.naidoo@example.com",
        ipi: "00444555666",
        role: "composer",
        pro: "SAMRO",
        isRegistrar: true,
        performing: 40,
        mechanical: 40,
      }),
    ],
    publishers: [
      publisher({
        id: "p-ocean",
        name: "Ocean Drive Music",
        email: "catalogue@oceandrive.example",
        ipi: "00777888999",
        performing: 60,
        mechanical: 60,
      }),
    ],
    recording: {
      hasRecording: true,
      artist: "Lindiwe Naidoo",
      isrc: "ZA-OD4-25-11002",
      label: "Ocean Drive",
      duration: "4:05",
      releasedOn: "2026-02-14",
      album: "Long Street, 2am",
      versionTitle: "",
      distributor: "Ocean Drive",
      performerRole: "FA",
      musicians: [{ id: "m-sax", name: "Thabo Jacobs", part: "Saxophone", partNote: "", status: "NF" }],
    },
    mandates: {
      samro: granted("MBR-102944", "Lindiwe Naidoo", "2026-02-20T09:00:00.000Z"),
      capasso: granted("CAP-88310", "Lindiwe Naidoo", "2026-02-20T09:01:00.000Z"),
      sampra: granted("SPR-22018", "Lindiwe Naidoo", "2026-02-20T09:02:00.000Z"),
    },
    confirmations: [
      {
        token: "ocean-street",
        partyId: "p-ocean",
        kind: "publisher",
        name: "Ocean Drive Music",
        email: "catalogue@oceandrive.example",
        status: "confirmed",
        note: "",
        respondedAt: "2026-02-21T11:24:00.000Z",
      },
    ],
    filings: [
      { society: "samro", reference: referenceFor("samro", "work-long-street"), filedAt: "2026-02-21T11:24:00.000Z" },
      { society: "capasso", reference: referenceFor("capasso", "work-long-street"), filedAt: "2026-02-21T11:24:00.000Z" },
      { society: "sampra", reference: referenceFor("sampra", "work-long-street"), filedAt: "2026-02-21T11:24:00.000Z" },
    ],
    sentAt: "2026-02-20T09:05:00.000Z",
    createdAt: "2026-02-20T09:00:00.000Z",
    updatedAt: "2026-02-21T11:24:00.000Z",
  };

  const kitchen: Work = {
    id: "work-kwaito",
    title: "Kwaito in the Kitchen",
    altTitle: "",
    language: "English",
    genre: "Kwaito",
    writtenOn: "2026-10-26",
    territory: "Southern Africa",
    iswc: "",
    registrationType: "CTB",
    textKind: "Music and text",
    catalogue: "Popular",
    instrumentation: "IV",
    capassoTerritory: "Domestic",
    released: false,
    alreadyRegistered: false,
    writers: [
      writer({
        id: "w-emile",
        name: REGISTRAR_DEFAULT,
        email: "",
        ipi: "",
        role: "composer-author",
        pro: "None yet",
        isRegistrar: true,
        performing: 100,
        mechanical: 100,
      }),
    ],
    publishers: [],
    recording: {
      hasRecording: true,
      artist: "",
      isrc: "",
      label: "",
      duration: "",
      releasedOn: "",
      album: "",
      versionTitle: "",
      distributor: "",
      performerRole: "FA",
      musicians: [],
    },
    mandates: {
      samro: emptyMandate(),
      capasso: emptyMandate(),
      sampra: emptyMandate(),
    },
    confirmations: [],
    filings: [],
    sentAt: null,
    createdAt: "2026-10-26T12:00:00.000Z",
    updatedAt: "2026-10-26T12:00:00.000Z",
  };

  return [table, kitchen, street];
}

export function blankWork(registrarName: string): Work {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  return {
    id: crypto.randomUUID(),
    title: "",
    altTitle: "",
    language: "English",
    genre: "Amapiano",
    writtenOn: today,
    territory: "World",
    iswc: "",
    registrationType: "CTB",
    textKind: "Music and text",
    catalogue: "Popular",
    instrumentation: "IV",
    capassoTerritory: "Domestic",
    released: false,
    alreadyRegistered: false,
    writers: [
      {
        id: crypto.randomUUID(),
        name: "",
        email: "",
        ipi: "",
        role: "composer-author",
        pro: "SAMRO",
        isRegistrar: true,
        performing: 0,
        mechanical: 0,
      },
    ],
    publishers: [],
    recording: {
      hasRecording: false,
      artist: "",
      isrc: "",
      label: "",
      duration: "",
      releasedOn: "",
      album: "",
      versionTitle: "",
      distributor: "",
      performerRole: "FA",
      musicians: [],
    },
    mandates: {
      samro: emptyMandate(),
      capasso: emptyMandate(),
      sampra: emptyMandate(),
    },
    confirmations: [],
    filings: [],
    sentAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function newId(): string {
  return crypto.randomUUID();
}

export function exampleSong(current: Work): Work {
  return {
    ...current,
    title: "Table Mountain After Rain",
    altTitle: "",
    language: "English",
    genre: "Amapiano",
    territory: "World",
    capassoTerritory: "Domestic",
    released: true,
    alreadyRegistered: false,
    writers: [
      writer({
        id: "ex-amahle",
        name: "Amahle Dlamini",
        email: "amahle@example.com",
        ipi: "00123456789",
        role: "composer-author",
        pro: "SAMRO",
        isRegistrar: true,
        performing: 30,
        mechanical: 30,
      }),
      writer({
        id: "ex-jonah",
        name: "Jonah Pietersen",
        email: "jonah@example.com",
        ipi: "00987654321",
        role: "author",
        pro: "SAMRO",
        isRegistrar: false,
        performing: 20,
        mechanical: 20,
      }),
    ],
    publishers: [
      publisher({
        id: "ex-klipdrift",
        name: "Klipdrift Music Publishing",
        email: "",
        ipi: "",
        performing: 50,
        mechanical: 50,
      }),
    ],
    recording: {
      ...current.recording,
      hasRecording: true,
      artist: "Amahle Dlamini",
      isrc: "ZA-K3M-26-00418",
      label: "Klipdrift Records",
      musicians: [
        { id: "ex-drums", name: "Sibusiso Khumalo", part: "Drums", partNote: "", status: "NF" },
        { id: "ex-guitar", name: "Lerato Molefe", part: "Guitar", partNote: "", status: "NF" },
        { id: "ex-vox", name: "Amahle Dlamini", part: "Vocals", partNote: "", status: "FA" },
      ],
    },
    confirmations: [],
    filings: [],
    sentAt: null,
  };
}
