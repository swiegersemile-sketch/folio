import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeWork, seedWorks, tryLodge, type Confirmation, type Work } from "@/lib/folio/model";
import { mergePerson, peopleFromWorks, type Person } from "@/lib/folio/people";

type SavedSongwriter = {
  id: string;
  name: string;
  surname: string;
  ipi: string;
  membership: string;
  email?: string;
};

type Desk = {
  works: Work[];
  people: Person[];
  songwriters: SavedSongwriter[];
  admitted: boolean;
  saveWork: (work: Work) => void;
  rememberPerson: (person: Person) => void;
  saveSongwriter: (songwriter: SavedSongwriter) => void;
  removeSongwriter: (id: string) => void;
  removeWork: (id: string) => void;
  respond: (token: string, status: Confirmation["status"], note: string) => void;
  admit: () => void;
  resetSamples: () => void;
};

const samples = seedWorks();

export const useDesk = create<Desk>()(
  persist(
    (set) => ({
      works: samples,
      people: peopleFromWorks(samples),
      songwriters: [],
      admitted: false,
      saveWork: (work) =>
        set((state) => {
          const next = normalizeWork({ ...work, updatedAt: new Date().toISOString() });
          const exists = state.works.some((item) => item.id === next.id);
          return {
            works: exists ? state.works.map((item) => (item.id === next.id ? next : item)) : [next, ...state.works],
          };
        }),
      rememberPerson: (person) => set((state) => ({ people: mergePerson(state.people, person) })),
      saveSongwriter: (songwriter) =>
        set((state) => {
          const name = songwriter.name.trim();
          if (!name) return state;
          const next = {
            id: songwriter.id || name.toLowerCase(),
            name,
            surname: (songwriter.surname ?? "").trim(),
            ipi: (songwriter.ipi ?? "").replace(/[^\d]/g, "").slice(0, 11),
            membership: (songwriter.membership ?? "").trim(),
            email: (songwriter.email ?? "").trim(),
          };
          const index = state.songwriters.findIndex((item) => item.id === next.id || item.name.toLowerCase() === name.toLowerCase());
          const songwriters =
            index === -1
              ? [...state.songwriters, next]
              : state.songwriters.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next, id: item.id } : item));
          return { songwriters };
        }),
      removeSongwriter: (id) => set((state) => ({ songwriters: state.songwriters.filter((item) => item.id !== id) })),
      removeWork: (id) => set((state) => ({ works: state.works.filter((item) => item.id !== id) })),
      respond: (token, status, note) =>
        set((state) => ({
          works: state.works.map((work) => {
            if (!work.confirmations.some((item) => item.token === token)) return work;
            if (work.filings.length > 0) return work;
            const confirmations = work.confirmations.map((item) =>
              item.token === token
                ? { ...item, status, note: note.trim(), respondedAt: new Date().toISOString() }
                : item,
            );
            return tryLodge({ ...work, confirmations, updatedAt: new Date().toISOString() });
          }),
        })),
      admit: () => set({ admitted: true }),
      resetSamples: () => {
        const works = seedWorks();
        set((state) => ({ works, people: peopleFromWorks(works), admitted: state.admitted }));
      },
    }),
    {
      name: "folio.desk.v1",
      skipHydration: true,
      partialize: (state) => ({ works: state.works, people: state.people, songwriters: state.songwriters }),
      merge: (persisted, current) => {
        const saved = persisted as { works?: Work[]; people?: Person[]; songwriters?: SavedSongwriter[] } | undefined;
        const works = (saved?.works ?? current.works).map((work) => normalizeWork(work));
        const people = saved?.people?.length ? saved.people : peopleFromWorks(works);
        return { ...current, works, people, songwriters: saved?.songwriters ?? [], admitted: false };
      },
    },
  ),
);

if (typeof window !== "undefined") {
  queueMicrotask(() => {
    void useDesk.persist.rehydrate();
  });
}
