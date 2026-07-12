import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Footer,
} from "docx";

export type CvLang = "IT" | "EN" | "FR" | "DE" | "ES" | "PT";

export interface DocxExportInput {
  cvData: {
    firstName?: string;
    lastName?: string;
    title?: string;
    email?: string;
    phone?: string;
    city?: string;
    linkedin?: string;
    summary?: string;
    experiences?: Array<{
      company?: string;
      role?: string;
      city?: string;
      from?: string;
      to?: string;
      desc?: string;
    }>;
    education?: Array<{
      institution?: string;
      degree?: string;
      grade?: string;
      from?: string;
      to?: string;
    }>;
    skills?: string[];
    languages?: Array<{
      name?: string;
      level?: string;
    }>;
  };
  template?: string;
  lang?: CvLang;
  includeWatermark?: boolean;
}

const LABELS: Record<
  CvLang,
  {
    profile: string;
    experience: string;
    education: string;
    skills: string;
    languages: string;
    privacyClause: string;
    watermark: string;
  }
> = {
  IT: {
    profile: "Profilo professionale",
    experience: "Esperienze lavorative",
    education: "Formazione e Istruzione",
    skills: "Competenze",
    languages: "Lingue conosciute",
    privacyClause:
      "Autorizzo il trattamento dei miei dati personali ai sensi del D.Lgs. 196/2003 e del Regolamento UE 2016/679 (GDPR).",
    watermark: "Generato con ProntoCurriculum.it",
  },
  EN: {
    profile: "Professional Profile",
    experience: "Work Experience",
    education: "Education & Training",
    skills: "Skills",
    languages: "Languages",
    privacyClause:
      "I hereby authorize the processing of my personal data pursuant to EU Regulation 2016/679 (GDPR).",
    watermark: "Generated with ProntoCurriculum.it",
  },
  FR: {
    profile: "Profil professionnel",
    experience: "Expériences professionnelles",
    education: "Éducation et formation",
    skills: "Compétences",
    languages: "Langues",
    privacyClause:
      "J'autorise le traitement de mes données personnelles conformément au Règlement UE 2016/679 (RGPD).",
    watermark: "Généré avec ProntoCurriculum.it",
  },
  DE: {
    profile: "Berufliches Profil",
    experience: "Berufserfahrung",
    education: "Bildung und Ausbildung",
    skills: "Kompetenzen",
    languages: "Sprachen",
    privacyClause:
      "Ich erkläre mich mit der Verarbeitung meiner personenbezogenen Daten gemäß EU-Verordnung 2016/679 (DSGVO) einverstanden.",
    watermark: "Erstellt mit ProntoCurriculum.it",
  },
  ES: {
    profile: "Perfil profesional",
    experience: "Experiencia laboral",
    education: "Educación y formación",
    skills: "Competencias",
    languages: "Idiomas",
    privacyClause:
      "Autorizo el tratamiento de mis datos personales conforme al Reglamento UE 2016/679 (RGPD).",
    watermark: "Generado con ProntoCurriculum.it",
  },
  PT: {
    profile: "Perfil profissional",
    experience: "Experiência profissional",
    education: "Educação e formação",
    skills: "Competências",
    languages: "Idiomas",
    privacyClause:
      "Autorizo o tratamento dos meus dados pessoais nos termos do Regulamento UE 2016/679 (RGPD).",
    watermark: "Gerado com ProntoCurriculum.it",
  },
};

/**
 * Generates a high-quality Word (.docx) document buffer from CV data.
 */
export async function generateDocxBuffer(
  input: DocxExportInput
): Promise<Buffer> {
  const lang = input.lang || "IT";
  const t = LABELS[lang] ?? LABELS.IT;
  const { cvData, template = "modern", includeWatermark = true } = input;

  // Determine styling palette based on template
  const isEuropass = template === "europass";
  const isMinimal =
    template === "minimal" ||
    template === "compatto" ||
    template === "elegante";
  const primaryColor = isEuropass
    ? "0E4194"
    : isMinimal
      ? "1E293B"
      : "0F172A"; // Navy or Charcoal
  const accentColor = isEuropass
    ? "0E4194"
    : isMinimal
      ? "475569"
      : "2F2AE5"; // Blue or Slate

  const fullName = [cvData.firstName, cvData.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Curriculum Vitae";
  const title = cvData.title || "";
  const contacts = [
    cvData.email,
    cvData.phone,
    cvData.city,
    cvData.linkedin,
  ].filter(Boolean);

  const paragraphs: Paragraph[] = [];

  // 1. Header Section: Name
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: fullName,
          bold: true,
          size: 48, // 24pt
          color: primaryColor,
          font: "Arial",
        }),
      ],
    })
  );

  // 2. Header Section: Professional Title
  if (title) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 26, // 13pt
            color: accentColor,
            font: "Arial",
          }),
        ],
      })
    );
  }

  // 3. Header Section: Contact Details
  if (contacts.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 240 },
        border: {
          bottom: {
            color: "E2E8F0",
            space: 12,
            style: BorderStyle.SINGLE,
            size: 8,
          },
        },
        children: contacts.flatMap((item, index) => {
          const runs: TextRun[] = [
            new TextRun({
              text: item,
              size: 19, // 9.5pt
              color: "475569",
              font: "Arial",
            }),
          ];
          if (index < contacts.length - 1) {
            runs.push(
              new TextRun({
                text: "  ·  ",
                size: 19,
                color: "94A3B8",
                font: "Arial",
              })
            );
          }
          return runs;
        }),
      })
    );
  }

  // Helper function to create section headings
  const addSectionHeading = (sectionTitle: string) => {
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        border: {
          bottom: {
            color: accentColor,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: [
          new TextRun({
            text: sectionTitle.toUpperCase(),
            bold: true,
            size: 22, // 11pt
            color: primaryColor,
            font: "Arial",
          }),
        ],
      })
    );
  };

  // 4. Summary / Profile
  if (cvData.summary?.trim()) {
    addSectionHeading(t.profile);
    const lines = cvData.summary.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: line.trim(),
              size: 21, // 10.5pt
              color: "1E293B",
              font: "Arial",
            }),
          ],
        })
      );
    }
  }

  // 5. Experiences
  if (
    Array.isArray(cvData.experiences) &&
    cvData.experiences.some((e) => e.role || e.company)
  ) {
    addSectionHeading(t.experience);
    for (const exp of cvData.experiences) {
      if (!exp.role && !exp.company) continue;

      const dateStr = [exp.from, exp.to]
        .filter(Boolean)
        .join(" – ")
        .trim();
      const metaStr = [exp.company, exp.city].filter(Boolean).join(", ");

      // Role and Date line
      paragraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: exp.role || "Ruolo",
              bold: true,
              size: 22, // 11pt
              color: "0F172A",
              font: "Arial",
            }),
            ...(dateStr
              ? [
                  new TextRun({
                    text: `   (${dateStr})`,
                    size: 19,
                    color: "64748B",
                    font: "Arial",
                  }),
                ]
              : []),
          ],
        })
      );

      // Company and City line
      if (metaStr) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: metaStr,
                italics: true,
                size: 20, // 10pt
                color: "334155",
                font: "Arial",
              }),
            ],
          })
        );
      }

      // Description bullets
      if (exp.desc?.trim()) {
        const bulletLines = exp.desc
          .split("\n")
          .map((l) =>
            l.trim().startsWith("•")
              ? l.trim().slice(1).trim()
              : l.trim()
          )
          .filter(Boolean);

        for (const bl of bulletLines) {
          paragraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: bl,
                  size: 20, // 10pt
                  color: "1E293B",
                  font: "Arial",
                }),
              ],
            })
          );
        }
      }
    }
  }

  // 6. Education
  if (
    Array.isArray(cvData.education) &&
    cvData.education.some((e) => e.degree || e.institution)
  ) {
    addSectionHeading(t.education);
    for (const edu of cvData.education) {
      if (!edu.degree && !edu.institution) continue;

      const dateStr = [edu.from, edu.to]
        .filter(Boolean)
        .join(" – ")
        .trim();
      const metaStr = [edu.institution, edu.grade]
        .filter(Boolean)
        .join(" · ");

      paragraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: edu.degree || "Titolo di studio",
              bold: true,
              size: 22,
              color: "0F172A",
              font: "Arial",
            }),
            ...(dateStr
              ? [
                  new TextRun({
                    text: `   (${dateStr})`,
                    size: 19,
                    color: "64748B",
                    font: "Arial",
                  }),
                ]
              : []),
          ],
        })
      );

      if (metaStr) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: metaStr,
                italics: true,
                size: 20,
                color: "334155",
                font: "Arial",
              }),
            ],
          })
        );
      }
    }
  }

  // 7. Skills
  if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
    addSectionHeading(t.skills);
    const validSkills = cvData.skills.filter((s) => typeof s === "string" && s.trim());
    if (validSkills.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: validSkills.join("  ·  "),
              size: 20,
              color: "1E293B",
              font: "Arial",
            }),
          ],
        })
      );
    }
  }

  // 8. Languages
  if (
    Array.isArray(cvData.languages) &&
    cvData.languages.some((l) => l.name)
  ) {
    addSectionHeading(t.languages);
    const validLangs = cvData.languages.filter((l) => l.name);
    paragraphs.push(
      new Paragraph({
        spacing: { after: 120 },
        children: validLangs.flatMap((l, index) => {
          const runs: TextRun[] = [
            new TextRun({
              text: l.name || "",
              bold: true,
              size: 20,
              color: "0F172A",
              font: "Arial",
            }),
            new TextRun({
              text: l.level ? ` (${l.level})` : "",
              size: 20,
              color: "475569",
              font: "Arial",
            }),
          ];
          if (index < validLangs.length - 1) {
            runs.push(
              new TextRun({
                text: "   |   ",
                size: 20,
                color: "CBD5E1",
                font: "Arial",
              })
            );
          }
          return runs;
        }),
      })
    );
  }

  // 9. Mandatory Privacy Clause at bottom
  paragraphs.push(
    new Paragraph({
      spacing: { before: 360, after: 60 },
      border: {
        top: {
          color: "E2E8F0",
          space: 12,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: t.privacyClause,
          italics: true,
          size: 16, // 8pt
          color: "64748B",
          font: "Arial",
        }),
      ],
    })
  );

  // Footer configuration (Watermark)
  const footerChildren: Paragraph[] = [];
  if (includeWatermark) {
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `${t.watermark} — www.ProntoCurriculum.it`,
            size: 17, // 8.5pt
            color: "94A3B8",
            font: "Arial",
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1080, // 0.75 inch
              right: 1080,
              bottom: 1080,
              left: 1080,
            },
          },
        },
        headers: {},
        footers:
          footerChildren.length > 0
            ? {
                default: new Footer({
                  children: footerChildren,
                }),
              }
            : {},
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
