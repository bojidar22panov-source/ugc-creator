# UGC Creator

AI-powered UGC (User Generated Content) video creation platform that generates marketing videos with AI avatars.

## Tech Stack

**Framework:** Next.js 15 (App Router) + React 19 + TypeScript
**Styling:** Tailwind CSS 4
**State:** Zustand
**Auth/DB:** Supabase (PostgreSQL + Auth + Storage)
**External APIs:** Kie.ai (avatars), OpenAI (scripts), Sync.so (lip-sync), FAL.ai (video processing)

## Project Structure

```
ugc-creator/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── providers.tsx          # React Query + Auth provider
│   ├── (auth)/                # Auth route group
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/           # Protected route group
│   │   ├── layout.tsx         # Dashboard layout with sidebar
│   │   ├── page.tsx           # Dashboard
│   │   ├── create/page.tsx    # Video creation wizard
│   │   └── library/page.tsx   # Video library
│   └── api/                   # API routes
│       ├── health/route.ts
│       ├── video/             # Video generation endpoints
│       └── videos/            # Video CRUD endpoints
├── components/                 # React components
│   ├── layout/                # MainLayout, Header, Sidebar
│   ├── ui/                    # Button, Card, Badge, etc.
│   ├── avatar/
│   ├── background/
│   ├── script/
│   └── upload/
├── lib/                       # Utilities
│   ├── supabase/              # Supabase clients
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Auth middleware helper
│   ├── api.ts                 # API client (Axios)
│   ├── utils.ts               # Utility functions
│   └── constants.ts           # Demo data
├── stores/                    # Zustand stores
│   ├── authStore.ts
│   └── wizardStore.ts
├── types/                     # TypeScript types
├── middleware.ts              # Next.js middleware (auth)
├── next.config.ts
└── package.json
```

## Commands

```bash
npm run dev        # Development server (http://localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
```

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# External APIs
OPENAI_API_KEY=
KIE_AI_API_KEY=
FAL_KEY=
SYNC_SO_API_KEY=
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `POST /api/video/script/generate` | Generate script (OpenAI) |
| `POST /api/video/generate` | Start video generation |
| `GET /api/video/status/[taskId]` | Check generation status |
| `POST /api/video/next-scene` | Extract frame for next scene |
| `POST /api/video/generate-scene` | Generate scene with frame |
| `POST /api/video/combine` | Combine scenes into final video |
| `POST /api/video/lipsync` | Start lip-sync processing |
| `GET/POST /api/videos` | Video CRUD |
| `GET /api/videos/completed` | Get completed videos |
| `GET/PATCH/DELETE /api/videos/[id]` | Video by ID |

## Authentication

- Uses Supabase Auth with cookie-based sessions
- Middleware protects all routes except `/login`, `/register`, `/api/*`
- Auth state managed via Zustand store

## Video Generation Flow

1. **Script Generation** - OpenAI GPT-4o creates Bulgarian UGC script
2. **Scene Splitting** - Script divided into ~8 second scenes
3. **First Scene** - Kie.ai generates avatar video with product image
4. **Frame Extraction** - FAL.ai extracts last frame for continuity
5. **Continuation Scenes** - Kie.ai generates remaining scenes
6. **Lip Sync** - Sync.so applies lip-sync with ElevenLabs TTS
7. **Combining** - FAL.ai combines all scenes into final video

## Migration Notes

This project was migrated from React + Vite + Express to Next.js App Router. The old `src/`, `server/`, and `api/` directories contain legacy code that can be removed once the API routes are fully migrated.
