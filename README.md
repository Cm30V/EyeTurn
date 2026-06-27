# EyeTurn

**Hands-free sheet music using blink detection.**

EyeTurn is a local-first web app that lets musicians upload PDF sheet music and turn pages without using their hands — by blinking in counted patterns detected via webcam.

## Installation

```bash
npm install
```

Generate static assets (demo PDF + WebGazer bundle):

```bash
node scripts/create-demo-pdf.mjs
node scripts/copy-webgazer.mjs
```

These also run automatically on `npm install`.

## Running on localhost

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in **Chrome**, **Edge**, or **Safari** (Mac, iPhone, iPad).

### Quick start

1. Click **Upload PDF** or **Demo Mode**
2. Allow front-camera access when prompted (on iPhone/iPad, tap **Enable camera & calibrate**)
3. Complete **blink calibration** (open eyes, then blink 3 times fast like turning a page)
4. Blink **2–3 times** (default) to go next, or **5–6 times** to go back
5. Use on-screen arrows or keyboard shortcuts as fallback

## iPhone & iPad

EyeTurn uses the **same blink detection** on all devices (MediaPipe + EAR via WebGazer). No separate mobile app or mode.

**On iPhone/iPad:**

1. Open the site in **Safari** over **HTTPS** (required for camera — Vercel deploys include this)
2. Load a PDF, then tap **Enable camera & calibrate** (Safari requires a tap before camera access)
3. Prop the device so your face is visible to the **front camera**
4. Complete calibration, then blink to turn pages
5. Use toolbar **← / →** buttons if blink detection misses a turn

**Tips:** Good lighting, hold the device steady, and recalibrate if detection drifts.

## How blink detection works (MediaPipe + EAR)

EyeTurn does **not** use a trained blink classifier. It follows the standard real-time approach:

1. **MediaPipe Face Mesh** (via WebGazer) detects **468 facial landmarks** from your webcam
2. **Eye Aspect Ratio (EAR)** is computed from six landmarks per eye:

   `EAR = (||p2−p6|| + ||p3−p5||) / (2 × ||p1−p4||)`

3. A **blink** is counted when EAR **drops** below your threshold, then **rises** back above it

Calibration learns your personal open EAR, closed EAR, and the threshold between them.

## WebGazer

EyeTurn uses [WebGazer.js](https://webgazer.cs.brown.edu/) to run **MediaPipe Face Mesh** in the browser:

- Accesses your webcam locally
- Tracks **468 MediaPipe face landmarks** locally
- **No video or face data is sent to any server**

WebGazer must run on `localhost` or HTTPS. This MVP is designed for `http://localhost:3000`.

## Blink calibration

Before blink detection works, you must calibrate:

1. **Step 1 — Open eyes:** MediaPipe samples your open-eye **EAR** for ~2 seconds
2. **Step 2 — Teach turn-page rhythm:** Blink **3 times quickly** — the same fast burst you'd use to turn a page. EyeTurn records blink count, spacing, and total duration as your personal pattern.

Tap **Recalibrate blinks** in Settings anytime to re-teach your rhythm.

## Blink page control

| Action | How it works |
|--------|----------------|
| Next page | **2–3** blinks by default (configurable in Settings), or learned fast-blink pattern |
| Previous page | **5–6** blinks (configurable min/max in Settings) |

After your last blink, a short pause (~350ms) confirms the gesture. Rapid blinks in succession are supported.

Adjust blink counts, confirm delay, and cooldown in **Settings**.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `→` | Next page |
| `←` | Previous page |
| `Space` | Toggle blink tracking / open calibration |
| `Esc` | Exit fullscreen |

Keyboard navigation always works, even if blink tracking fails.

## Settings

Open the gear icon in the viewer toolbar:

- Blinks for next / previous page
- Blink confirm delay & cooldown
- Webcam preview toggle
- Blink tracking on/off
- Recalibrate blinks
- Dark mode
- Debug overlay (EAR, threshold, blink count)

## Limitations

- **Accuracy**: Webcam blink detection is approximate — not medical-grade. False positives/negatives vary by person and lighting.
- **Lighting**: Bright, even front lighting improves detection.
- **Head movement**: Keep your head relatively still during calibration and practice.
- **Browser support**: Chrome, Edge, and Safari on Mac, iPhone, and iPad. Mobile requires HTTPS.
- **PDF size**: Very large PDFs may use more memory; pages are rendered on demand.

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- PDF.js
- Zustand
- Framer Motion
- WebGazer.js

All processing is client-side. PDFs are stored in IndexedDB; nothing is uploaded to a server.

## Deployment to Vercel

EyeTurn can be deployed to Vercel as a static/client-side app:

```bash
npm run build
```

Or connect the repo to [Vercel](https://vercel.com):

1. Import the Git repository
2. Framework preset: **Next.js**
3. Deploy

**Important for production:**

- WebGazer requires **HTTPS** (Vercel provides this automatically)
- Users must grant webcam permission on first visit

## Project structure

```
app/           Next.js routes (home, viewer)
components/    PDFViewer, CalibrationOverlay, BlinkIndicator, etc.
hooks/         useGazeTracker, useBlinkDetector, keyboard shortcuts
lib/           Zustand store, PDF helpers, WebGazer loader
utils/         Blink detection (EAR) helpers
types/         Shared TypeScript types
public/        Demo PDF + WebGazer assets
```

## License

WebGazer.js is GPL-3.0-or-later. Review licensing implications if you distribute commercially.
