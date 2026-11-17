# START HERE · gabewells.com knowledge map

Goal: gabewells.com works well for visitors and collectors (redesign + admin, Gabe 2026-11-16), and is found on Google, with
Google Analytics/Search Console tracked in the admin (SEO, Gabe 2026-11-17). Both asks are quoted in `PROJECT_ROADMAP.md`.
Status (2026-11-17): redesign, one-click viewer, admin redesign, admin security, 2-step login, SEO foundation and Google tools all live.
Next: `next.md` top 3 (Project doc `claude/next.md`); website fixes queue in `HANDOFFS/2026-11-17-website-next-chat.md`; first Search Console review after ~2026-12-01.
Live state is in: `CLAUDE.md` (repo root), sections "Deployment Pipeline" and "SEO".

## Ask this → read that

| Question | Read |
|---|---|
| What's live right now, how do I deploy? | `CLAUDE.md` → Deployment Pipeline |
| How does SEO work in the code? | `CLAUDE.md` → SEO; `server/seo.ts`, `shared/seo.ts` |
| What's next? | `docs/project/PROJECT_ROADMAP.md` → Status, Phase 3 |
| Why did we decide X? | `docs/project/DECISIONS.md` |
| What failed before / gotchas? | `CLAUDE.md` → Known failure patterns |
| Baseline numbers, plain-English plan? | Cowork Project doc `claude/seo-plan.md` |
| Where are the Google numbers? | gabewells.com/admin/analytics-settings (report panel) |
| Which skill for which job? | `CLAUDE.md` → Skills used in this project |
| What did the last chat hand over? | `docs/project/HANDOFFS/` (newest file) |
| What does Gabe already answer the same way? | `CLAUDE.md` → Standing answers |
| Ideas and fixes parked for later? | `docs/project/PROJECT_ROADMAP.md` → 🅿️ Backlog |
| Design rules (colors, fonts)? | `CLAUDE.md` → Design System |
| How do I test before a deploy? | `CLAUDE.md` → Testing before a deploy |
| Admin security rules (don't undo)? | `CLAUDE.md` → Admin Interface Notes |
| How do I edit artwork, products, prices, settings? | skill `website-manager` (Gabe's signed-in admin; no API key) |
| Which facts about Gabe may I state? | `Artwork Marketing/data/confirmed-facts.md` on Gabe's Mac (✅ only) |
| A painting's price? | skill `painting-pricer`; Gabe's Mac `Artwork Marketing Manager/DECISIONS.md` ("Governor's Art Show" entries) |
| The redesign/admin decisions in full (2026-11-16/17)? | Gabe's Mac `Artwork Marketing Manager/DECISIONS.md`; summary in `docs/project/DECISIONS.md` |

## Doc roster

| Doc | Holds | Wins if two disagree | Last verified |
|---|---|---|---|
| `CLAUDE.md` | What is true now: stack, deploy, SEO, rules, gotchas | yes (after the live site) | 2026-11-17 |
| `docs/project/PROJECT_ROADMAP.md` | Plan, phases, backlog, session notes | for "what's next" | 2026-11-17 |
| `docs/project/DECISIONS.md` | Why, append-only | for "why" | 2026-11-17 |
| `docs/project/HANDOFFS/` | One brief per next chat | — | 2026-11-17 |
| Project doc `claude/seo-plan.md` | Plain-English status, baseline, backlog for Gabe | numbers baseline | 2026-11-17 |
| Project docs `claude/PROJECT_ANALYSIS.*`, `claude/next.md` | Percent complete, top 3 (Anchor format) | — | 2026-11-17 |
| Project doc `claude/COWORK_PROJECT_INSTRUCTIONS.md` | Copy of the Project Instructions block | — | 2026-11-17 |
| `CHANGELOG.md` | Dated change list | — | 2026-11-17 |
| Gabe's Mac `Artwork Marketing Manager/` (`CLAUDE.md`, `PROJECT_ROADMAP.md`, `DECISIONS.md`) | The whole art business; its Website section points here | business facts and pricing | 2026-11-17 |

Not the code: `Artwork Marketing Manager/Website/ArtistPortfolio/` on Gabe's Mac is an old, mostly empty copy (April 2026). Work from GitHub.
Pointers only (no content, so they can't drift): Project docs `claude/START-HERE.md`, `claude/project-instructions.md`; Mac `Website/START HERE.md`, `Website/COWORK_PROJECT_INSTRUCTIONS.md`.

The many `*_REPORT.md` files in the repo root are older history: read only if a task needs them.
