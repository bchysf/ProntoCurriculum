import { CVData } from '../types';

// The Mario Rossi sample shown to anyone who has never touched their CV yet
// (anonymous visitors, or a signed-in user with no saved profile). Real
// personal-data prefill for signed-in users with a saved profile happens
// separately in BuilderStep2 (see applySavedProfile) — this is only the
// placeholder-before-that-kicks-in state.
export const DEFAULT_CV_DATA: CVData = {
  firstName: 'Mario',
  lastName: 'Rossi',
  title: 'Senior Software Engineer',
  email: 'mario.rossi@email.com',
  phone: '+39 333 1234567',
  city: 'Milano',
  linkedin: '',
  summary: 'Ingegnere del software con 8 anni di esperienza nello sviluppo di applicazioni web scalabili. Specializzato in architetture cloud e metodologie Agile. Appassionato di tecnologie emergenti e risoluzione di problemi complessi.',
  experiences: [{
    id: '1',
    company: 'Tech Solutions Srl',
    role: 'Lead Developer',
    city: 'Milano',
    from: 'Mar 2020',
    to: 'Presente',
    desc: 'Ho guidato un team di 5 sviluppatori nella progettazione e implementazione di microservizi cloud-native. Ho ridotto i tempi di deployment del 40% attraverso l\'automazione CI/CD e migliorato le performance del sistema del 60%.',
  }],
  education: [{
    id: '1',
    institution: 'Università degli Studi di Milano',
    degree: 'Laurea Magistrale in Ingegneria Informatica',
    grade: '110/110 con lode',
    from: '2014',
    to: '2016',
  }],
  skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker'],
  languages: [{ id: '1', name: 'Inglese', level: 'C1 - Avanzato' }],
};

export function isDefaultCvData(data: CVData): boolean {
  return JSON.stringify(data) === JSON.stringify(DEFAULT_CV_DATA);
}
