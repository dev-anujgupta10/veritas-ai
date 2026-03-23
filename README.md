# Veritas AI

*"Don't Just Read, Verify."*

Veritas AI is an advanced, AI-powered fact-checking agent designed to instantly verify claims, news, and analyze deepfake images. It ensures you cross-reference multiple high-trust sources before jumping to conclusions.

## Features
- **AI-powered news verification:** Intelligent analysis using generative AI.
- **Real vs Fake classification:** Provides a percentage confidence score to assess validity.
- **Source-backed analysis:** Evaluates real-time external data across news endpoints.
- **Deepfake image detection (Sightengine):** Protects against generated or manipulated imagery.
- **Chat-based UI with history:** Maintains continuous fact-checking context for users.
- **Login system with MongoDB:** Secure authentication for returning users to maintain verification history.

## Tech Stack
**Frontend:**
- Next.js / React
- Tailwind CSS / Custom Modern CSS
- Vite

**Backend:**
- Node.js
- Express.js

**APIs:**
- Gemini API (analysis and truth-evaluation)
- Serper API (reliable search results)
- GNews API (news aggregation)
- Sightengine API (image manipulation detection)

**Database:**
- MongoDB Atlas

## How it works
1. User enters news, a widely-circulated claim, or uploads an image.
2. System fetches real-time data using **Serper** and **GNews**.
3. **Gemini** analyzes the extracted sources against the claim.
4. Returns a highly structured output containing:
   - Verdict (TRUE / FALSE / MISLEADING / AI-GENERATED)
   - Confidence % (e.g. 95% Certainty)
   - Detailed Summary
   - Clickable source citations

## Setup Instructions

1. **Clone repo**
   ```bash
   git clone https://github.com/your-username/veritas-ai.git
   ```

2. **Install dependencies**
   ```bash
   cd "backend"
   npm install
   cd "../frontend"
   npm install
   ```

3. **Add Environment Variables**
   Inside the `/backend` folder, create a `.env` file (refer to `.env.example`).
   ```env
   MONGO_URI=mongodb+srv://...
   GEMINI_API_KEY=...
   SERPER_API_KEY=...
   GNEWS_API_KEY=...
   SIGHTENGINE_API_USER=...
   SIGHTENGINE_API_SECRET=...
   JWT_SECRET=...
   PORT=5000
   ```

4. **Run both servers**
   Backend:
   ```bash
   cd backend
   npm start # or npm run dev if nodemon is configured
   ```

   Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Deployment
- **Frontend** → Vercel
- **Backend** → Render
