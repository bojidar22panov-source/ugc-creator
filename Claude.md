# UGC Creator

AI-powered UGC (User Generated Content) video creation platform that generates marketing videos with AI avatars.

## Tech Stack

**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Zustand
**Backend:** Express 5 + TypeScript + Supabase
**External APIs:** Kie.ai (avatars), OpenAI (scripts), Sync.so (lip-sync), FAL.ai (video processing)

## Project Structure

```
ugc-creator/
├── src/                    # Frontend (React)
│   ├── pages/              # Dashboard, CreateVideo, Library, Login, Register
│   ├── components/         # UI components
│   ├── services/api.ts     # API client (Axios)
│   ├── stores/             # Zustand stores (auth, wizard)
│   └── lib/supabase.ts     # Supabase client
├── server/                 # Backend (Express)
│   └── src/
│       ├── index.ts        # Entry point - serves API + static files
│       ├── routes/         # video, videos, products, library
│       ├── services/       # kie.ts, openai.ts, sync.ts, fal.ts
│       └── middleware/     # auth.ts (JWT verification)
├── dist/                   # Built frontend (output)
└── package.json
```

## Commands

```bash
npm run dev        # Frontend dev server (Vite)
npm run server     # Backend dev server (Express with nodemon)
npm run dev:all    # Both frontend + backend for development

npm run build      # Build frontend to dist/
npm run start      # Start Express server (serves dist/ + API)
npm run prod       # Build + start (production)
```

## Single Server Deployment

The Express server serves both:
- Static files from `dist/` (built React app)
- API routes at `/api/*`
- SPA fallback for client-side routing

**To deploy:**
1. `npm run build` - builds frontend
2. `npm run start` - starts server on PORT (default 3000)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/video/script/generate` | Generate script (OpenAI) |
| `POST /api/video/generate` | Start video generation |
| `GET /api/video/status/:taskId` | Check generation status |
| `POST /api/video/next-scene` | Extract frame for next scene |
| `POST /api/video/generate-scene` | Generate scene with frame |
| `POST /api/video/combine` | Combine scenes into final video |
| `POST /api/video/lipsync` | Start lip-sync processing |
| `GET/POST/PATCH/DELETE /api/videos/*` | Video CRUD (auth required) |
| `GET /health` | Health check |

## Environment Variables

```
# Supabase
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# External APIs
OPENAI_API_KEY
KIE_AI_API_KEY
FAL_KEY
SYNC_SO_API_KEY

# Server
PORT=3000
```

## Video Generation Flow

1. **Script Generation** - OpenAI GPT-4o creates Bulgarian UGC script
2. **Scene Splitting** - Script divided into ~8 second scenes (16-22 words each)
3. **First Scene** - Kie.ai generates avatar video with product image
4. **Frame Extraction** - FAL.ai extracts last frame for continuity
5. **Continuation Scenes** - Kie.ai generates remaining scenes using extracted frames
6. **Lip Sync** - Sync.so applies lip-sync with ElevenLabs TTS
7. **Combining** - FAL.ai combines all scenes into final video

## Database (Supabase)

Main table: `videos`
- Stores generation progress, scene URLs, final video URL
- Row-level security (RLS) enabled
- User authentication via Supabase Auth
