import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

import { videoRouter } from './routes/video.ts'
import { videosRouter } from './routes/videos.ts'

// Video generation routes (script, generate, status, etc.)
app.use('/api/video', videoRouter)
// Videos CRUD routes (for unified videos table)
app.use('/api/videos', videosRouter)

// Serve static files from the Vite build output
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))

// SPA fallback - serve index.html for all non-API routes
app.get('/{*path}', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'Not found' })
        return
    }
    res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Serving frontend from: ${distPath}`)
})
