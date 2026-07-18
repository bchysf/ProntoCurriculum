import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Page } from '../types';
import EditorialChrome, { useReveal, useSeoMeta } from '../components/EditorialChrome';

interface SalaryCalculatorProps {
  onNavigate: (page: Page, slug?: string) => void;
}

type CCNLType = 'commercio' | 'metalmeccanico' | 'turismo' | 'studi_professionali';

interface CCNLLevel {
  level: string;
  ral: number;
  description: string;
}

const CCNL_LABELS: Record<CCNLType, string> = {
  commercio: 'Commercio, Terziario e Servizi (Confcommercio)',
  metalmeccanico: 'Metalmeccanico ed Elettronico (Federmeccanica)',
  turismo: 'Turismo, Ristorazione e Alberghi (FIPE)',
  studi_professionali: 'Studi Professionali (Confprofessioni)',
};

const CCNL_LEVELS: Record<CCNLType, CCNLLevel[]> = {
  commercio: [
    { level: 'Quadro', ral: 48500, description: 'Direttori, institori e responsabili di filiale' },
    { level: '1° Livello', ral: 36200, description: 'Capi servizio, coordinatori di area e specialisti senior' },
    { level: '2° Livello', ral: 30800, description: 'Impiegati di concetto ad elevata specializzazione' },
    { level: '3° Livello', ral: 26400, description: 'Impiegati tecnici e amministrativi qualificati' },
    { level: '4° Livello', ral: 23200, description: 'Livello base impiegatizio, contabili, addetti vendite senior' },
    { level: '5° Livello', ral: 21100, description: 'Addetti alle vendite e impiegati d’ordine' },
    { level: '6° Livello', ral: 19200, description: 'Personale ausiliario ed esecutivo' },
    { level: '7° Livello', ral: 17800, description: 'Mansioni di pulizia o prima occupazione' },
  ],
  metalmeccanico: [
    { level: 'A1 (ex 8S/Quadro)', ral: 52000, description: 'Quadri e alte professionalità direttive' },
    { level: 'B3 (ex 7S)', ral: 39500, description: 'Specialisti di processo e coordinatori tecnici' },
    { level: 'B2 (ex 7)', ral: 35000, description: 'Progettisti, programmatori e tecnici senior' },
    { level: 'B1 (ex 6)', ral: 31200, description: 'Impiegati tecnici e operai altamente specializzati' },
    { level: 'C3 (ex 5S)', ral: 28400, description: 'Tecnici intermedi, programmatori junior, capireparto' },
    { level: 'C2 (ex 5)', ral: 25800, description: 'Operai specializzati e impiegati amministrativi' },
    { level: 'C1 (ex 4)', ral: 23800, description: 'Operai qualificati e impiegati d’ordine' },
    { level: 'D1 (ex 3)', ral: 21900, description: 'Personale operativo d’ingresso' },
  ],
  turismo: [
    { level: 'Quadro', ral: 44000, description: 'Direttori d’albergo e capi settore complessi' },
    { level: '1° Livello', ral: 33500, description: 'Capi servizio e responsabili di reparto senior' },
    { level: '2° Livello', ral: 28200, description: 'Maître, chef di cucina, impiegati di concetto' },
    { level: '3° Livello', ral: 24200, description: 'Receptionist esperti, barman qualificati, cuochi' },
    { level: '4° Livello', ral: 21800, description: 'Camerieri di sala, receptionist, segretari d’ordine' },
    { level: '5° Livello', ral: 19800, description: 'Camerieri ai piani, aiuto cuoco, personale comune' },
    { level: '6° Livello', ral: 18200, description: 'Personale esecutivo d’ordine' },
    { level: '7° Livello', ral: 16900, description: 'Addetti alle pulizie e mansioni semplici' },
  ],
  studi_professionali: [
    { level: 'Quadro', ral: 42500, description: 'Responsabili di area complessa negli studi' },
    { level: '1° Livello', ral: 32400, description: 'Praticanti abilitati, coordinatori di segreteria' },
    { level: '2° Livello', ral: 27200, description: 'Impiegati di concetto con autonomia organizzativa' },
    { level: '3° Livello', ral: 23800, description: 'Contabili esperti, segretari di direzione' },
    { level: '4° Livello', ral: 21400, description: 'Archiviazione, inserimento dati, segretari base' },
    { level: '5° Livello', ral: 19500, description: 'Personale addetto a servizi ausiliari' },
  ],
};

const REGIONS: Record<string, { label: string; rate: number; note: string }> = {
  lombardia: { label: 'Lombardia', rate: 0.016, note: 'Aliquote a scaglioni, agevolazioni per famiglie con figli' },
  piemonte: { label: 'Piemonte', rate: 0.019, note: 'Tra le più alte d’Italia, maggiorata sopra i 15.000€' },
  veneto: { label: 'Veneto', rate: 0.0123, note: 'Aliquota base tra le più competitive del Nord' },
  altre: { label: 'Altre regioni', rate: 0.015, note: 'Valore medio nazionale indicativo' },
};

const FAQ_ITEMS: Array<[string, string]> = [
  ['Qual è la differenza tra 13 e 14 mensilità in busta paga?', 'La RAL è un importo annuale fisso: 13 o 14 mensilità non la cambiano, la ridistribuiscono. Con 13 mensilità la RAL si divide per 13 (tredicesima a dicembre); con 14 si divide per 14 (quattordicesima a giugno/luglio). Chi ha 14 mensilità percepisce un netto mensile ordinario più basso, compensato da due mensilità extra l’anno.'],
  ['Come funzionano i livelli di inquadramento nei CCNL?', 'Ogni contratto collettivo definisce livelli con una paga base tabellare minima. Nel CCNL Commercio, ad esempio, il 4° livello è il più comune per profili impiegatizi operativi, mentre 1° livello e Quadri sono figure direttive con RAL dai 36.000€ in su. Il calcolatore pre-carica stime medie di mercato per ogni livello.'],
  ['Cos’è l’Assegno Unico e come cambia le detrazioni per i figli?', 'Dal marzo 2022 le detrazioni IRPEF per figli a carico sotto i 21 anni sono state assorbite dall’Assegno Unico Universale, accreditato dall’INPS direttamente sul conto del genitore richiedente. Le detrazioni in busta paga restano valide solo per i figli a carico dai 21 anni in su.'],
  ['Quanto costa un dipendente all’azienda oltre alla RAL?', 'Oltre alla RAL, l’azienda versa i contributi INPS a proprio carico (circa il 28-30%) e accantona il TFR (circa il 7,41% della retribuzione annua). Per una RAL di 30.000€ il costo aziendale reale si aggira quindi intorno ai 40.000€ l’anno.'],
  ['Il risultato del calcolatore è la mia busta paga esatta?', 'È una stima accurata ma indicativa: il netto reale dipende da addizionale comunale esatta, welfare aziendale, fringe benefit, conguagli di fine anno e situazioni fiscali individuali. Per il valore certo fa fede il cedolino elaborato dal datore di lavoro.'],
];

const CALC_CSS = `
.pce .sc-hero { padding: 64px 0 48px; }
.pce .sc-hero .eyebrow { color: var(--ink-40); margin-bottom: 24px; }
.pce .sc-hero .eyebrow b { color: var(--accent); font-weight: 500; }
.pce .sc-hero h1 { font-family: var(--f-display); font-weight: 700; font-size: clamp(38px, 5vw, 68px); line-height: 0.98; letter-spacing: -0.04em; max-width: 860px; }
.pce .sc-hero .sub { font-size: 16px; color: var(--ink-60); max-width: 560px; line-height: 1.65; margin-top: 22px; font-weight: 500; }

.pce .sc-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 24px; align-items: start; padding-bottom: 24px; }

/* Cards */
.pce .sc-card { background: rgba(255,255,255,0.82); backdrop-filter: blur(6px); border: 1px solid var(--hair-soft); border-radius: 18px; padding: 32px; }
.pce .sc-card h2 { font-family: var(--f-display); font-weight: 700; font-size: 19px; letter-spacing: -0.02em; margin-bottom: 24px; }
.pce .sc-label { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-40); display: block; margin-bottom: 8px; }

/* Inputs */
.pce .sc-select, .pce .sc-input { width: 100%; font-family: var(--f-body); font-size: 14px; font-weight: 500; color: var(--ink); background: #fff; border: 1px solid var(--hair); border-radius: 10px; padding: 12px 14px; outline: none; transition: border-color .2s, box-shadow .2s; appearance: none; }
.pce .sc-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23565B66' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; cursor: pointer; }
.pce .sc-select:focus, .pce .sc-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,0.1); }
.pce .sc-field { margin-bottom: 20px; }
.pce .sc-hint { font-size: 11.5px; color: var(--ink-40); line-height: 1.5; margin-top: 7px; }

/* Mode switch + segmented control */
.pce .sc-seg { display: flex; background: rgba(20,23,31,0.045); border: 1px solid var(--hair-soft); border-radius: 11px; padding: 4px; gap: 4px; }
.pce .sc-seg button { flex: 1; font-family: var(--f-body); font-weight: 700; font-size: 13px; padding: 9px 10px; border: none; border-radius: 8px; background: transparent; color: var(--ink-60); cursor: pointer; transition: all .25s var(--ease); }
.pce .sc-seg button:hover { color: var(--ink); }
.pce .sc-seg button.on { background: #fff; color: var(--accent); box-shadow: 0 1px 3px rgba(20,23,31,0.12); }

/* Range */
.pce .sc-range { width: 100%; accent-color: var(--accent); margin-top: 12px; }

/* Steppers */
.pce .sc-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; }
.pce .sc-row > span { font-size: 13.5px; font-weight: 500; color: var(--ink); }
.pce .sc-step { display: flex; align-items: center; gap: 10px; }
.pce .sc-step button { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--hair); background: #fff; color: var(--ink); font-family: var(--f-mono); font-size: 14px; cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; }
.pce .sc-step button:hover { border-color: var(--accent); color: var(--accent); }
.pce .sc-step b { font-family: var(--f-mono); font-size: 14px; min-width: 22px; text-align: center; }
.pce .sc-check { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 13.5px; font-weight: 500; }
.pce .sc-check input { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }
.pce .sc-divider { border: none; border-top: 1px solid var(--hair-soft); margin: 22px 0 16px; }
.pce .sc-subhead { font-family: var(--f-display); font-weight: 600; font-size: 15px; letter-spacing: -0.01em; margin-bottom: 6px; }

/* Result panel */
.pce .sc-result { background: #14171F; border-radius: 18px; padding: 34px 32px; position: relative; overflow: hidden; }
.pce .sc-result::after { content: ''; position: absolute; width: 380px; height: 380px; border-radius: 50%; right: -130px; top: -160px; background: radial-gradient(circle, rgba(111,165,255,0.2) 0%, transparent 65%); }
.pce .sc-result > * { position: relative; z-index: 1; }
.pce .sc-result .mono { color: #9DB6FF; display: block; }
.pce .sc-net { font-family: var(--f-display); font-weight: 700; font-size: clamp(44px, 5vw, 62px); letter-spacing: -0.04em; line-height: 1.05; margin: 8px 0 2px; background: linear-gradient(96deg, #6FA5FF 0%, #8F8CFF 48%, #BE9CFF 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pce .sc-net-sub { font-size: 13px; color: #A6ACBA; margin-bottom: 22px; }
.pce .sc-kv { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 9px 0; border-top: 1px solid rgba(255,255,255,0.08); }
.pce .sc-kv span { font-size: 13px; color: #A6ACBA; }
.pce .sc-kv b { font-family: var(--f-mono); font-size: 13.5px; font-weight: 500; color: #F3F1EA; white-space: nowrap; }
.pce .sc-kv b.hl { color: #9DB6FF; }

/* Stacked bar */
.pce .sc-bar { display: flex; height: 10px; border-radius: 6px; overflow: hidden; margin: 20px 0 12px; background: rgba(255,255,255,0.08); }
.pce .sc-bar i { display: block; height: 100%; transition: width .6s var(--ease); }
.pce .sc-legend { display: flex; flex-wrap: wrap; gap: 8px 18px; }
.pce .sc-legend span { display: flex; align-items: center; gap: 7px; font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.05em; color: #8A8F9C; }
.pce .sc-legend i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Breakdown table */
.pce .sc-detail { margin-top: 24px; }
.pce .sc-detail h3 { font-family: var(--f-display); font-weight: 700; font-size: 17px; letter-spacing: -0.015em; margin-bottom: 14px; }
.pce .sc-drow { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--hair-soft); font-size: 13px; }
.pce .sc-drow span { color: var(--ink-60); }
.pce .sc-drow b { font-family: var(--f-mono); font-weight: 500; white-space: nowrap; color: var(--ink); }
.pce .sc-drow b.neg { color: #B42318; }
.pce .sc-drow b.pos { color: #12805C; }
.pce .sc-drow.tot { border-bottom: none; padding-top: 12px; }
.pce .sc-drow.tot span { color: var(--ink); font-weight: 700; }

/* Result CTA */
.pce .sc-result-cta { margin-top: 22px; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 16px 18px; }
.pce .sc-result-cta b { font-family: var(--f-display); font-size: 13.5px; color: #F3F1EA; display: block; margin-bottom: 4px; }
.pce .sc-result-cta p { font-size: 12px; color: #A6ACBA; line-height: 1.55; margin: 0 0 12px; }

/* SEO prose section */
.pce .sc-prose { max-width: 800px; font-size: 15px; color: var(--ink-60); line-height: 1.75; }
.pce .sc-prose p { margin-bottom: 16px; }
.pce .sc-prose b { color: var(--ink); font-weight: 700; }
.pce .sc-prose h3 { font-family: var(--f-display); font-weight: 700; font-size: 21px; letter-spacing: -0.02em; color: var(--ink); margin: 34px 0 14px; }
.pce .sc-prose ol, .pce .sc-prose ul { margin: 0 0 16px; padding-left: 22px; }
.pce .sc-prose li { margin-bottom: 10px; }
.pce .sc-prose li::marker { color: var(--accent); }
.pce .sc-prose a { color: var(--accent); text-decoration: none; font-weight: 500; border-bottom: 1px solid rgba(47,42,229,0.25); }
.pce .sc-table { width: 100%; border-collapse: collapse; margin: 8px 0 24px; font-size: 13.5px; }
.pce .sc-table th { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-40); font-weight: 500; text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--hair); }
.pce .sc-table td { padding: 11px 14px; border-bottom: 1px solid var(--hair-soft); color: var(--ink-60); }
.pce .sc-table td:first-child { color: var(--ink); font-weight: 700; }

@media (max-width: 900px) {
  .pce .sc-hero { padding: 44px 0 36px; }
  .pce .sc-grid { grid-template-columns: 1fr; }
  .pce .sc-card { padding: 24px 20px; }
  .pce .sc-result { padding: 26px 22px; }
}
`;

/** Eases a number toward its target for an odometer-style effect. */
function useAnimatedNumber(target: number, duration = 500) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * e;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(step);
    // rAF is suspended in background/occluded tabs: guarantee the final value anyway.
    const settle = setTimeout(() => { cancelAnimationFrame(raf); setValue(target); fromRef.current = target; }, duration + 120);
    return () => { clearTimeout(settle); cancelAnimationFrame(raf); fromRef.current = target; };
  }, [target, duration]);
  return value;
}

const eur = (n: number) => `€${Math.round(n).toLocaleString('it-IT')}`;

export default function SalaryCalculator({ onNavigate }: SalaryCalculatorProps) {
  const [ral, setRal] = useState<number>(23200);
  const [ccnl, setCcnl] = useState<CCNLType>('commercio');
  const [selectedLevelIndex, setSelectedLevelIndex] = useState<number>(4);
  const [region, setRegion] = useState<string>('lombardia');
  const [installments, setInstallments] = useState<number>(13);
  const [hasSpouse, setHasSpouse] = useState<boolean>(false);
  const [childrenOver21, setChildrenOver21] = useState<number>(0);
  const [childrenUnder21, setChildrenUnder21] = useState<number>(0);
  const [customRalMode, setCustomRalMode] = useState<boolean>(false);

  useReveal();
  useSeoMeta(
    'Calcolo Stipendio Netto dalla RAL 2026 — CCNL e Livelli | ProntoCurriculum',
    'Calcola lo stipendio netto mensile dalla RAL: aliquote IRPEF 2026 a 3 scaglioni, esonero contributivo INPS, detrazioni e addizionali regionali. Gratis.',
  );

  useEffect(() => {
    if (!customRalMode) {
      const levels = CCNL_LEVELS[ccnl];
      if (levels && levels[selectedLevelIndex]) setRal(levels[selectedLevelIndex].ral);
    }
  }, [ccnl, selectedLevelIndex, customRalMode]);

  const levels = CCNL_LEVELS[ccnl];

  // Regole fiscali 2026: esonero contributivo, IRPEF a 3 scaglioni, detrazioni, addizionali.
  const calc = useMemo(() => {
    const grossAnnual = ral;

    // 1. Contributi INPS a carico dipendente (9,19%) con taglio del cuneo:
    //    -7% fino a 1.923€/mese, -6% fino a 2.692€/mese, pieno oltre.
    const monthlyGross = grossAnnual / installments;
    let inpsRate = 0.0919;
    if (monthlyGross <= 1923) inpsRate -= 0.07;
    else if (monthlyGross <= 2692) inpsRate -= 0.06;
    const inpsAnnual = grossAnnual * inpsRate;

    // 2. Imponibile IRPEF
    const irpefTaxable = Math.max(0, grossAnnual - inpsAnnual);

    // 3. IRPEF lorda — 3 scaglioni: 23% fino a 28k, 35% fino a 50k, 43% oltre
    let grossIrpef = 0;
    if (irpefTaxable <= 28000) grossIrpef = irpefTaxable * 0.23;
    else if (irpefTaxable <= 50000) grossIrpef = 28000 * 0.23 + (irpefTaxable - 28000) * 0.35;
    else grossIrpef = 28000 * 0.23 + 22000 * 0.35 + (irpefTaxable - 50000) * 0.43;

    // 4. Detrazioni lavoro dipendente
    let employmentDeduction = 0;
    if (irpefTaxable <= 15000) employmentDeduction = 2026;
    else if (irpefTaxable <= 28000) employmentDeduction = 2026 + (1075 * (28000 - irpefTaxable)) / 13000;
    else if (irpefTaxable <= 50000) employmentDeduction = (3101 * (50000 - irpefTaxable)) / 22000;

    // 5. Detrazioni familiari a carico
    let spouseDeduction = 0;
    if (hasSpouse) {
      if (irpefTaxable <= 15000) spouseDeduction = 800;
      else if (irpefTaxable <= 40000) spouseDeduction = 690 + (110 * (40000 - irpefTaxable)) / 25000;
      else if (irpefTaxable <= 80000) spouseDeduction = (690 * (80000 - irpefTaxable)) / 40000;
    }
    // Figli >= 21 anni (i minori di 21 rientrano nell'Assegno Unico INPS)
    let childrenDeduction = 0;
    if (childrenOver21 > 0 && irpefTaxable <= 95000) {
      childrenDeduction = (950 * childrenOver21 * (95000 - irpefTaxable)) / 95000;
    }

    const totalDeductions = employmentDeduction + spouseDeduction + childrenDeduction;
    const netIrpef = Math.max(0, grossIrpef - totalDeductions);

    // 6. Addizionali regionale e comunale (media 0,8%)
    const regionalRate = REGIONS[region]?.rate ?? 0.015;
    const regionalTax = irpefTaxable * regionalRate;
    const municipalTax = irpefTaxable * 0.008;
    const totalSurcharges = regionalTax + municipalTax;

    // 7. Netto
    const netAnnual = irpefTaxable - netIrpef - totalSurcharges;
    const netMonthly = netAnnual / installments;

    // Costo azienda: RAL + TFR (7,41%) + INPS carico ditta (~28%)
    const totalEmployerCost = grossAnnual * (1 + 0.0741 + 0.28);

    return {
      grossAnnual, inpsAnnual, irpefTaxable, grossIrpef, totalDeductions, netIrpef,
      regionalTax, municipalTax, totalSurcharges, netAnnual, netMonthly, totalEmployerCost,
      taxPercent: grossAnnual > 0 ? ((netIrpef + inpsAnnual + totalSurcharges) / grossAnnual) * 100 : 0,
      netPercent: grossAnnual > 0 ? (netAnnual / grossAnnual) * 100 : 0,
      irpefPercent: grossAnnual > 0 ? (netIrpef / grossAnnual) * 100 : 0,
      inpsPercent: grossAnnual > 0 ? (inpsAnnual / grossAnnual) * 100 : 0,
      surchargePercent: grossAnnual > 0 ? (totalSurcharges / grossAnnual) * 100 : 0,
    };
  }, [ral, region, installments, hasSpouse, childrenOver21]);

  const animatedNet = useAnimatedNumber(calc.netMonthly);

  const faqSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }), []);

  return (
    <EditorialChrome onNavigate={onNavigate} active="calcolo-stipendio">
      <style>{CALC_CSS}</style>
      <main>
        <div className="shell">
          {/* HERO */}
          <section className="sc-hero">
            <div className="mono eyebrow rv on">Strumento gratuito <b>·</b> Fiscalità del lavoro 2026</div>
            <h1 className="rv on d1">Dalla RAL al <span className="grad">netto in busta.</span></h1>
            <p className="sub rv on d2">
              Inserisci la RAL o parti dal tuo CCNL e livello: aliquote IRPEF a 3 scaglioni,
              esonero contributivo INPS, detrazioni e addizionali regionali, aggiornati al 2026.
            </p>
          </section>

          {/* CALCULATOR */}
          <div className="sc-grid">
            {/* PARAMS */}
            <div className="sc-card rv on d2">
              <h2>Parametri della busta paga</h2>

              <div className="sc-field">
                <div className="sc-seg" role="tablist" aria-label="Modalità di calcolo">
                  <button role="tab" aria-selected={!customRalMode} className={!customRalMode ? 'on' : ''} onClick={() => setCustomRalMode(false)}>
                    Per CCNL e livello
                  </button>
                  <button role="tab" aria-selected={customRalMode} className={customRalMode ? 'on' : ''} onClick={() => setCustomRalMode(true)}>
                    RAL libera
                  </button>
                </div>
              </div>

              {!customRalMode ? (
                <>
                  <div className="sc-field">
                    <label className="sc-label" htmlFor="sc-ccnl">Contratto collettivo (CCNL)</label>
                    <select
                      id="sc-ccnl"
                      className="sc-select"
                      value={ccnl}
                      onChange={(e) => { setCcnl(e.target.value as CCNLType); setSelectedLevelIndex(0); }}
                    >
                      {(Object.keys(CCNL_LABELS) as CCNLType[]).map(key => (
                        <option key={key} value={key}>{CCNL_LABELS[key]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sc-field">
                    <label className="sc-label" htmlFor="sc-level">Livello di inquadramento</label>
                    <select
                      id="sc-level"
                      className="sc-select"
                      value={selectedLevelIndex}
                      onChange={(e) => setSelectedLevelIndex(parseInt(e.target.value))}
                    >
                      {levels.map((lvl, index) => (
                        <option key={lvl.level} value={index}>
                          {lvl.level} · RAL media {eur(lvl.ral)}
                        </option>
                      ))}
                    </select>
                    <p className="sc-hint">{levels[selectedLevelIndex]?.description}</p>
                  </div>
                </>
              ) : (
                <div className="sc-field">
                  <label className="sc-label" htmlFor="sc-ral">Reddito annuo lordo (RAL)</label>
                  <input
                    id="sc-ral"
                    className="sc-input"
                    type="number"
                    min={0}
                    step={500}
                    value={ral}
                    onChange={(e) => setRal(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <input
                    className="sc-range"
                    type="range"
                    min={10000}
                    max={100000}
                    step={500}
                    value={Math.min(100000, Math.max(10000, ral))}
                    onChange={(e) => setRal(parseInt(e.target.value))}
                    aria-label="Regola la RAL"
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="sc-field">
                  <label className="sc-label" htmlFor="sc-region">Regione di domicilio</label>
                  <select id="sc-region" className="sc-select" value={region} onChange={(e) => setRegion(e.target.value)}>
                    {Object.entries(REGIONS).map(([key, r]) => (
                      <option key={key} value={key}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sc-field">
                  <span className="sc-label">Mensilità</span>
                  <div className="sc-seg">
                    <button className={installments === 13 ? 'on' : ''} onClick={() => setInstallments(13)}>13</button>
                    <button className={installments === 14 ? 'on' : ''} onClick={() => setInstallments(14)}>14</button>
                  </div>
                </div>
              </div>

              <hr className="sc-divider" />
              <div className="sc-subhead">Familiari a carico</div>
              <p className="sc-hint" style={{ marginTop: 0, marginBottom: 10 }}>Determinano le detrazioni d'imposta applicate in busta.</p>

              <div className="sc-row">
                <label className="sc-check">
                  <input type="checkbox" checked={hasSpouse} onChange={(e) => setHasSpouse(e.target.checked)} />
                  Coniuge a carico
                </label>
              </div>
              <div className="sc-row">
                <span>Figli a carico (21 anni o più)</span>
                <div className="sc-step">
                  <button aria-label="Riduci" onClick={() => setChildrenOver21(Math.max(0, childrenOver21 - 1))}>−</button>
                  <b>{childrenOver21}</b>
                  <button aria-label="Aumenta" onClick={() => setChildrenOver21(childrenOver21 + 1)}>+</button>
                </div>
              </div>
              <div className="sc-row">
                <span>Figli a carico (sotto i 21 anni)</span>
                <div className="sc-step">
                  <button aria-label="Riduci" onClick={() => setChildrenUnder21(Math.max(0, childrenUnder21 - 1))}>−</button>
                  <b>{childrenUnder21}</b>
                  <button aria-label="Aumenta" onClick={() => setChildrenUnder21(childrenUnder21 + 1)}>+</button>
                </div>
              </div>
              {childrenUnder21 > 0 && (
                <p className="sc-hint">
                  I figli sotto i 21 anni non danno diritto a detrazioni in busta paga: sono coperti
                  dall'<b>Assegno Unico Universale</b> erogato direttamente dall'INPS.
                </p>
              )}
            </div>

            {/* RESULTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="sc-result rv on d3" aria-live="polite">
                <span className="mono">Netto mensile stimato · {installments} mensilità</span>
                <div className="sc-net">{eur(animatedNet)}</div>
                <div className="sc-net-sub">pari al {calc.netPercent.toFixed(1)}% della RAL</div>

                <div className="sc-kv"><span>Netto annuo totale</span><b className="hl">{eur(calc.netAnnual)}</b></div>
                <div className="sc-kv"><span>Pressione fiscale e contributiva</span><b>{calc.taxPercent.toFixed(1)}%</b></div>

                <div className="sc-bar" role="img" aria-label={`Ripartizione della RAL: netto ${calc.netPercent.toFixed(1)}%, IRPEF ${calc.irpefPercent.toFixed(1)}%, INPS ${calc.inpsPercent.toFixed(1)}%, addizionali ${calc.surchargePercent.toFixed(1)}%`}>
                  <i style={{ width: `${calc.netPercent}%`, background: 'linear-gradient(90deg, #6FA5FF, #8F8CFF)' }} />
                  <i style={{ width: `${calc.irpefPercent}%`, background: '#BE9CFF' }} />
                  <i style={{ width: `${calc.inpsPercent}%`, background: 'rgba(255,255,255,0.45)' }} />
                  <i style={{ width: `${calc.surchargePercent}%`, background: 'rgba(255,255,255,0.2)' }} />
                </div>
                <div className="sc-legend">
                  <span><i style={{ background: '#6FA5FF' }} />Netto {calc.netPercent.toFixed(1)}%</span>
                  <span><i style={{ background: '#BE9CFF' }} />IRPEF {calc.irpefPercent.toFixed(1)}%</span>
                  <span><i style={{ background: 'rgba(255,255,255,0.45)' }} />INPS {calc.inpsPercent.toFixed(1)}%</span>
                  <span><i style={{ background: 'rgba(255,255,255,0.2)' }} />Addizionali {calc.surchargePercent.toFixed(1)}%</span>
                </div>

                <div className="sc-result-cta">
                  <b>Ti serve per una candidatura?</b>
                  <p>Crea un CV calibrato su questo livello retributivo: l'AI scrive le esperienze in base alle richieste del mercato.</p>
                  <button className="btn btn-ink btn-sm" style={{ width: '100%' }} onClick={() => onNavigate('builder-step1')}>
                    Crea il CV per questa RAL →
                  </button>
                </div>
              </div>

              <div className="sc-card sc-detail rv on d3">
                <h3>Dettaglio analitico</h3>
                <div className="sc-drow"><span>Reddito annuo lordo (RAL)</span><b>{eur(calc.grossAnnual)}</b></div>
                <div className="sc-drow"><span>Contributi INPS a carico dipendente</span><b className="neg">−{eur(calc.inpsAnnual)}</b></div>
                <div className="sc-drow"><span>Imponibile fiscale (IRPEF)</span><b>{eur(calc.irpefTaxable)}</b></div>
                <div className="sc-drow"><span>IRPEF lorda</span><b>{eur(calc.grossIrpef)}</b></div>
                <div className="sc-drow"><span>Detrazioni d'imposta applicate</span><b className="pos">+{eur(calc.totalDeductions)}</b></div>
                <div className="sc-drow"><span>IRPEF netta dovuta</span><b className="neg">−{eur(calc.netIrpef)}</b></div>
                <div className="sc-drow"><span>Addizionale regionale ({((REGIONS[region]?.rate ?? 0.015) * 100).toFixed(2).replace('.', ',')}%)</span><b className="neg">−{eur(calc.regionalTax)}</b></div>
                <div className="sc-drow"><span>Addizionale comunale (media 0,8%)</span><b className="neg">−{eur(calc.municipalTax)}</b></div>
                <div className="sc-drow tot"><span>Costo totale per l'azienda (RAL + INPS + TFR)</span><b>{eur(calc.totalEmployerCost)}</b></div>
              </div>
            </div>
          </div>

          {/* GUIDE / SEO */}
          <section className="sec" style={{ padding: '80px 0 0' }} aria-label="Guida al calcolo dello stipendio netto">
            <div className="sec-head rv">
              <h2 className="sec-title">Come si passa dal lordo <span className="ac">al netto.</span></h2>
              <span className="mono sec-num">Guida — Busta paga</span>
            </div>
            <div className="sc-prose rv">
              <p>
                Gli annunci di lavoro indicano quasi sempre la retribuzione come <b>RAL (Reddito Annuo Lordo)</b>,
                ma quello che entra sul conto a fine mese è un'altra cifra. Conoscere il proprio netto — e il
                costo aziendale complessivo — è la base di ogni trattativa salariale consapevole.
              </p>
              <p>Dal lordo al netto si applicano tre passaggi in cascata:</p>
              <ol>
                <li>
                  <b>Contributi previdenziali INPS:</b> l'aliquota standard a carico del dipendente privato è il
                  <b> 9,19%</b> della retribuzione imponibile. Le misure sul cuneo fiscale confermate per il 2026
                  prevedono un esonero del 7% per retribuzioni fino a circa 25.000€ di RAL e del 6% fino a 35.000€,
                  che aumenta sensibilmente il netto dei redditi medio-bassi.
                </li>
                <li>
                  <b>IRPEF:</b> si calcola sull'imponibile fiscale (RAL meno contributi INPS) con
                  <b> 3 scaglioni</b>: 23% fino a 28.000€, 35% tra 28.000€ e 50.000€, 43% oltre i 50.000€.
                </li>
                <li>
                  <b>Detrazioni d'imposta:</b> riducono l'IRPEF dovuta. Le principali sono la detrazione per
                  lavoro dipendente (decrescente al crescere del reddito) e quelle per coniuge e figli a carico
                  dai 21 anni in su. Le misure per i figli più piccoli passano
                  dall'<b>Assegno Unico Universale</b> erogato dall'INPS.
                </li>
              </ol>

              <h3>Le addizionali regionali: Lombardia, Piemonte e Veneto a confronto</h3>
              <p>
                Oltre all'IRPEF nazionale, la busta paga sconta le addizionali regionale e comunale,
                che variano in base al domicilio fiscale:
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table className="sc-table">
                  <thead>
                    <tr><th>Regione</th><th>Aliquota media stimata</th><th>Note</th></tr>
                  </thead>
                  <tbody>
                    {(['lombardia', 'piemonte', 'veneto'] as const).map(key => (
                      <tr key={key}>
                        <td>{REGIONS[key].label}</td>
                        <td>{(REGIONS[key].rate * 100).toFixed(2).replace('.', ',')}%</td>
                        <td>{REGIONS[key].note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Per approfondire bonus e sgravi che incidono sul netto, leggi la guida ai{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('blog-article', 'bonus-busta-paga-2026'); }}>bonus in busta paga 2026</a>.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="sec" style={{ padding: '72px 0 0' }} aria-label="Domande frequenti sul calcolo dello stipendio">
            <div className="sec-head rv">
              <h2 className="sec-title">Domande <span className="ac">frequenti.</span></h2>
              <span className="mono sec-num">FAQ — Stipendio netto</span>
            </div>
            <div className="faq rv">
              {FAQ_ITEMS.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* FINAL CTA */}
          <section style={{ padding: '72px 0 88px' }} aria-label="Crea il tuo CV">
            <div className="cta-band rv">
              <div>
                <span className="mono">Il passo successivo</span>
                <h3>Prima della RAL, devi superare la selezione.</h3>
                <p>
                  Il CV builder certificato ATS adatta il curriculum alla job description e ti porta
                  al colloquio dove lo stipendio si negozia davvero.
                </p>
              </div>
              <button className="btn btn-ink" onClick={() => onNavigate('builder-step1')}>
                Ottimizza il tuo CV ora →
              </button>
            </div>
          </section>
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </EditorialChrome>
  );
}
