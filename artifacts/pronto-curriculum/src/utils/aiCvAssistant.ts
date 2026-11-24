import { CVData, Experience } from '../types';
import { sortExperiencesChronologically } from './sortExperiences';

export interface ChatExperienceInput {
  company: string;
  role: string;
  city: string;
  from: string;
  to: string;
  desc: string;
}

// Generic edit operations the chat assistant returns (validated server-side
// in routes/cvAssistant.ts), applied by applyCvEdits.
type PersonalField = 'firstName' | 'lastName' | 'title' | 'email' | 'phone' | 'city' | 'linkedin' | 'summary';
type ListSection = 'experiences' | 'additionalExperiences' | 'education' | 'languages' | 'certifications';

export type CvEdit =
  | { op: 'set_field'; field: PersonalField; value: string }
  | { op: 'add_item'; section: ListSection; item: Record<string, string>; position: 'start' | 'end' }
  | { op: 'update_item'; section: ListSection; id: string; fields: Record<string, string> }
  | { op: 'remove_item'; section: ListSection; id: string }
  | { op: 'move_item'; section: ListSection; id: string; to: 'up' | 'down' | 'top' | 'bottom' }
  | { op: 'add_skills'; values: string[] }
  | { op: 'remove_skills'; values: string[] }
  | { op: 'set_skills'; values: string[] }
  | { op: 'set_privacy_clause'; value: boolean }
  | { op: 'remove_photo' }
  | { op: 'sort_experiences' };

export type AssistantAction =
  | { type: 'edit_cv'; edits: CvEdit[] }
  | { type: 'search_archive'; experiences: ChatExperienceInput[] }
  | { type: 'save_cv' }
  | { type: 'tailor_cv'; jobText: string }
  | { type: 'set_font_scale'; mode: 'smaller' | 'larger' | 'fit_one_page' | 'reset' }
  | { type: 'review_cv'; country: string | null }
  | { type: 'none' };

export interface CvAssistantReply {
  reply: string;
  action: AssistantAction;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  text: string;
}

export async function aiCvAssistantChat(cvData: CVData, message: string, history: ChatHistoryMessage[], lang = 'IT'): Promise<CvAssistantReply> {
  // The photo is a base64 data URL — only whether one exists matters here.
  const { photo, ...rest } = cvData;
  const response = await fetch('/api/cv-assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      message,
      lang,
      history: history.slice(-8),
      cvData: { ...rest, hasPhoto: !!photo },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Errore durante l'elaborazione del messaggio");
  }

  return response.json() as Promise<CvAssistantReply>;
}

export function experienceInputToExperience(e: ChatExperienceInput): Experience {
  return { id: crypto.randomUUID(), company: e.company, role: e.role, city: e.city, from: e.from, to: e.to, desc: e.desc };
}

// Every list section's items share { id } plus string fields, so the edit
// ops can treat them uniformly.
type ListItem = { id: string } & Record<string, string>;

function moveItem<T>(list: T[], index: number, to: 'up' | 'down' | 'top' | 'bottom'): T[] {
  const target = to === 'up' ? index - 1 : to === 'down' ? index + 1 : to === 'top' ? 0 : list.length - 1;
  if (target < 0 || target >= list.length || target === index) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function applyCvEdit(cv: CVData, e: CvEdit): CVData {
  switch (e.op) {
    case 'set_field':
      return { ...cv, [e.field]: e.value };
    case 'add_item':
    case 'update_item':
    case 'remove_item':
    case 'move_item': {
      const list = (cv[e.section] ?? []) as unknown as ListItem[];
      let next: ListItem[] = list;
      if (e.op === 'add_item') {
        const item = { ...e.item, id: e.item.id || crypto.randomUUID() } as ListItem;
        next = e.position === 'start' ? [item, ...list] : [...list, item];
      } else if (e.op === 'update_item') {
        next = list.map(i => (i.id === e.id ? { ...i, ...e.fields } : i));
      } else if (e.op === 'remove_item') {
        next = list.filter(i => i.id !== e.id);
      } else {
        next = moveItem(list, list.findIndex(i => i.id === e.id), e.to);
      }
      return { ...cv, [e.section]: next };
    }
    case 'add_skills':
      return { ...cv, skills: [...new Set([...cv.skills, ...e.values])] };
    case 'remove_skills': {
      // Categorised skills are what the preview renders when present, so they
      // must be removed there too, not just from the flat list.
      const drop = new Set(e.values.map(v => v.toLowerCase()));
      return {
        ...cv,
        skills: cv.skills.filter(s => !drop.has(s.toLowerCase())),
        skillCategories: cv.skillCategories
          ?.map(c => ({ ...c, skills: c.skills.filter(s => !drop.has(s.toLowerCase())) }))
          .filter(c => c.skills.length > 0),
      };
    }
    case 'set_skills':
      return { ...cv, skills: [...new Set(e.values)], skillCategories: undefined };
    case 'set_privacy_clause':
      return { ...cv, includePrivacyClause: e.value };
    case 'remove_photo':
      return { ...cv, photo: undefined };
    case 'sort_experiences':
      return { ...cv, experiences: sortExperiencesChronologically(cv.experiences) };
  }
}

export function applyCvEdits(cvData: CVData, edits: CvEdit[]): CVData {
  return edits.reduce(applyCvEdit, cvData);
}

// ── CV review ───────────────────────────────────────────────────────────────

export type ReviewChange =
  | { type: 'set_title'; value: string }
  | { type: 'set_summary'; value: string }
  | { type: 'set_experience_desc'; experienceId: string; value: string }
  | { type: 'add_skills'; values: string[] }
  | { type: 'remove_skills'; values: string[] }
  | { type: 'remove_photo' }
  | { type: 'set_privacy_clause'; value: boolean }
  | { type: 'sort_experiences' };

export interface ReviewWeakness {
  id: string;
  severity: 'high' | 'medium' | 'low';
  section: string;
  title: string;
  detail: string;
  norm: string;
  fix: string;
  change: ReviewChange | null;
}

export interface CvReview {
  country: string;
  countryName: string;
  score: number;
  verdict: string;
  weaknesses: ReviewWeakness[];
}

export async function aiCvReview(cvData: CVData, country: string, targetRole: string, uiLang: string, cvLang: string): Promise<CvReview> {
  // The photo is a base64 data URL — only whether one exists matters here.
  const { photo, ...rest } = cvData;
  // Computed here with the real date parser rather than left to the model,
  // which is unreliable at comparing free-text dates.
  const sorted = sortExperiencesChronologically(cvData.experiences);
  const experiencesSorted = sorted.every((e, i) => e.id === cvData.experiences[i]?.id);
  const response = await fetch('/api/cv-assistant/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ country, targetRole, uiLang, cvLang, cvData: { ...rest, hasPhoto: !!photo, experiencesSorted } }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore durante la revisione del CV');
  }

  return response.json() as Promise<CvReview>;
}

function reviewChangeToEdit(c: ReviewChange): CvEdit {
  switch (c.type) {
    case 'set_title': return { op: 'set_field', field: 'title', value: c.value };
    case 'set_summary': return { op: 'set_field', field: 'summary', value: c.value };
    case 'set_experience_desc': return { op: 'update_item', section: 'experiences', id: c.experienceId, fields: { desc: c.value } };
    case 'add_skills': return { op: 'add_skills', values: c.values };
    case 'remove_skills': return { op: 'remove_skills', values: c.values };
    case 'remove_photo': return { op: 'remove_photo' };
    case 'set_privacy_clause': return { op: 'set_privacy_clause', value: c.value };
    case 'sort_experiences': return { op: 'sort_experiences' };
  }
}

export function applyReviewChanges(cvData: CVData, changes: ReviewChange[]): CVData {
  return applyCvEdits(cvData, changes.map(reviewChangeToEdit));
}
