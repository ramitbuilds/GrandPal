# GrandPal
*Senior Health, Medication Adherence, and Caregiver Portal*

GrandPal is a voice-first, senior-friendly healthcare companion designed to assist elderly individuals in taking their medications on time, staying connected with family, and feeling supported daily through an affectionate companion mascot, Doctor Pup.

---

## Key Highlights

### 1. Senior Companion Interface
- **Pure White Minimalist Design**: High-contrast, large-typography, uncluttered layout built for elderly readability.
- **Doctor Pup Vector Mascot**: Fully custom SVG golden puppy with animated mouth synchronization (opens with red mouth cavity and pink tongue when speaking, closes naturally when silent).
- **Interactive iPhone Phone Call**:
  - Realistic calling experience with dual-frequency telephone ringback sound effects (440 Hz + 480 Hz) generated via Web Audio API.
  - Background voice pre-buffering while ringing so Doctor Pup answers and speaks with zero latency.
  - Authentic Apple-style light theme, Dynamic Island, and decline controls.

### 2. Conversational AI and Voice Pipeline
- **Multimodal Speech-to-Text (STT)**: HTML5 MediaRecorder captures hardware-level audio into WebM streams, transcribed by Google Gemini multimodal audio models with local Python fallback.
- **Dynamic AI Conversations**: Powered by Google Gemini with multi-model failover (Gemini 3.5 Flash / 3.8 Flash / 3.6 Flash / 3.7 Flash) to ensure high availability.
- **Context-Aware Dialogue**: Doctor Pup knows the senior's name, active medications, pending doses, and recent health memories.
- **Natural Neural TTS**: Microsoft Edge Neural voice (`en-US-AnaNeural`) providing a warm, human, non-robotic tone calibrated for senior comprehension.

### 3. Caregiver Oversight Portal
- **PIN Security**: Protected with a 4-digit passcode (default `1234`) to prevent accidental setting modifications by the senior.
- **Medication Adherence Tracking**: Visual adherence tracking, streak monitoring, and schedule status.
- **Automated Clinical Symptom Triage**: Analyzes reported discomfort with 1-10 severity scoring, clinical summaries, and emergency email alerts to caregivers.
- **Adaptive Memory Store**: Records health observations, preferences, and symptoms reported during everyday conversations.
- **Doctor Appointments**: Calendar management for upcoming medical checkups.

### 4. Frictionless Onboarding Wizard (`/onboarding`)
- 4-step guided setup requiring zero logins or passwords:
  1. Senior Profile (Name, Age, Caregiver Alert Email)
  2. Daily Medications (with 1-click presets for common prescriptions)
  3. Caregiver Security Passcode
  4. Personalized Spoken Welcome from Doctor Pup

---

## Technical Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS
- **Database & ORM**: Prisma ORM with SQLite
- **Artificial Intelligence**: Google GenAI SDK (`@google/genai`) with Gemini 3.5 Flash
- **Speech-to-Text**: HTML5 MediaRecorder + Gemini Multimodal Audio
- **Text-to-Speech**: Edge Neural TTS (`edge-tts`)
- **Audio Synthesis**: Web Audio API (dual-tone telephone ringback synthesizer)
- **Notifications**: Sonner (custom refined white card styling) & Nodemailer

---

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 3. Initialize the Database
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Start the Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the senior interface, [http://localhost:3000/caregiver](http://localhost:3000/caregiver) for the caregiver portal (PIN: `1234`), or [http://localhost:3000/onboarding](http://localhost:3000/onboarding) for the onboarding flow.

---

## Production Build Verification

Verify that the project builds cleanly:
```bash
npm run build
```
This generates Prisma Client automatically during postinstall and build, ensuring compatibility with platforms like Vercel.
