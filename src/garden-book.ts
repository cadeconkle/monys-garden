import { emptyGarden, type GardenBook } from "./garden";

export type GardenBookStore = {
  load(): Promise<GardenBook>;
  save(garden: GardenBook): Promise<void>;
};

export function createMemoryGardenBook(start: GardenBook = emptyGarden()): GardenBookStore {
  let book = start;

  return {
    async load() {
      return book;
    },
    async save(garden) {
      book = garden;
    },
  };
}

export function createNetlifyGardenBook(): GardenBookStore {
  return {
    async load() {
      try {
        const response = await fetch("/api/garden");
        if (!response.ok) {
          return emptyGarden();
        }
        return (await response.json()) as GardenBook;
      } catch {
        return emptyGarden();
      }
    },
    async save(garden) {
      try {
        await fetch("/api/garden", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(garden),
        });
      } catch {
        return;
      }
    },
  };
}
