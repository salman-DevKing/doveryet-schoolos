# Activities — Milestone 4

Match `prototype/activities-admin.html`.

## Server actions
- `publishActivity(data)` — creates `Activity` row, uploads photos via `lib/storage.uploadActivityPhotos()`,
  fans out `Notification` rows to all parents in the audience
- `scheduleActivity(data)` — same but `publishedAt` is a future date; cron job promotes it

## Data model
Already in schema: `Activity` with `audience` (ALL / CLASS / STUDENTS), `photoUrls[]`, `activityDate`, `publishedAt`.

## Parent-facing
`/parent/activities` lists all activities where the audience matches the current child.
