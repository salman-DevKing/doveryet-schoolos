# Parent App — Milestone 3

Mobile-first routes under `/parent/*`. All routes auto-scope to the currently selected child (stored in a cookie).

## Routes to build

| Route | What it does | Prototype ref |
|---|---|---|
| `/parent/login` | Mobile + OTP flow | `parent-app.html#login` |
| `/parent/picker` | Child picker if multiple children | `parent-app.html#picker` |
| `/parent/home` | Dashboard with stats, fee card, shortcuts | `parent-app.html#home` |
| `/parent/activities` | List, detail view with photos | `parent-app.html#activities` |
| `/parent/homework` | Date tabs, today's view | `parent-app.html#homework` |
| `/parent/fees` | Breakdown + UPI/Razorpay pay | `parent-app.html#fees` |
| `/parent/teachers` | List, chat shortcut on each | `parent-app.html#teachers` |
| `/parent/chat` | Conversation list → detail | `parent-app.html#chat-list, #chat` |
| `/parent/leave` | Apply form + history | `parent-app.html#leave` |
| `/parent/notifications` | Feed with routeTo deep-links | `parent-app.html#notifications` |

## Shared layout

- Phone-frame-free (actual mobile viewport, not a desktop frame)
- Bottom nav: Home / Activities / Homework / More
- `/parent/more` pseudo-screen opens Fees, Chat, Teachers, Leave, Certificates
- All screens use the `useChildContext()` hook to know which child's data to show

## State

- Selected child: cookie `pa.selectedChildId`, set in picker, read everywhere
- Unread counts: polled every 30s or via SSE (`/api/parent/notifications/stream`)
- Chat realtime: SSE endpoint per conversation (`/api/parent/conversations/[id]/stream`)

## Auth

- Phone-based OTP (no password for parents)
- Use `OtpRequest` table with bcrypt-hashed codes
- OTP valid 5 min, 3 attempts max
- Session: Auth.js JWT, role=`PARENT`

## PWA

- `manifest.json` in `/public`
- Service worker for offline shell + push notifications
- "Add to Home Screen" prompt after 2 visits
