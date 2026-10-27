import { createServerFn } from "@tanstack/react-start";

export type DeskTurn = { role: "user" | "assistant"; text: string };

const SYSTEM = `You are the clerk on Folio, a South African music registration desk.
Answer in plain sentences. Be short.
You can see the desk snapshot in the latest user message. Use only that, plus these rules.
Folio does not log into SAMRO, CAPASSO, or SAMPRA and does not hold portal passwords.
A mandate is an instruction kept on this desk. A desk reference is not a society acceptance.
SAMRO is the performing right in the composition. CAPASSO is the mechanical right. SAMPRA is the recording: performers and the label.
There is no role called Producer. A beat-maker is a composer (C) at SAMRO and CAPASSO. A producer who played, programmed, or directed the session is usually a non-featured performer (NF) at SAMPRA. Owning the master is the label side, not a writer share.
Do not invent shares, signatures, or filing numbers. If the snapshot does not say, say so.
Do not ask for ID numbers, banking, or portal passwords.`;

function clip(value: string, max: number): string {
  const text = value.trim();
  return text.length > max ? text.slice(0, max) : text;
}

export const askDesk = createServerFn({ method: "POST" })
  .validator((input: { question: string; history: DeskTurn[]; snapshot: string }) => {
    const question = clip(String(input?.question ?? ""), 500);
    if (!question) throw new Error("Ask something about the desk.");
    const history = (Array.isArray(input?.history) ? input.history : [])
      .slice(-6)
      .map((turn) => ({
        role: turn?.role === "assistant" ? ("assistant" as const) : ("user" as const),
        text: clip(String(turn?.text ?? ""), 800),
      }))
      .filter((turn) => turn.text.length > 0);
    return { question, history, snapshot: clip(String(input?.snapshot ?? ""), 6000) };
  })
  .handler(async ({ data }): Promise<{ ok: true; text: string } | { ok: false; error: string }> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "Grok is not available on this desk." };

    const messages = [
      { role: "system", content: SYSTEM },
      ...data.history.map((turn) => ({ role: turn.role, content: turn.text })),
      {
        role: "user",
        content: `Desk snapshot:\n${data.snapshot || "The desk is empty."}\n\nQuestion: ${data.question}`,
      },
    ];

    let response: Response;
    try {
      response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 350,
          temperature: 0.3,
          messages,
        }),
      });
    } catch {
      return { ok: false, error: "Grok could not be reached." };
    }

    if (!response.ok) return { ok: false, error: "Grok could not answer just now." };
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false, error: "Grok returned an empty answer." };
    return { ok: true, text };
  });
