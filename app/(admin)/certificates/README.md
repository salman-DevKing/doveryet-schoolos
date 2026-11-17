# Certificates — Milestone 6

Match `prototype/certificates.html` (5-step wizard, 4 templates).

## PDF generation on Hostinger shared hosting

**Can't use Playwright/Chromium** — shared hosting disallows the binary. Use **`@react-pdf/renderer`** (already in `package.json`), pure JS, works anywhere Node runs.

Example renderer:

```tsx
// lib/certificate-pdf.tsx
import { Document, Page, View, Text, Image, StyleSheet, Font, renderToStream } from "@react-pdf/renderer";

Font.register({
  family: "Playfair Display",
  src: "https://fonts.gstatic.com/.../PlayfairDisplay-Bold.ttf",
});

const styles = StyleSheet.create({
  page: { padding: 50, backgroundColor: "#FAF6EB", border: "12pt solid #B8902C" },
  title: { fontFamily: "Playfair Display", fontSize: 42, textAlign: "center", color: "#B8902C" },
  name: { fontFamily: "Playfair Display", fontSize: 36, textAlign: "center", marginTop: 24 },
  // ...
});

export function ClassicFormalCert({ issue }: { issue: CertificateIssueData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View>
          <Image src={issue.school.logoUrl} />
          <Text style={styles.title}>CERTIFICATE</Text>
          <Text style={styles.name}>{issue.student.firstName} {issue.student.lastName}</Text>
          {/* ... rest of layout */}
        </View>
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(issueId: string): Promise<Buffer> {
  const issue = await db.certificateIssue.findUnique({
    where: { id: issueId },
    include: { certificate: { include: { template: true, school: true } }, student: { include: { class: true } } },
  });
  if (!issue) throw new Error("Not found");

  const template = pickTemplate(issue.certificate.template.slug); // returns a React component
  const stream = await renderToStream(template({ issue }));
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
```

Each PDF renders in ~100–300 ms — fine for individual or bulk generation.

## Bulk generation

```ts
// app/api/certificates/[id]/generate-batch/route.ts
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issues = await db.certificateIssue.findMany({ where: { certificateId: id } });

  // Render + upload in parallel with concurrency of 5
  const concurrency = 5;
  for (let i = 0; i < issues.length; i += concurrency) {
    const batch = issues.slice(i, i + concurrency);
    await Promise.all(batch.map(async (issue) => {
      const pdf = await renderCertificatePdf(issue.id);
      const file = new File([pdf], `${issue.issueCode}.pdf`, { type: "application/pdf" });
      const url = await uploadAttachment(school.slug, "certificates", issue.id, file);
      await db.certificateIssue.update({ where: { id: issue.id }, data: { pdfUrl: url } });
    }));
  }

  return NextResponse.json({ generated: issues.length });
}
```

For 100 students: ~20 seconds total with 5-way parallelism.

## Templates — 4 to build

Port the HTML from `prototype/certificates.html`:

- `classic-formal.tsx` — gold border, serif fonts (Playfair + Lora)
- `playful-preschool.tsx` — pastel gradient, Caveat script font
- `bold-competition.tsx` — navy gradient, Plus Jakarta Sans
- `modern-elegant.tsx` — clean white, Lora

Map `CertificateTemplate.slug` → React component via a lookup object.

## Parent-facing

`/parent/certificates` lists `CertificateIssue` rows for the current child.
Each row deep-links to `/api/certificates/issues/[id]/pdf` which streams the PDF inline (or 302-redirects to `pdfUrl` if already rendered).
