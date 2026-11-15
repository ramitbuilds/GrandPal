# GrandPal 🦉✨
*The "Duolingo for Elder Care" – Friendly, Voice-First & Adaptive Health Companion*

GrandPal is a smart, interconnected healthcare management platform designed to help elderly individuals manage their daily medications, medical appointments, and healthcare routines while keeping family members and caretakers proactively informed in a shared, passcode-protected ecosystem.

## Features
- **Voice-First Senior Companion**: Ambient, voice-driven interaction featuring Barnaby the Caring Owl (Web Speech STT/TTS).
- **Gamified Adherence**: Positive dopamine loops with confetti celebrations, audio affirmations, and daily Sunflower streaks.
- **Passcode-Protected Caregiver Hub**: Secure 4-digit PIN access for family members to manage schedules, track live adherence, and review doctor appointments.
- **AI Doctor Triage ("Dr. Barnaby")**: Powered by Google Gemini 1.5 for voice symptom checks, drug interaction reviews, and automated clinical summaries.
- **Sunshine & Wellness Trajectory**: Visual correlation between medication adherence and symptom relief over time.
- **Proactive Alerts**: Automated email notifications for missed doses and upcoming doctor visits.

## Tech Stack
- **Framework**: Next.js 14/15 App Router (TypeScript, Tailwind CSS)
- **Database & ORM**: Prisma ORM with SQLite
- **Intelligence**: Google Gemini 1.5 Flash SDK
- **Voice & Audio**: Native Browser Web Speech API (`SpeechSynthesis` & `SpeechRecognition`)
- **Charting**: Recharts
- **Emails**: Nodemailer / Resend

## Getting Started
```bash
# Install dependencies
npm install

# Initialize and seed database
npx prisma db push
npx tsx prisma/seed.ts

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
