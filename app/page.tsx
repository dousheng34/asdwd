'use client'

import { useState, useEffect } from 'react'
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
  Gamepad,
  Loader2,
  PlusCircle,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/client'

const GAME_METADATA: Record<string, { icon: string, banner: string }> = {
  'cs2': { icon: '🎯', banner: 'Counter-Strike 2' },
  'dota2': { icon: '🛡️', banner: 'Dota 2' },
  'wow': { icon: '⚔️', banner: 'World of Warcraft' },
  'valorant': { icon: '🔫', banner: 'Valorant' },
}

const CATEGORY_ICONS: Record<string, any> = {
  'items': Sword,
  'currency': Coins,
  'accounts': UserCheck,
  'boosting': TrendingUp,
}

export default function HomePage() {
  const supabase = createClient()
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const [listings, setListings] = useState<any[]>([])
  const [games, setGames] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Get current user session
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // 2. Fetch active listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          price,
          stock,
          status,
          created_at,
          game:games(id, name, slug),
          category:categories(id, name, slug),
          seller:profiles(id, username, rating, sales_count)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (listingsError) throw listingsError
      setListings(listingsData || [])

      // 3. Fetch games and categories
      const { data: gamesData } = await supabase.from('games').select('*').eq('is_active', true)
      const { data: categoriesData } = await supabase.from('categories').select('*')

      setGames(gamesData || [])
      setCategories(categoriesData || [])
    } catch (err: any) {
      console.error('Error fetching homepage data:', err)
      setError('Failed to load listings. Check your internet connection or Supabase status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSeedMockData = async () => {
    if (!user) {
      setError('You must be logged in to seed mock listings.')
      return
    }

    setSeeding(true)
    setError(null)
    try {
      // 1. Find or seed games & categories
      let { data: gamesData } = await supabase.from('games').select('id, slug')
      let { data: categoriesData } = await supabase.from('categories').select('id, slug')

      if (!gamesData || gamesData.length === 0) {
        const defaultGames = [
          { name: 'Counter-Strike 2', slug: 'cs2' },
          { name: 'Dota 2', slug: 'dota2' },
          { name: 'World of Warcraft', slug: 'wow' },
          { name: 'Valorant', slug: 'valorant' }
        ]
        const { data: seededGames } = await supabase.from('games').insert(defaultGames).select('id, slug')
        gamesData = seededGames || []
      }

      if (!categoriesData || categoriesData.length === 0) {
        const defaultCategories = [
          { name: 'Items', slug: 'items', icon: 'Sword' },
          { name: 'Currency', slug: 'currency', icon: 'Coins' },
          { name: 'Accounts', slug: 'accounts', icon: 'UserCheck' },
          { name: 'Boosting', slug: 'boosting', icon: 'TrendingUp' }
        ]
        const { data: seededCategories } = await supabase.from('categories').insert(defaultCategories).select('id, slug')
        categoriesData = seededCategories || []
      }

      const cs2Id = gamesData.find(g => g.slug === 'cs2')?.id
      const wowId = gamesData.find(g => g.slug === 'wow')?.id
      const valorantId = gamesData.find(g => g.slug === 'valorant')?.id
      const dota2Id = gamesData.find(g => g.slug === 'dota2')?.id

      const itemsId = categoriesData.find(c => c.slug === 'items')?.id
      const currencyId = categoriesData.find(c => c.slug === 'currency')?.id
      const accountsId = categoriesData.find(c => c.slug === 'accounts')?.id
      const boostingId = categoriesData.find(c => c.slug === 'boosting')?.id

      // 2. Insert mock listings linked to current user
      const mockListings = []
      if (cs2Id && itemsId) {
        mockListings.push({
          title: 'M9 Bayonet | Fade (FN 98% Fade)',
          description: '[Delivery: Instant] Extremely clean factory new M9 Bayonet. Fade percentage is verified at 98.2%. Float value is 0.0102. Fully ready to transfer to your Steam account.',
          price: 1420.00,
          stock: 1,
          game_id: cs2Id,
          category_id: itemsId,
          seller_id: user.id,
          status: 'active'
        })
      }
      if (wowId && currencyId) {
        mockListings.push({
          title: '100,000 Gold (US-Sargeras Alliance)',
          description: '[Delivery: 10 Mins] Pure WoW gold farmed legitimately. Available for Alliance side on US-Sargeras realm.',
          price: 85.00,
          stock: 10,
          game_id: wowId,
          category_id: currencyId,
          seller_id: user.id,
          status: 'active'
        })
      }
      if (valorantId && accountsId) {
        mockListings.push({
          title: 'Immortal 3 Account (All Agents, 12 Skins)',
          description: '[Delivery: Instant] Unverified email account, completely safe and eligible for full email changing.',
          price: 240.00,
          stock: 1,
          game_id: valorantId,
          category_id: accountsId,
          seller_id: user.id,
          status: 'active'
        })
      }
      if (dota2Id && boostingId) {
        mockListings.push({
          title: '1-1000 MMR Rank Boost (Solo/Duo)',
          description: '[Delivery: 24 Hours] Professional MMR boosting service by a 9.5k MMR top-100 player.',
          price: 75.00,
          stock: 1,
          game_id: dota2Id,
          category_id: boostingId,
          seller_id: user.id,
          status: 'active'
        })
      }

      if (mockListings.length > 0) {
        const { error: insertErr } = await supabase.from('listings').insert(mockListings)
        if (insertErr) throw insertErr
      }

      await loadData()
    } catch (err: any) {
      console.error('Seeding error:', err)
      setError(err.message || 'Failed to seed mock data.')
    } finally {
      setSeeding(false)
    }
  }

  // Filter listings based on user selection
  const filteredListings = listings.filter(listing => {
    if (selectedGame && listing.game?.name !== selectedGame) return false
    if (selectedCategory && listing.category?.name !== selectedCategory) return false
    return true
  })

  // Group listings count for games
  const getActiveOfferCount = (gameName: string) => {
    return listings.filter(l => l.game?.name === gameName).length
  }

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
          {user ? (
            <Link href="/listings/create" className="sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-semibold bg-primary hover:bg-primary/95 text-white shadow-[0_0_20px_rgba(255,87,34,0.25)] h-11 px-8 rounded-md transition-all">
                Create Offer
              </Button>
            </Link>
          ) : (
            <Link href="/auth/register" className="sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-semibold bg-primary hover:bg-primary/95 text-white shadow-[0_0_20px_rgba(255,87,34,0.25)] h-11 px-8 rounded-md transition-all">
                Start Trading
              </Button>
            </Link>
          )}
          <a href="#escrow-flow" className="sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/10 hover:border-white/20 text-zinc-300 hover:text-white h-11 px-6 rounded-md">
              Learn How It Works
            </Button>
          </a>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2 max-w-4xl mx-auto">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="p-5 rounded-xl border border-white/5 bg-zinc-900/10 animate-pulse h-[110px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {games.map((game) => {
              const meta = GAME_METADATA[game.slug] || { icon: '🎮' }
              return (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(selectedGame === game.name ? null : game.name)}
                  className={`p-5 rounded-xl cursor-pointer border-glow ${
                    selectedGame === game.name
                      ? 'border-primary/50 bg-primary/5'
                      : 'bg-zinc-900/20'
                  }`}
                >
                  <div className="text-2xl mb-3">{meta.icon}</div>
                  <h3 className="text-sm font-semibold text-white">{game.name}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">{getActiveOfferCount(game.name)} Active offers</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 3. Category Grid Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Browse by Category</h2>
          <p className="text-xs text-zinc-500">Find exactly what you need to advance.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="p-5 rounded-xl border border-white/5 bg-zinc-900/10 animate-pulse h-[80px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const IconComponent = CATEGORY_ICONS[cat.slug] || Sword
              return (
                <div
                  key={cat.id}
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
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      {cat.slug === 'items' && 'Skins, weapon cases, armor, mounts'}
                      {cat.slug === 'currency' && 'Gold, keys, coins, points'}
                      {cat.slug === 'accounts' && 'Level 30+ Smurfs, Ranked Ready, OG items'}
                      {cat.slug === 'boosting' && 'Rank boost, achievement runs, coaching'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="p-6 rounded-2xl border border-white/5 bg-zinc-900/10 animate-pulse h-[200px]" />
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="bg-zinc-900/20 border-white/5 hover:border-primary/20 transition-all duration-300 h-full flex flex-col hover:shadow-[0_0_15px_rgba(255,87,34,0.08)] cursor-pointer group">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{listing.game?.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/5 text-[9px] text-zinc-400">
                        {listing.category?.name}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-2 mt-2">
                      {listing.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 pb-3 flex-grow">
                    <CardDescription className="text-xs text-zinc-400 line-clamp-3 font-light leading-relaxed">
                      {listing.description.replace(/^\[Delivery: [^\]]+\]\s*/, '')}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="p-5 border-t border-white/5 flex items-center justify-between mt-auto">
                    <div className="text-lg font-black text-primary font-mono">${listing.price.toFixed(2)}</div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span>{listing.seller?.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-zinc-900/10 border border-white/5 text-center space-y-4 max-w-xl mx-auto">
            <Gamepad className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Offers Found</h3>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
              There are no active offers for the selected filters.
              {user ? ' You can create the first listing right now!' : ' Register/login and post one!'}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              {user ? (
                <>
                  <Link href="/listings/create">
                    <Button size="sm" className="bg-primary hover:bg-primary/95 text-white font-semibold gap-1.5 text-xs h-9">
                      <PlusCircle className="h-4 w-4" /> Create Listing
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={seeding}
                    onClick={handleSeedMockData}
                    className="border-white/10 text-zinc-400 hover:text-white text-xs h-9"
                  >
                    {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Seed Default Offers'}
                  </Button>
                </>
              ) : (
                <Link href="/auth/login">
                  <Button size="sm" className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs h-9">
                    Login to Create Offers
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Escrow flow section */}
      <section id="escrow-flow" className="py-12 border-t border-white/5 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl font-black text-white">How Escrow Protection Works</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            P2P item trades can be risky. We hold the buyer's payment safely until the seller sends the item.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-3 p-6 bg-zinc-900/10 border border-white/5 rounded-xl">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black rounded-lg mx-auto">1</div>
            <h3 className="text-sm font-bold text-white">Buyer Pays</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-light">Buyer makes the payment. The money is frozen securely in the SolarLoot Escrow contract.</p>
          </div>
          <div className="space-y-3 p-6 bg-zinc-900/10 border border-white/5 rounded-xl">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black rounded-lg mx-auto">2</div>
            <h3 className="text-sm font-bold text-white">Seller Delivers</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-light">Seller delivers the gaming account or gold to the buyer, and uploads proof of delivery.</p>
          </div>
          <div className="space-y-3 p-6 bg-zinc-900/10 border border-white/5 rounded-xl">
            <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black rounded-lg mx-auto">3</div>
            <h3 className="text-sm font-bold text-white">Escrow Released</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-light">Buyer confirms receipt, or automated trade analyzer releases the funds directly to the seller.</p>
          </div>
        </div>
      </section>

    </div>
  )
}
