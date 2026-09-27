Shehri

Turning local waste problems into community cleanup missions — built for Sahiwal, Pakistan.

Shehri is a mobile-first app that reframes garbage reporting as a gamified, verifiable cleanup system. Rather than another app where citizens complain and wait for someone else to act, Shehri lets anyone report a garbage spot, turns that report into a cleanup mission for nearby volunteers, verifies the cleanup with AI, and rewards the volunteer with CleanPoints — redeemable for perks from local businesses.

Built for a Pakistan-specific civic hackathon, with a focus on solving a real, recurring problem in Sahiwal without depending on government action to make it work.

The idea

See a problem, turn it into a mission, someone solves it, verify the result, reward the person, and learn where problems keep happening.

How it works:

Report — Someone sees garbage, takes a photo, and the location is attached automatically.
Mission — The report becomes a cleanup mission with location, a before-photo, severity, and a CleanPoints reward.
Volunteer — Nearby volunteers can accept the mission, or the original reporter can clean it up themselves.
Clean — The volunteer clears the area and uploads an after-photo.
Verify — AI compares the before/after photos and checks GPS proximity to confirm the cleanup actually happened.
Reward — Once verified, the volunteer earns CleanPoints, redeemable for rewards from local Sahiwal businesses.

Locations that get reported repeatedly are also tracked as chronic waste hotspots, so recurring problem areas surface over time instead of every report being treated as an isolated incident.

Features
Photo and geolocation-based reporting — the location is attached automatically when a report is submitted
A live mission map (Leaflet / OpenStreetMap) showing open missions nearby, with severity-coded pins and hotspot clustering
A mission acceptance flow, with the option to self-clean a mission you reported
AI-powered cleanup verification, using Gemini's multimodal vision to compare before/after photos alongside a GPS proximity check
Gamification — CleanPoints, individual and neighborhood leaderboards, and badges
A rewards marketplace where CleanPoints can be redeemed for vouchers from local Sahiwal businesses
Firebase Authentication (email/password and Google Sign-In)
Full English and Urdu support, including proper right-to-left layout mirroring
Light and dark mode
Server-authoritative trust logic — points and verification outcomes are never settled on the client, only through validated server-side endpoints
A mobile-first, installable progressive web app
Tech stack
Layer	Technology
Frontend	React, TypeScript, Tailwind CSS
Backend	Node.js, Express
Database	Firebase Firestore
Auth	Firebase Authentication
Storage	Firebase Cloud Storage
AI verification	Google Gemini (multimodal vision)
Maps	Leaflet, OpenStreetMap
Hosting	Render

This project was built with AI-assisted development throughout.

Getting started
Prerequisites
Node.js 18+
A Firebase project with Authentication, Firestore, and Storage enabled
A Gemini API key
Setup
bash
git clone https://github.com/bilallmengrani/shehri-sahiwal-pwa.git
cd shehri-sahiwal-pwa
npm install
cp .env.example .env

Fill in your own values in .env before running the app.

Environment variables
Variable	Description
VITE_FIREBASE_API_KEY	Firebase Web API key
VITE_FIREBASE_AUTH_DOMAIN	Firebase Auth domain (...firebaseapp.com)
VITE_FIREBASE_PROJECT_ID	Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET	Firebase Storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID	Firebase messaging sender ID
VITE_FIREBASE_APP_ID	Firebase web app ID
VITE_FIREBASE_FIRESTORE_DATABASE_ID	Firestore database ID (default unless customized)
GEMINI_API_KEY	Google Gemini API key, used server-side for cleanup verification
PORT	Port for the Express server

.env is git-ignored. Only .env.example, with placeholder values, should ever be tracked.

Running locally
bash
npm run dev     # development
npm run build   # production build
npm run start   # run the built app and API server together
Security

Trust-sensitive actions — awarding CleanPoints, marking a mission verified, redeeming rewards — are handled entirely by server-side endpoints using the Firebase Admin SDK, never settled directly by the client. Firestore and Storage rules restrict reads and writes to each user's own data and enforce valid mission state transitions. User-submitted text is sanitized before it's stored or rendered.

Project status

This is a hackathon build, and a couple of things are intentionally simplified for the demo:

The rewards catalog uses placeholder local business partnerships to demonstrate how the redemption model would work. Real vendor partnerships would be the natural next step.
AI verification runs on real Gemini vision analysis combined with GPS matching, but its thresholds are tuned for demo conditions and would need further calibration at scale.
Author

Built by Bilal, based in Karachi, Pakistan.
