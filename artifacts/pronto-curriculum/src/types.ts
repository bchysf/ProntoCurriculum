export type Page = 'home' | 'builder-step1' | 'builder-step2';
export type ModalType = 'signup' | 'pricing' | 'import' | 'success' | 'ai-loading' | null;
export type TemplateType = 'modern' | 'minimal' | 'executive' | 'europass' | 'professionale' | 'classico' | 'tecnico' | 'compatto' | 'milano' | 'elegante' | 'nordico' | 'corporate';

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
  languages: Language[];
  photo?: string;
}
