# Surgical Technique Atlas

Oliver's personal reference library of surgical technique: case setups, operative steps, attending preference cards, and post-op care, for use through fellowship and as an attending.

## Current setup

- **Live site:** https://my.surgicalatlas.workers.dev
- **Hosting:** Cloudflare Workers (TanStack Start app, built with Vite + Nitro targeting Cloudflare)
- **Database & login:** Supabase (email/password auth, row-level security on every table)
- **Schema migrations:** `drizzle/migrations/`
- **No longer on Lovable.** The project was originally generated in Lovable and has since moved off it. Make changes directly in this repo; do not route edits through Lovable.

## App structure

- Categories with subdivisions (HPB, GI, Endocrine, Breast, Melanoma/Sarcoma, Other).
- Each subdivision has **Conditions** (H&P, labs, imaging, data, recommendations) and **Operations** (pre-op, setup, intra-op, pearls & pitfalls, post-op), plus attending preference cards.
- Any section can hold **pop-outs**: named buttons that open longer text (orders, discharge instructions, tables) in a dialog.
- Op note templates, dot phrases, links, global search, JSON/CSV backup, and PHI warnings on save.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Original build spec

The prompt the app was first generated from. The app has evolved since (see App structure above), so treat this as history, not the current design.

Build me a private web app called "Operative Atlas": a personal reference library of surgical technique for a Complex General Surgical Oncology fellow. I'll use it through fellowship and as a junior attending to remember how cases were set up and done. It must work well on iPhone (added to the home screen) and on a laptop, with data synced between them.

AUTH & DATA

- Email/password login using Lovable's built-in backend (Supabase). Each user sees only their own data (row-level security on every table).

- Build it multi-user from the start so I can invite co-fellows later. For now, only my account exists. Leave sign-up disabled or invite-only.

- Add a "Shared" flag on entries (default off). Leave it inert for now, but structure the data so sharing individual entries or whole categories can be added later.

- Settings page: export all my data as JSON and CSV, and import from JSON (for backups).

STRUCTURE

Top-level categories, each with user-editable subsections (add/rename/reorder):

1. HPB: Liver, Pancreas, Biliary

2. Upper GI: Esophagus, Stomach

3. Colorectal: Colon, Rectum, Anal

4. Peritoneal / CRS-HIPEC

5. Breast

6. Melanoma / Sarcoma

7. Endocrine

8. Other

CASE ENTRIES

Header fields: case title (procedure), category, subsection, attending, hospital, month/year performed (month and year only, no full date), approach (open / laparoscopic / robotic / hybrid), tags.

Body sections, each a rich-text field, in this order:

- Indications

- Setup (positioning, room setup, port placement, instruments/energy, special equipment)

- Key steps

- Pearls

- Pitfalls

Allow multiple entries for the same procedure (different attendings do it differently). Show these grouped together on the procedure's page so I can compare them.

OTHER TABS

- Op Note Templates: titled, copyable templates organized by category.

- Dot Phrases: short name plus expansion text, with a one-tap copy button.

- Post-Op Orders: order sets by procedure (diet, drains, labs, VTE prophylaxis, pain, ERAS pathway, activity, discharge criteria), with free-text notes on attending-specific variations. Each set can link to related case entries.

- Links: a list of saved external links (e.g., my Google Drive folders).

SEARCH & NAVIGATION

- One global search bar that searches across all tabs and all fields.

- Filters by category, subsection, attending, approach, and tag.

- "Recently edited" list on the home screen.

- A quick "+ New entry" button that is reachable with one thumb on mobile.

FAST ENTRY

- A "Paste formatted note" option: I paste text that has headings (Indications / Setup / Key Steps / Pearls / Pitfalls), and the app splits it into the matching fields automatically.

PRIVACY GUARDRAILS

- This app stores technique only, never patient information. Show a persistent subtle reminder on the entry form: "No names, MRNs, DOBs, or identifying details."

- On save, warn (but don't block) if the text contains patterns that look like an MRN (long digit strings), a full date, or a phone number.

DESIGN

- Calm, editorial, minimal: warm off-white background, serif headings, clean sans-serif body text, one muted accent color, generous whitespace, no bright colors.

- Fully responsive. Mobile is the primary use case.

- Include a web app manifest and icon so "Add to Home Screen" on iPhone opens it full-screen like an app.

Ask me any clarifying questions before you start building.
