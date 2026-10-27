# Surgical Technique Atlas

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

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0de8a5b7-ff56-5b48-985b-f7a60328c62c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
