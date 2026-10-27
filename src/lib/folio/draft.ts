import { createServerFn } from "@tanstack/react-start";
import { GENRES, MUSICIAN_PARTS, ROLES } from "@/lib/folio/model";

export type SongDraft = {
  title: string;
  altTitle: string;
  duration: string;
  genre: string;
  language: string;
  artist: string;
  isrc: string;
  label: string;
  writers: { name: string; role: string; performing: number; mechanical: number }[];
  publisher: { name: string; performing: number; mechanical: number } | null;
  musicians: { name: string; part: string }[];
};

function clip(value: string, max: number): string {
  const text = value.trim();
  return text.length > max ? text.slice(0, max) : text;
}

function asDraft(value: unknown): SongDraft | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const writers = Array.isArray(record.writers) ? record.writers : [];
  const musicians = Array.isArray(record.musicians) ? record.musicians : [];
  const publisher = record.publisher && typeof record.publisher === "object" ? (record.publisher as Record<string, unknown>) : null;
  return {
    title: clip(String(record.title ?? ""), 120),
    altTitle: clip(String(record.altTitle ?? ""), 120),
    duration: clip(String(record.duration ?? ""), 8),
    genre: clip(String(record.genre ?? ""), 40),
    language: clip(String(record.language ?? "English"), 40),
    artist: clip(String(record.artist ?? ""), 120),
    isrc: clip(String(record.isrc ?? ""), 20),
    label: clip(String(record.label ?? ""), 120),
    writers: writers.slice(0, 8).map((item) => {
      const writer = item as Record<string, unknown>;
      return {
        name: clip(String(writer.name ?? ""), 80),
        role: clip(String(writer.role ?? "composer-author"), 40),
        performing: Math.max(0, Math.min(100, Number(writer.performing) || 0)),
        mechanical: Math.max(0, Math.min(100, Number(writer.mechanical) || 0)),
      };
    }).filter((writer) => writer.name),
    publisher: publisher && clip(String(publisher.name ?? ""), 80)
      ? {
          name: clip(String(publisher.name ?? ""), 80),
          performing: Math.max(0, Math.min(100, Number(publisher.performing) || 0)),
          mechanical: Math.max(0, Math.min(100, Number(publisher.mechanical) || 0)),
        }
      : null,
    musicians: musicians.slice(0, 12).map((item) => {
      const musician = item as Record<string, unknown>;
      return { name: clip(String(musician.name ?? ""), 80), part: clip(String(musician.part ?? "Other"), 40) };
    }).filter((musician) => musician.name),
  };
}

export const draftSong = createServerFn({ method: "POST" })
  .validator((input: { note: string; people: string }) => {
    const note = clip(String(input?.note ?? ""), 800);
    if (!note) throw new Error("Describe the song first.");
    return { note, people: clip(String(input?.people ?? ""), 1500) };
  })
  .handler(async ({ data }): Promise<{ ok: true; draft: SongDraft } | { ok: false; error: string }> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "Grok is not available on this desk." };

    const instructions = `Turn the note into one South African song registration. Reply with JSON only.
Keys: title, altTitle, duration (m:ss or ""), genre (one of ${GENRES.join(", ")}), language, artist, isrc, label,
writers (array of {name, role, performing, mechanical}), publisher (object or null), musicians (array of {name, part}).
role is one of ${ROLES.map((role) => role.id).join(", ")}.
part is one of ${MUSICIAN_PARTS.join(", ")}.
performing and mechanical are integers. Writers plus publisher must each total 100.
A beat-maker or producer who wrote music is a composer, not a musician, unless they also played.
A drummer, guitarist, or session producer is a musician. Use people names from the roster when they match.
Known people:\n${data.people || "none"}`;

    let response: Response;
    try {
      response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 500,
          temperature: 0.2,
          messages: [
            { role: "system", content: instructions },
            { role: "user", content: data.note },
          ],
        }),
      });
    } catch {
      return { ok: false, error: "Grok could not be reached." };
    }
    if (!response.ok) return { ok: false, error: "Grok could not draft that." };
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    const json = text.replace(/^```json\s*|```$/g, "").trim();
    try {
      const draft = asDraft(JSON.parse(json));
      if (!draft || !draft.title || draft.writers.length === 0) return { ok: false, error: "Grok did not return a song." };
      return { ok: true, draft };
    } catch {
      return { ok: false, error: "Grok did not return a song." };
    }
  });
