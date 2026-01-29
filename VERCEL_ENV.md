# Environment Variables for Vercel

The following environment variables must be configured in your Vercel project settings:

## Required Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (from project settings) |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `OPENAI_API_KEY` | OpenAI API key for script generation |
| `FAL_KEY` | FAL.ai API key for video frame extraction/combining |
| `KIE_AI_API_KEY` | Kie.ai API key for avatar video generation |

## Frontend Variables (Optional)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase URL for frontend client |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key for frontend client |

## How to Set Up

1. Go to your Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with its value
5. Make sure to set them for **Production**, **Preview**, and **Development** environments as needed
