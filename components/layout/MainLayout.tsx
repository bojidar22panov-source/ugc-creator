'use client'

import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface MainLayoutProps {
    children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen">
            <Sidebar />
            <div className="ml-[240px] transition-all duration-200">
                <Header />
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
