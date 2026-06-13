'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ShieldCheck, 
  Coins, 
  Sword, 
  UserCheck, 
  TrendingUp, 
  Flame, 
  Star, 
  Clock, 
  ArrowRight,
  ChevronRight,
  Gamepad
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const GAMES = [
  { name: 'Counter-Strike 2', slug: 'cs2', activeCount: 1420, icon: '🎯' },
  { name: 'Dota 2', slug: 'dota2', activeCount: 840, icon: '🛡️' },
  { name: 'World of Warcraft', slug: 'wow', activeCount: 2150, icon: '⚔️' },
  { name: 'Valorant', slug: 'valorant', activeCount: 930, icon: '🔫' },
]

const CATEGORIES = [
  { name: 'In-Game Items', slug: 'items', icon: Sword, desc: 'Skins, weapon cases, armor, mounts' },
  { name: 'Currency', slug: 'currency', icon: Coins, desc: 'Gold, keys, coins, points' },
  { name: 'Accounts', slug: 'accounts', icon: UserCheck, desc: 'Level 30+ Smurfs, Ranked Ready, OG items' },
  { name: 'Boosting', slug: 'boosting', icon: TrendingUp, desc: 'Rank boost, achievement runs, coaching' },
]

const FEATURED_LISTINGS = [
  {
    id: 'l1',
    title: 'M9 Bayonet | Fade (FN 98% Fade)',
    game: 'Counter-Strike 2',
    category: 'Items',
    price: 1420.00,
    seller: 'AetherSkins',
    sellerRating: 4.9,
    deliveryTime: 'Instant',
    hot: true
  },
  {
    id: 'l2',
    title: '100,000 Gold (US-Sargeras Alliance)',
    game: 'World of Warcraft',
    category: 'Currency',
    price: 85.00,
    seller: 'WowGoldDealer',
    sellerRating: 4.8,
    deliveryTime: '10 mins',
    hot: false
  },
  {
    id: 'l3',
    title: 'Immortal 3 Account (All Agents, 12 Skins)',
    game: 'Valorant',
    category: 'Accounts',
    price: 240.00,
    seller: 'SmurfStore',
    sellerRating: 4.7,
    deliveryTime: 'Instant',
    hot: true
  },
  {
    id: 'l4',
    title: '1-1000 MMR Rank Boost (Solo/Duo)',
    game: 'Dota 2',
    category: 'Boosting',
    price: 75.00,
    seller: 'DotabuffPro',
    sellerRating: 5.0,
    deliveryTime: '24 hours',
    hot: false
  }
]

export default function HomePage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredListings = FEATURED_LISTINGS.filter(listing => {
    if (selectedGame && listing.game !== selectedGame) return false
    if (selectedCategory && listing.category.toLowerCase() !== selectedCategory.toLowerCase()) return false
    return true
  })

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-24">
      
      {/* 1. Hero Section */}
      <section className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium tracking-wide animate-pulse">
          <Flame className="h-3 w-3" /> Secure Escrow Trading Active
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
          Level Up Your Game with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400 orange-text-glow">SolarLoot</span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 font-light max-w-xl">
          Secure, peer-to-peer marketplace for in-game gold, items, accounts, and boosting. Zero-risk transactions backed by modern escrow protection.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full justify-center">
          <Link href="/auth/register" className="sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto font-semibold bg-primary hover:bg-primary/95 text-white shadow-[0_0_20px_rgba(255,87,34,0.25)] h-11 px-8 rounded-md transition-all">
              Start Trading
            </Button>
          </Link>
          <a href="#escrow-flow" className="sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/10 hover:border-white/20 text-zinc-300 hover:text-white h-11 px-6 rounded-md">
              Learn How It Works
            </Button>
          </a>
        </div>
      </section>

      {/* 2. Game Grid Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Explore Popular Games</h2>
            <p className="text-xs text-zinc-500">Pick your game to discover items, currency and boosting.</p>
          </div>
          <span className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
            See all games <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GAMES.map((game) => (
            <div
              key={game.slug}
              onClick={() => setSelectedGame(selectedGame === game.name ? null : game.name)}
              className={`p-5 rounded-xl cursor-pointer border-glow ${
                selectedGame === game.name
                  ? 'border-primary/50 bg-primary/5'
                  : 'bg-zinc-900/20'
              }`}
            >
              <div className="text-2xl mb-3">{game.icon}</div>
              <h3 className="text-sm font-semibold text-white">{game.name}</h3>
              <p className="text-[10px] text-zinc-500 mt-1">{game.activeCount} Active offers</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Category Grid Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Browse by Category</h2>
          <p className="text-xs text-zinc-500">Find exactly what you need to advance.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon
            return (
              <div
                key={cat.slug}
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                className={`p-5 rounded-xl cursor-pointer border-glow flex items-start gap-4 ${
                  selectedCategory === cat.name
                    ? 'border-primary/50 bg-primary/5'
                    : 'bg-zinc-900/20'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-white/5 text-primary">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{cat.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Featured Listings Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Featured Offers</h2>
            <p className="text-xs text-zinc-500">
              {selectedGame || selectedCategory 
                ? `Filtered listings for ${[selectedGame, selectedCategory].filter(Boolean).join(' > ')}` 
                : 'Handpicked hot gaming deals updated hourly.'}
            </p>
          </div>
          {(selectedGame || selectedCategory) && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => { setSelectedGame(null); setSelectedCategory(null); }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="bg-zinc-900/10 border-white/5 hover:border-primary/30 border-glow flex flex-col justify-between overflow-hidden">
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500">
                    <span className="truncate">{listing.game}</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px]">
                      {listing.category}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-semibold text-zinc-100 hover:text-primary transition mt-2 truncate">
                    <Link href={`/listings/${listing.id}`}>
                      {listing.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-zinc-400">
                      <span className="font-semibold text-white">{listing.seller}</span>
                      <span className="text-[10px] text-zinc-500">({listing.sellerRating} ★)</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400 text-[10px]">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      <span>{listing.deliveryTime}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-white/5 mt-auto">
                  <div className="text-lg font-bold text-primary font-mono">
                    ${listing.price.toFixed(2)}
                  </div>
                  <Link href={`/listings/${listing.id}`}>
                    <Button size="sm" className="h-7 text-[10px] bg-zinc-800 hover:bg-primary text-white hover:shadow-[0_0_10px_rgba(255,87,34,0.15)] font-semibold px-3.5">
                      Buy Now
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border border-dashed border-white/5 bg-zinc-900/10">
            <Gamepad className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No Listings Found</h3>
            <p className="text-xs text-zinc-500 mt-1">Try resetting filters to view all listings.</p>
          </div>
        )}
      </section>

      {/* 5. Escrow Flow Section */}
      <section id="escrow-flow" className="p-8 sm:p-12 rounded-2xl bg-zinc-900/20 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">How Solar Escrow Works</h2>
          <p className="text-sm text-zinc-400 leading-relaxed font-light">
            We hold payments securely until your gaming goods are fully delivered. Trade without stress or the risk of getting scammed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12 relative">
          <div className="space-y-2 relative">
            <div className="text-xs font-bold text-primary font-mono">01.</div>
            <h4 className="text-sm font-semibold text-zinc-200">Buyer Pays Escrow</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">Payment is processed and safely locked in SolarLoot's secure vault.</p>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold text-primary font-mono">02.</div>
            <h4 className="text-sm font-semibold text-zinc-200">Seller Delivers</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">Seller delivers currency, items, account info, or starts the boost.</p>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold text-primary font-mono">03.</div>
            <h4 className="text-sm font-semibold text-zinc-200">Verification</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">Buyer verifies receipt of gaming values. Both submit delivery proof if needed.</p>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold text-primary font-mono">04.</div>
            <h4 className="text-sm font-semibold text-zinc-200">Funds Released</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">Escrow unlocks the funds directly to the seller's wallet balance for withdrawal.</p>
          </div>
        </div>
      </section>

    </div>
  )
}
