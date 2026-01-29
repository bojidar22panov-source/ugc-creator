import type { Avatar } from '@/types'

// Demo avatars data
// Using public Unsplash images for avatars to ensure accessibility by the backend API
// and allowing for consistent display across frontend components.
export const DEMO_AVATARS: Avatar[] = [
    {
        id: '1',
        name: 'Мария',
        heygenId: 'maria_1',
        gender: 'female',
        ageGroup: '25-35',
        style: 'professional',
        industry: 'beauty',
        // Using a professional business woman portrait from Unsplash
        thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=60',
        previewUrl: null,
        isActive: true
    },
    {
        id: '2',
        name: 'Георги',
        heygenId: 'georgi_1',
        gender: 'male',
        ageGroup: '25-35',
        style: 'casual',
        industry: 'tech',
        thumbnailUrl: '',
        previewUrl: null,
        isActive: true
    },
    {
        id: '3',
        name: 'Ивана',
        heygenId: 'ivana_1',
        gender: 'female',
        ageGroup: '18-25',
        style: 'sporty',
        industry: 'fitness',
        thumbnailUrl: '',
        previewUrl: null,
        isActive: true
    },
    {
        id: '4',
        name: 'Петър',
        heygenId: 'petar_1',
        gender: 'male',
        ageGroup: '35-45',
        style: 'professional',
        industry: 'general',
        thumbnailUrl: '',
        previewUrl: null,
        isActive: true
    },
    {
        id: '5',
        name: 'Ана',
        heygenId: 'ana_1',
        gender: 'female',
        ageGroup: '25-35',
        style: 'elegant',
        industry: 'fashion',
        thumbnailUrl: '',
        previewUrl: null,
        isActive: true
    },
    {
        id: '6',
        name: 'Димитър',
        heygenId: 'dimitar_1',
        gender: 'male',
        ageGroup: '25-35',
        style: 'casual',
        industry: 'food',
        thumbnailUrl: '',
        previewUrl: null,
        isActive: true
    },
    {
        id: '7',
        name: 'Елена',
        heygenId: 'elena_1',
        gender: 'female',
        ageGroup: '35-45',
        style: 'professional',
        industry: 'general',
        thumbnailUrl: '',
        previewUrl: null,
        isActive: true
    },
    {
        id: '8',
        name: 'Николай',
        heygenId: 'nikolay_1',
        gender: 'male',
        ageGroup: '18-25',
        style: 'sporty',
        industry: 'fitness',
        thumbnailUrl: '',
        previewUrl: null,
        isActive: true
    },
]
