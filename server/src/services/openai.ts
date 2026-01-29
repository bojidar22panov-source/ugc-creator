import axios from 'axios'

interface GenerateScriptParams {
    productName: string
    productDescription?: string
    tone: string
    duration: number
}

// UGC Structure templates based on duration
const UGC_STRUCTURES = {
    1: "Hook/CTA Combo - Direct, high-energy pitch",
    2: "Scene 1: Hook + Interest Peak | Scene 2: Value + CTA",
    3: "Scene 1: Hook | Scene 2: Interest Peak + Value | Scene 3: Social Proof + CTA",
    4: "Scene 1: Hook + Problem Tease | Scene 2: Interest Peak + Problem Deep Dive | Scene 3: Value + Solution | Scene 4: Social Proof + CTA",
    5: "Scene 1: Hook + Attention Grab | Scene 2: Problem Details + Interest Peak | Scene 3: Solution + Value | Scene 4: Social Proof + Results | Scene 5: Strong CTA + Urgency",
    6: "Scene 1: Hook | Scene 2: Problem + Interest Peak | Scene 3: Problem Deep Dive + Empathy | Scene 4: Solution + Key Value | Scene 5: Social Proof + Results | Scene 6: Benefits Recap + CTA",
    7: "Scene 1: Hook | Scene 2: Problem Introduction | Scene 3: Problem Agitation + Interest Peak | Scene 4: Solution + Value | Scene 5: Solution Deep Dive | Scene 6: Social Proof + Results | Scene 7: Benefits + Strong CTA",
    8: "Scene 1: Hook | Scene 2: Problem Introduction | Scene 3: Problem Expansion + Interest Peak | Scene 4: Solution Introduction | Scene 5: Solution Value Proposition | Scene 6: Social Proof Part 1 | Scene 7: Social Proof Part 2 + Results | Scene 8: Benefits Recap + Urgent CTA"
}

export const openaiService = {
    async generateScript({ productName, productDescription, tone, duration }: GenerateScriptParams): Promise<string> {
        const API_KEY = process.env.OPENAI_API_KEY
        if (!API_KEY) {
            throw new Error('OPENAI_API_KEY is not defined in environment variables')
        }

        // Calculate scenes (8 seconds each)
        const sceneCount = Math.ceil(duration / 8)
        const minWords = sceneCount * 16
        const maxWords = sceneCount * 22

        // Get UGC structure for this duration
        const ugcStructure = UGC_STRUCTURES[sceneCount as keyof typeof UGC_STRUCTURES] || UGC_STRUCTURES[8]

        const systemPrompt = `You are an expert UGC (User Generated Content) copywriter specialist.

YOUR ROLE:
Generate a Bulgarian-language UGC video script ONLY. Do NOT include any instructions about avatar behavior, camera angles, or visual directions.

SCRIPT REQUIREMENTS:
- Language: Bulgarian ONLY (no English)
- Total duration: ${duration} seconds
- Number of scenes: ${sceneCount} (each scene is exactly 8 seconds)
- Word count: ${minWords}-${maxWords} words total (16-22 words per scene)
- Each scene MUST end on a complete word (never cut mid-word)
- Natural, conversational speaking pace

UGC STRUCTURE FOR ${sceneCount} SCENES:
${ugcStructure}

UGC PRINCIPLES:
- Sound authentic and relatable (like a real person recommending to a friend)
- Focus on benefits and real-world use
- Use natural language, avoid corporate/salesy tone
- Create emotional connection
- Be specific and credible

OUTPUT FORMAT:
Return ONLY the script text. No scene numbers, no directions, no stage instructions. Just the words the avatar will speak, naturally paced for ${duration} seconds.`

        const userPrompt = `Product: ${productName}
${productDescription ? `Description: ${productDescription}` : ''}
Tone: ${tone}

Generate a ${duration}-second UGC video script in Bulgarian following the ${sceneCount}-scene structure defined above.

CRITICAL RULES:
- ONLY Bulgarian language
- ${minWords}-${maxWords} words total
- Each 8-second scene should be approximately 16-22 words
- End each scene on a complete word
- Natural, authentic voice
- NO avatar behavior descriptions
- NO camera instructions
- ONLY the spoken script text`

        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 800
                },
                {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            const script = response.data.choices[0]?.message?.content
            if (!script) {
                throw new Error('No script generated from OpenAI')
            }

            return script.trim()
        } catch (error) {
            console.error('OpenAI API Error:', error)
            if (axios.isAxiosError(error)) {
                throw new Error(`OpenAI Error: ${error.response?.data?.error?.message || error.message}`)
            }
            throw error
        }
    }
}
