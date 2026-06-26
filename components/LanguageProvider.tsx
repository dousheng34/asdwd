'use client'

import React, { useState, useEffect } from 'react'
import { Language, LanguageProviderContext, translations, TranslationKeys } from '@/lib/i18n'

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'kz' || saved === 'ru' || saved === 'en')) {
      setLanguageState(saved)
    } else {
      const browserLang = navigator.language.slice(0, 2)
      if (browserLang === 'kk') {
        setLanguageState('kz')
      } else if (browserLang === 'ru') {
        setLanguageState('ru')
      } else {
        setLanguageState('en')
      }
    }
    setMounted(false) // Wait for render
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  // Use 'ru' for server side and initial client side render to avoid hydration mismatch
  const currentLanguage = mounted ? language : 'ru'

  const t = <K extends keyof TranslationKeys>(section: K): TranslationKeys[K] => {
    return translations[currentLanguage][section]
  }

  return (
    <LanguageProviderContext.Provider value={{ language: currentLanguage, setLanguage, t }}>
      {children}
    </LanguageProviderContext.Provider>
  )
}
