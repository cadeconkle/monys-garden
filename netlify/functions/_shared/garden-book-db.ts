import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { gardenBook } from "../../../db/schema";
import { emptyGarden, type GardenBook } from "../../../src/garden";

export async function loadStoredGarden(): Promise<GardenBook> {
  const [row] = await db.select().from(gardenBook).where(eq(gardenBook.id, 1)).limit(1);
  if (!row) {
    return emptyGarden();
  }
  return JSON.parse(row.book) as GardenBook;
}

export async function saveStoredGarden(garden: GardenBook) {
  const book = JSON.stringify(garden);
  await db
    .insert(gardenBook)
    .values({ id: 1, book })
    .onConflictDoUpdate({
      target: gardenBook.id,
      set: { book },
    });
}
