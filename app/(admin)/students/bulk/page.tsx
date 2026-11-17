// MILESTONE 2 — Bulk student upload
// TODO:
// - Accept CSV via FormData (use papaparse on server)
// - Validate each row with Zod schema (reuse createStudent schema)
// - Return { validRows, invalidRows: [{ rowIndex, errors }] } for preview
// - Second "Confirm" action persists validRows in a single transaction

export default function BulkUploadPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Bulk Student Upload — Milestone 2</h1>
      <p className="text-[color:var(--color-text-secondary)]">
        TODO: Upload CSV → preview with row-level validation → confirm import. Template download at{" "}
        <code>/api/students/template</code>.
      </p>
    </div>
  );
}
