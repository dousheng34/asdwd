'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Gamepad2, Search, PlusCircle, User, LogOut, Menu, X, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useTranslation, Language } from '@/lib/i18n'

export default function Navbar() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)

  const { language, setLanguage, t } = useTranslation()
  const navT = t('navbar')

  useEffect(() => {
    const supabase = createClient()

    // Check initial session
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true)
        setUserEmail(data.user.email ?? null)
      }
    })

    // Subscribe to auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true)
        setUserEmail(session.user.email ?? null)
      } else {
        setIsLoggedIn(false)
        setUserEmail(null)
      }
    })

    // Close language dropdown on outside click
    const handleOutsideClick = (e: MouseEvent) => {
      if (langDropdownOpen && !(e.target as HTMLElement).closest('.lang-selector-container')) {
        setLangDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleOutsideClick)

    return () => {
      listener.subscription.unsubscribe()
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [langDropdownOpen])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUserEmail(null)
  }

  const getLangEmoji = (lang: Language) => {
    if (lang === 'kz') return '🇰🇿'
    if (lang === 'ru') return '🇷🇺'
    return '🇬🇧'
  }

  const getLangName = (lang: Language) => {
    if (lang === 'kz') return 'Kazakh'
    if (lang === 'ru') return 'Русский'
    return 'English'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight transition hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Gamepad2 className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              Asyk<span className="text-primary font-extrabold text-xs align-super">.</span>kz
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="text-zinc-400 hover:text-white transition">
              {navT.marketplace}
            </Link>
            <Link href="/?category=boosting" className="text-zinc-400 hover:text-white transition">
              {navT.boosting}
            </Link>
            <Link href="/#escrow-flow" className="text-zinc-400 hover:text-white transition">
              {navT.howItWorks}
            </Link>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="hidden sm:flex relative flex-1 max-w-sm mx-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder={navT.searchPlaceholder}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`w-full bg-zinc-900/40 text-zinc-200 placeholder-zinc-500 pl-9 pr-4 py-1.5 rounded-full text-xs border transition-all duration-300 outline-none ${
              isSearchFocused
                ? 'border-primary/50 bg-zinc-900/80 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                : 'border-white/5 hover:border-white/10'
            }`}
          />
        </div>

        {/* Auth / Action Buttons & Language Selector */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Selector Dropdown */}
          <div className="relative lang-selector-container">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition px-2.5 py-1.5 rounded-lg bg-zinc-900/30 border border-white/5 hover:border-white/10 cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-zinc-500" />
              <span className="uppercase font-medium">{language}</span>
              <span className="text-[9px] text-zinc-600">▼</span>
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-32 bg-zinc-950/95 border border-white/5 rounded-lg shadow-2xl py-1 z-50 animate-in fade-in duration-200">
                {(['ru', 'kz', 'en'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang)
                      setLangDropdownOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-900 hover:text-white flex items-center justify-between cursor-pointer ${
                      language === lang ? 'text-primary font-semibold' : 'text-zinc-400'
                    }`}
                  >
                    <span>{getLangName(lang)}</span>
                    <span className="text-sm">{getLangEmoji(lang)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-white/5" />

          {isLoggedIn ? (
            <>
              <Link href="/listings/create">
                <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary gap-1.5 cursor-pointer">
                  <PlusCircle className="h-3.5 w-3.5" />
                  {navT.listItem}
                </Button>
              </Link>
              <Link href="/profile">
                <Button size="sm" variant="ghost" className="h-8 text-xs text-zinc-300 hover:text-white gap-1.5 cursor-pointer">
                  <User className="h-3.5 w-3.5" />
                  {userEmail ? userEmail.split('@')[0] : navT.dashboard}
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={handleSignOut} className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300 cursor-pointer" title={navT.signOut}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <span className="text-xs text-zinc-400 hover:text-white transition px-3 py-1.5 cursor-pointer">
                  {navT.signIn}
                </span>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer">
                  {navT.register}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          {/* Language Toggle for Mobile (Simple button toggle cycles languages) */}
          <button
            onClick={() => {
              const order: Language[] = ['ru', 'kz', 'en']
              const nextIndex = (order.indexOf(language) + 1) % order.length
              setLanguage(order[nextIndex])
            }}
            className="flex items-center gap-1 text-xs text-zinc-400 px-2 py-1 rounded bg-zinc-900/30 border border-white/5 font-medium cursor-pointer"
            title="Switch Language"
          >
            <span>{getLangEmoji(language)}</span>
            <span className="uppercase text-[10px]">{language}</span>
          </button>

          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8 text-zinc-400 hover:text-white cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-lg px-4 py-4 space-y-3">
          <div className="relative w-full mb-4">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder={navT.searchPlaceholder}
              className="w-full bg-zinc-900/60 text-zinc-200 placeholder-zinc-500 pl-9 pr-4 py-2 rounded-full text-xs border border-white/5 outline-none"
            />
          </div>
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-zinc-300 hover:text-white"
          >
            {navT.marketplace}
          </Link>
          <Link
            href="/?category=boosting"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-zinc-300 hover:text-white"
          >
            {navT.boosting}
          </Link>
          <Link
            href="/#escrow-flow"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-zinc-300 hover:text-white"
          >
            {navT.howItWorks}
          </Link>
          
          <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link href="/listings/create" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center text-xs h-9 bg-primary text-white cursor-pointer">
                    {navT.listItem}
                  </Button>
                </Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center text-xs h-9 border-white/10 text-white cursor-pointer">
                    {navT.dashboard}
                  </Button>
                </Link>
                <Button variant="ghost" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="w-full justify-center text-xs h-9 text-zinc-400 hover:text-white cursor-pointer">
                  {navT.signOut}
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button variant="outline" className="w-full justify-center text-xs h-9 border-white/10 text-white cursor-pointer">
                    {navT.signIn}
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button className="w-full justify-center text-xs h-9 bg-primary text-white cursor-pointer">
                    {navT.register}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
