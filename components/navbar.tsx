'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Gamepad2, Search, PlusCircle, User, LogOut, ShieldCheck, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Simulation of auth state (can be replaced by real Supabase user later)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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
              Solar<span className="text-primary font-extrabold text-xs align-super">●</span>Loot
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="text-zinc-400 hover:text-white transition">
              Marketplace
            </Link>
            <Link href="/?category=boosting" className="text-zinc-400 hover:text-white transition">
              Boosting
            </Link>
            <Link href="/#faq" className="text-zinc-400 hover:text-white transition">
              How it works
            </Link>
          </nav>
        </div>

        {/* Search Bar - Linear style */}
        <div className="hidden sm:flex relative flex-1 max-w-sm mx-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search items, skins, accounts..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`w-full bg-zinc-900/40 text-zinc-200 placeholder-zinc-500 pl-9 pr-4 py-1.5 rounded-full text-xs border transition-all duration-300 outline-none ${
              isSearchFocused
                ? 'border-primary/50 bg-zinc-900/80 shadow-[0_0_15px_rgba(255,87,34,0.1)]'
                : 'border-white/5 hover:border-white/10'
            }`}
          />
        </div>

        {/* Auth / Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link href="/listings/create">
                <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary gap-1.5">
                  <PlusCircle className="h-3.5 w-3.5" />
                  List Item
                </Button>
              </Link>
              <Link href="/profile">
                <Button size="sm" variant="ghost" className="h-8 text-xs text-zinc-300 hover:text-white gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => setIsLoggedIn(false)} className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <span className="text-xs text-zinc-400 hover:text-white transition px-3 py-1.5 cursor-pointer">
                  Sign In
                </span>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(255,87,34,0.2)]">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8 text-zinc-400 hover:text-white"
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
              placeholder="Search items, skins, accounts..."
              className="w-full bg-zinc-900/60 text-zinc-200 placeholder-zinc-500 pl-9 pr-4 py-2 rounded-full text-xs border border-white/5 outline-none"
            />
          </div>
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-zinc-300 hover:text-white"
          >
            Marketplace
          </Link>
          <Link
            href="/?category=boosting"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-zinc-300 hover:text-white"
          >
            Boosting
          </Link>
          <Link
            href="/#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-zinc-300 hover:text-white"
          >
            How it works
          </Link>
          
          <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link href="/listings/create" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center text-xs h-9 bg-primary text-white">
                    List Item
                  </Button>
                </Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center text-xs h-9 border-white/10 text-white">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button variant="outline" className="w-full justify-center text-xs h-9 border-white/10 text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button className="w-full justify-center text-xs h-9 bg-primary text-white">
                    Register
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
