import { db, usersTable, userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

interface CvLikeData {
  firstName?: string;
  lastName?: string;
  title?: string;
  phone?: string;
  city?: string;
  linkedin?: string;
  summary?: string;
  skills?: string[];
  skillCategories?: Array<{ name?: string; skills?: string[] }>;
  education?: Array<{ id: string; institution: string; degree: string; grade: string; from: string; to: string }>;
  languages?: Array<{ id: string; name: string; level: string }>;
}

// Called after a CV is saved or downloaded: fills in the saved profile with
// whatever this CV has, so the next CV can be built from it. Never
// overwrites an existing non-empty field with a blank one, and never
// changes the account's name once it's set once — one account, one person.
export async function syncProfileFromCv(userId: string, cvData: CvLikeData): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (user && !user.firstName && !user.lastName && (cvData.firstName || cvData.lastName)) {
    await db
      .update(usersTable)
      .set({ firstName: cvData.firstName || null, lastName: cvData.lastName || null })
      .where(eq(usersTable.id, userId));
  }

  const [existing] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId));
  const skills = cvData.skillCategories?.length
    ? cvData.skillCategories.flatMap(c => c.skills ?? [])
    : cvData.skills;

  await db
    .insert(userProfilesTable)
    .values({
      userId,
      headline: cvData.title || null,
      phone: cvData.phone || null,
      city: cvData.city || null,
      linkedin: cvData.linkedin || null,
      summary: cvData.summary || null,
      skills: skills?.length ? skills : [],
      education: cvData.education?.length ? cvData.education : [],
      languages: cvData.languages?.length ? cvData.languages : [],
    })
    .onConflictDoUpdate({
      target: userProfilesTable.userId,
      set: {
        headline: cvData.title || existing?.headline || null,
        phone: cvData.phone || existing?.phone || null,
        city: cvData.city || existing?.city || null,
        linkedin: cvData.linkedin || existing?.linkedin || null,
        summary: cvData.summary || existing?.summary || null,
        skills: skills?.length ? skills : (existing?.skills ?? []),
        education: cvData.education?.length ? cvData.education : (existing?.education ?? []),
        languages: cvData.languages?.length ? cvData.languages : (existing?.languages ?? []),
        updatedAt: new Date(),
      },
    });
}
