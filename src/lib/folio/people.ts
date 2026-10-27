import type { MusicianPart, Pro, Role, Work } from "@/lib/folio/model";

export type Person = {
  id: string;
  name: string;
  email: string;
  ipi: string;
  role: Role;
  pro: Pro;
  part: MusicianPart;
  writer: boolean;
  publisher: boolean;
  player: boolean;
};

export function personId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `person-${slug || "unnamed"}`;
}

export function peopleFromWorks(works: Work[]): Person[] {
  const map = new Map<string, Person>();

  function touch(name: string, patch: Partial<Person>) {
    const clean = name.trim();
    if (!clean) return;
    const id = personId(clean);
    const current = map.get(id) ?? {
      id,
      name: clean,
      email: "",
      ipi: "",
      role: "composer-author" as Role,
      pro: "SAMRO" as Pro,
      part: "Vocals" as MusicianPart,
      writer: false,
      publisher: false,
      player: false,
    };
    map.set(id, {
      ...current,
      ...patch,
      id,
      name: clean,
      email: patch.email?.trim() || current.email,
      ipi: patch.ipi?.trim() || current.ipi,
      writer: current.writer || Boolean(patch.writer),
      publisher: current.publisher || Boolean(patch.publisher),
      player: current.player || Boolean(patch.player),
    });
  }

  for (const work of works) {
    for (const writer of work.writers) {
      touch(writer.name, {
        email: writer.email,
        ipi: writer.ipi,
        role: writer.role,
        pro: writer.pro,
        writer: true,
      });
    }
    for (const publisher of work.publishers) {
      touch(publisher.name, { email: publisher.email, ipi: publisher.ipi, publisher: true, role: "composer" });
    }
    for (const musician of work.recording.musicians ?? []) {
      touch(musician.name, { part: musician.part, player: true });
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function mergePerson(people: Person[], person: Person): Person[] {
  const name = person.name.trim();
  if (!name) return people;
  const id = person.id || personId(name);
  const next = { ...person, id, name };
  const index = people.findIndex((item) => item.id === id || item.name.toLowerCase() === name.toLowerCase());
  if (index === -1) return [...people, next].sort((a, b) => a.name.localeCompare(b.name));
  const current = people[index];
  if (!current) return people;
  const merged = {
    ...current,
    ...next,
    id: current.id,
    email: next.email || current.email,
    ipi: next.ipi || current.ipi,
    writer: current.writer || next.writer,
    publisher: current.publisher || next.publisher,
    player: current.player || next.player,
  };
  return people.map((item, itemIndex) => (itemIndex === index ? merged : item));
}
