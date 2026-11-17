// MILESTONE 2 — Student onboarding
// TODO: Implement the Add Student form matching prototype/student-add.html
// - Server action should:
//   1. Upload photo via lib/storage.uploadStudentPhoto() if provided
//   2. Look up existing parent by phone or email (sibling detection)
//   3. If match: link student to existing parent (no new user created)
//   4. If no match: create new parent User with role=PARENT
//   5. Send parent invite email via lib/email.parentInviteHtml()
//   6. Audit log

export default function AddStudentPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Add Student — Milestone 2</h1>
      <p className="text-[color:var(--color-text-secondary)]">
        TODO: Port the UI from <code>prototype/student-add.html</code>. See{" "}
        <code>app/(admin)/students/actions.ts</code> for the existing stub — extend it with blood group,
        photo upload, and sibling auto-detection.
      </p>
    </div>
  );
}
