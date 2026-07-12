export type Page = 'home' | 'builder-step1' | 'builder-step2' | 'archivio' | 'tailor' | 'candidature' | 'dashboard' | 'privacy' | 'terms' | 'cookie' | 'guida-cv' | 'punteggio-ats' | 'cv-europass' | 'esempi-cv' | 'blog' | 'blog-article' | 'cover-letter' | 'admin' | 'referral' | 'concorsi';
export type ModalType = 'signup' | 'pricing' | 'success' | 'ai-loading' | null;
export type TemplateType = 'modern' | 'minimal' | 'executive' | 'europass' | 'professionale' | 'classico' | 'tecnico' | 'compatto' | 'milano' | 'elegante' | 'nordico' | 'corporate' | 'europass_pubblico';

export interface Experience {
  id: string;
  company: string;
  role: string;
  city: string;
  from: string;
  to: string;
  desc: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  grade: string;
  from: string;
  to: string;
}

export interface Language {
  id: string;
  name: string;
  level: string;
}

export interface SkillCategory {
  name: string;
  skills: string[];
}

export interface CVData {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: string[];
  skillCategories?: SkillCategory[];
  languages: Language[];
  photo?: string;
}

export interface SavedTailoredCv {
  id: string;
  userId: string;
  jobTitle: string;
  jobDescription: string;
  cvData: CVData;
  template?: string;
  createdAt: string;
}

export interface SavedCV {
  id: string;
  userId: string;
  name: string;
  cvData: CVData;
  template: string;
  createdAt: string;
  updatedAt: string;
}
