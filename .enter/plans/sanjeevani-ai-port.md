# Port Sanjeevani AI (GitHub repo) into this Enter project

## Context
User owns `github.com/satyamtyagi15/SANJEEVANI-AI` — a Vite+React (JSX) multi-module
"Hospital AI OS" (voice ER triage, doctor dashboard, pain tracker, pharma AI, vision AI,
multi-agent debate, digital twin, genomic scanner, art therapy, guardian follow-up,
auto-scribe, patient records). User wants this exact app rebuilt inside the current
Enter project ("use hi run karo" / "clone banao").

Two things in the original repo cannot run as-is on Enter:
1. **Convex + Mongoose/MongoDB + Vercel `/api` serverless functions** — Enter has no
   Node server and no external Convex deployment. User explicitly said **no new backend**
   (`bhai new backend nhi bana`, `Convex/Mongoose wala data-saving part hata do`).
2. **Hardcoded OpenRouter API key** committed in the repo — already public on GitHub,
   and Enter doesn't support `.env`/`VITE_*` vars. AI calls must stay 100% client-side
   (no Enter Cloud), so the key must come from the user, not from source code.

Everything else (UI, all 9 modules, sci-fi dark styling, PDF export, QR e-prescriptions,
webcam rPPG vitals, speech recognition) is pure frontend and ports directly.

## Approach
Port the app as a **new page mounted at `/`** (replaces the template's placeholder
`Index` page), preserving the original's own hand-rolled dark UI/CSS almost verbatim
(not rebuilt in shadcn/Tailwind — user wants an exact clone of their app, not a redesign).

### 1. Replace Convex with a local persistence service
New file `src/sanjeevani/services/localDb.ts`: a tiny localStorage-backed store +
pub-sub hook (`useLocalQuery`) that mimics the shape of the Convex calls used in the
repo, so components need minimal changes:
- `savedRecords` (Patient Records: save/list/delete) — replaces `convex/records.js`
- `dischargedPatients` + `guardianAlerts` (Guardian Monitor/follow-up) — replaces `convex/patients.js`
- Same field shapes as `convex/schema.js` so ported components keep their existing prop/data usage.
- Mutations write to `localStorage` + emit a custom event; `useLocalQuery` listens and re-renders.
Data is per-browser only (no cross-device sync) — acceptable since no backend was approved.

### 2. Replace hardcoded/dead OpenRouter key with a user-supplied key
New `Settings` nav item + `src/sanjeevani/components/Settings.tsx`: single input to paste
an OpenRouter API key, saved to `localStorage` (`sanjeevani_openrouter_key`). 
`AIEngine.ts` / `VisionService.ts` read the key from localStorage at call time; if missing,
show a clear inline error ("Add your OpenRouter API key in Settings") instead of a silent
network failure. No key is ever committed to source.

### 3. Drop Cloudinary + Mongo `/api/reports`
- `CloudinaryService` (needs env vars) is removed; VisionAI/ArtTherapy save the generated
  image directly as a base64 data URL into the same local `savedRecords` store.
- `ReportService.saveReportToDB` (was `fetch('/api/reports')` → MongoDB) now writes
  straight into `localDb` (unifies with Patient Records so every module's "Save Report"
  button lands in one place). `downloadPDF` (jsPDF) is kept as-is, pure client-side.

### 4. Scope original CSS instead of rewriting
Port `src/styles/App.css` + relevant `src/index.css` rules into
`src/sanjeevani/styles/sanjeevani.css`, wrapped so selectors apply only under a
`.sanjeevani-app` root wrapper (avoid leaking `*`, `body`, scrollbar overrides onto the
rest of the Enter shell). Google Fonts `@import` and CSS vars stay global (harmless).

### 5. File/component mapping (GitHub repo → this project)
All under new folder `src/sanjeevani/`:

| Repo file | New path | Notes |
|---|---|---|
| `src/App.jsx` | `sanjeevani/SanjeevaniApp.tsx` | sidebar nav + module switch + mobile hamburger; add "Settings" nav item |
| `src/main.jsx` | (merged into router) | drop `ConvexProvider` |
| `src/components/PatientKiosk.jsx` | `sanjeevani/components/PatientKiosk.tsx` | voice/text symptom intake, OCR upload, vision upload |
| `src/components/TouchlessVitals.jsx` | `.../TouchlessVitals.tsx` | webcam rPPG, uses rPPGService |
| `src/components/LiveECGGraph.jsx` | `.../LiveECGGraph.tsx` | |
| `src/components/DoctorDashboard.jsx` | `.../DoctorDashboard.tsx` | |
| `src/components/TriageCard.jsx` | `.../TriageCard.tsx` | swap `useMutation(api.patients.dischargePatient)`/`api.records.saveRecord` → `localDb` calls |
| `src/components/EpidemicAlert.jsx` | `.../EpidemicAlert.tsx` | uses `EpidemicService` (already in-memory, no change) |
| `src/components/CustomAlert.jsx`, `CustomLanguageSelector.jsx` | same names `.tsx` | no data-layer changes |
| `src/components/AutoScribe.jsx` | `.../AutoScribe.tsx` | AI SOAP note generation |
| `src/components/PharmaAI.jsx` | `.../PharmaAI.tsx` | drug interaction checker |
| `src/components/VisionAI.jsx` | `.../VisionAI.tsx` | radiology scan; drop Cloudinary upload → base64 |
| `src/components/MultiAgent.jsx` | `.../MultiAgent.tsx` | 13-specialist debate |
| `src/components/DigitalTwin.jsx` | `.../DigitalTwin.tsx` | recharts trajectory (recharts already installed) |
| `src/components/GenomicScanner.jsx` | `.../GenomicScanner.tsx` | |
| `src/components/ArtTherapy.jsx` | `.../ArtTherapy.tsx` | Pollinations image gen (public, no key needed) + drop Cloudinary |
| `src/components/PainTracker.jsx`, `AnatomicalHeatmap.jsx` | `.../PainTracker.tsx`, `AnatomicalHeatmap.tsx` | facial/vocal pain engine (MediaPipe/TF) |
| `src/components/PatientRecords.jsx` | `.../PatientRecords.tsx` | swap Convex query/mutation → `localDb` |
| `src/components/GuardianDashboard.jsx`, `GuardianAlerts.jsx`, `PatientFollowUp.jsx` | same names `.tsx` | swap Convex → `localDb` |
| `src/components/PharmacyPrescriptionWidget.jsx` | `.../PharmacyPrescriptionWidget.tsx` | used inside TriageCard |
| `src/services/AIEngine.js` | `sanjeevani/services/AIEngine.ts` | remove hardcoded key, read from localStorage Settings |
| `src/services/VisionService.js` | `.../VisionService.ts` | same key change |
| `src/services/SpeechService.js`, `AlertService.js`, `EpidemicService.js` | same names `.ts` | unchanged logic |
| `src/services/rPPGService.js` | `.../rPPGService.ts` | unchanged logic (TensorFlow/Blazeface) |
| `src/services/ReportService.js` | `.../ReportService.ts` | drop `/api/reports` fetch → `localDb`; keep jsPDF export |
| `src/services/CloudinaryService.js` | removed | replaced by inline base64 storage |
| `convex/*` | removed | replaced by `sanjeevani/services/localDb.ts` |
| `api/*` (Vercel/Mongo) | removed | not usable on Enter |

### 6. Routing
`src/router.tsx`: change `/` route to render `SanjeevaniApp` instead of `Index`
(`Index.tsx` removed). Keep `NotFound` catch-all unchanged.

### 7. New dependencies to add
`@tensorflow/tfjs`, `@tensorflow-models/blazeface`, `@mediapipe/face_mesh`,
`@mediapipe/face_detection`, `@tensorflow-models/face-detection`,
`@tensorflow-models/face-landmarks-detection`, `jspdf`, `qrcode.react`
(`recharts`, `framer-motion`, `lucide-react` already present in this project).

## Implementation checklist
- [ ] Add ML/PDF/QR dependencies listed above
- [ ] Create `sanjeevani/services/localDb.ts` (records + discharged patients + guardian alerts, localStorage + `useLocalQuery` hook)
- [ ] Create `sanjeevani/services/AIEngine.ts`, `VisionService.ts` reading OpenRouter key from localStorage, with clear "missing key" error surfaced to UI
- [ ] Create `sanjeevani/components/Settings.tsx` (API key input, saved to localStorage) + add "Settings" to sidebar nav
- [ ] Port `SpeechService`, `AlertService`, `EpidemicService`, `rPPGService`, `ReportService` (PDF-only, Mongo fetch removed)
- [ ] Port `PatientKiosk`, `TouchlessVitals`, `LiveECGGraph`, `TriageCard`, `DoctorDashboard`, `EpidemicAlert`, `CustomAlert`, `CustomLanguageSelector` (core triage flow)
- [ ] Port `PatientRecords`, `GuardianDashboard`, `GuardianAlerts`, `PatientFollowUp` wired to `localDb` instead of Convex
- [ ] Port `PharmaAI`, `VisionAI` (Cloudinary removed → base64), `MultiAgent`, `DigitalTwin`, `GenomicScanner`, `ArtTherapy` (Cloudinary removed → base64), `PainTracker`, `AnatomicalHeatmap`, `AutoScribe`, `PharmacyPrescriptionWidget`
- [ ] Port `SanjeevaniApp.tsx` (sidebar, mobile hamburger, module switching) as ported from `App.jsx`
- [ ] Port scoped CSS into `sanjeevani/styles/sanjeevani.css`, imported only by `SanjeevaniApp.tsx`
- [ ] Update `src/router.tsx` to render `SanjeevaniApp` at `/`; remove now-unused `Index.tsx`
- [ ] Remove/ignore Convex, Mongoose, Cloudinary, Vercel `/api` code (never ported)

## Verification checklist
- [ ] App loads at `/` showing Sanjeevani sidebar + Triage Kiosk by default, no console errors
- [ ] Settings: entering an OpenRouter key persists across reload (localStorage)
- [ ] Without a key set, triggering an AI action (e.g. submit symptom) shows the "missing key" message, not a silent crash
- [ ] With a valid key, full triage flow works: speak/type symptom → follow-up question(s) → vitals scan (webcam permission) → TriageCard renders with priority/DDx/meds
- [ ] "Save Triage Record" adds an entry visible in Patient Records after navigating there, and persists after page reload
- [ ] "Discharge to Guardian AI" creates a record visible in Guardian Dashboard; follow-up magic link (`?followup=<id>`) opens `PatientFollowUp` modal
- [ ] Each remaining module (Pharma AI, Vision AI, Multi-Agent, Digital Twin, Genomic Scanner, Art Therapy, Pain Tracker, Auto-Scribe) renders and its primary action calls AI without crashing
- [ ] PDF download button produces a downloadable file for at least Triage and one other module
- [ ] Mobile width (<768px) shows hamburger menu that opens/closes the sidebar drawer
- [ ] `pnpm lint` / build passes with no TypeScript errors introduced by the port
