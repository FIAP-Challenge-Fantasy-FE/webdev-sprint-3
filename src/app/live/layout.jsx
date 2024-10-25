'use client'

import { useState, useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import LivePageHeader from '@/components/live/Header'
import Footer from '@/components/live/Footer'
import { motion } from 'framer-motion'

export default function LiveLayout({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <LivePageHeader />
        <motion.main 
          className="flex-grow container mx-auto px-4 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}