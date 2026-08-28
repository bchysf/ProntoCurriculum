import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, publicProfilesTable } from "@workspace/db";

// Excludes 0/O/1/l/i — avoids visual ambiguity when a slug is read aloud or retyped.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

function randomSlug(length = 7): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function generateUniqueSlug(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = randomSlug();
    const [existing] = await db
      .select({ id: publicProfilesTable.id })
      .from(publicProfilesTable)
      .where(eq(publicProfilesTable.slug, candidate));
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique slug after 5 attempts");
}
