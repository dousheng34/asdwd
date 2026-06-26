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
  Gamepad,
  Loader2,
  PlusCircle,
  AlertTriangle,
  ChevronRight,
  Scale,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/client'
import { useTranslation } from '@/lib/i18n'

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
  const { language, t } = useTranslation()
  const ht = t('home')

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

  const getCatDesc = (slug: string) => {
    if (language === 'kz') {
      if (slug === 'items') return 'Скиндер, қару кейстері, сауыттар, көліктер'
      if (slug === 'currency') return 'Алтын, кілттер, тиындар, ұпайлар'
      if (slug === 'accounts') return '30+ деңгейлі Смурфтар, рейтингке дайын аккаунттар'
      if (slug === 'boosting') return 'Рейтингті көтеру, жетістіктерді орындау, коучинг'
    } else if (language === 'en') {
      if (slug === 'items') return 'Skins, weapon cases, armor, mounts'
      if (slug === 'currency') return 'Gold, keys, coins, points'
      if (slug === 'accounts') return 'Level 30+ Smurfs, Ranked Ready, OG items'
      if (slug === 'boosting') return 'Rank boost, achievement runs, coaching'
    } else {
      if (slug === 'items') return 'Скины, кейсы, броня, маунты'
      if (slug === 'currency') return 'Золото, ключи, монеты, очки'
      if (slug === 'accounts') return 'Смурфы 30+ уровня, калибровка, редкие вещи'
      if (slug === 'boosting') return 'Буст ранга, прохождение рейдов, коучинг'
    }
    return ''
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-24">
      
      {/* 1. Hero Section */}
      <section className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium tracking-wide animate-pulse">
          <ShieldCheck className="h-3.5 w-3.5" /> {ht.statsEscrow}
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
          {ht.heroTitle.split('with')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-300 cyan-text-glow">Asyk</span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 font-light max-w-xl">
          {ht.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full justify-center">
          {user ? (
            <Link href="/listings/create" className="sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-semibold bg-primary hover:bg-primary/95 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] h-11 px-8 rounded-md transition-all cursor-pointer">
                {t('navbar').listItem}
              </Button>
            </Link>
          ) : (
            <Link href="/auth/register" className="sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-semibold bg-primary hover:bg-primary/95 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] h-11 px-8 rounded-md transition-all cursor-pointer">
                {t('navbar').register}
              </Button>
            </Link>
          )}
          <a href="#escrow-flow" className="sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/10 hover:border-white/20 text-zinc-300 hover:text-white h-11 px-6 rounded-md cursor-pointer">
              {ht.howItWorksTitle}
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
            <h2 className="text-xl font-bold tracking-tight text-white">
              {language === 'kz' ? 'Танымал ойындарды шолу' : language === 'en' ? 'Explore Popular Games' : 'Популярные игры'}
            </h2>
            <p className="text-xs text-zinc-500">
              {language === 'kz' ? 'Заттарды, валютаны және бустингті табу үшін ойынды таңдаңыз.' : language === 'en' ? 'Pick your game to discover items, currency and boosting.' : 'Выберите игру, чтобы открыть товары, валюту или бустинг.'}
            </p>
          </div>
          <span className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1 font-medium">
            {language === 'kz' ? 'Барлық ойындар' : language === 'en' ? 'See all games' : 'Все игры'} <ChevronRight className="h-3.5 w-3.5" />
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
                  className={`p-5 rounded-xl cursor-pointer border-glow transition-all ${
                    selectedGame === game.name
                      ? 'border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                      : 'bg-zinc-900/20'
                  }`}
                >
                  <div className="text-2xl mb-3">{meta.icon}</div>
                  <h3 className="text-sm font-semibold text-white">{game.name}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {getActiveOfferCount(game.name)} {language === 'kz' ? 'белсенді ұсыныс' : language === 'en' ? 'Active offers' : 'активных предложений'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 3. Category Grid Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {language === 'kz' ? 'Санаттар бойынша шолу' : language === 'en' ? 'Browse by Category' : 'Поиск по категориям'}
          </h2>
          <p className="text-xs text-zinc-500">
            {language === 'kz' ? 'Даму үшін қажетті нәрсені дәл табыңыз.' : language === 'en' ? 'Find exactly what you need to advance.' : 'Найдите именно то, что вам необходимо для продвижения.'}
          </p>
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
              const localizedCatName = 
                cat.slug === 'items' ? t('createListing').categoryLabel.includes('Санат') ? 'Заттар' : 'Items' :
                cat.slug === 'currency' ? 'Валюта' :
                cat.slug === 'accounts' ? 'Аккаунттар' :
                cat.slug === 'boosting' ? 'Бустинг' : cat.name;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                  className={`p-5 rounded-xl cursor-pointer border-glow flex items-start gap-4 transition-all ${
                    selectedCategory === cat.name
                      ? 'border-primary/50 bg-primary/5'
                      : 'bg-zinc-900/20'
                  }`}
                >
                  <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-white/5 text-primary">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {language === 'kz' ? localizedCatName : language === 'en' ? cat.name : cat.name === 'Items' ? 'Предметы' : cat.name === 'Currency' ? 'Валюта' : cat.name === 'Accounts' ? 'Аккаунты' : 'Бустинг'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      {getCatDesc(cat.slug)}
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
            <h2 className="text-xl font-bold tracking-tight text-white">{ht.activeListings}</h2>
            <p className="text-xs text-zinc-500">
              {selectedGame || selectedCategory 
                ? `${language === 'kz' ? 'Таңдалған фильтрлер' : 'Фильтры'}: ${[selectedGame, selectedCategory].filter(Boolean).join(' > ')}` 
                : language === 'kz' ? 'Жаңа және өзекті ойын ұсыныстары осында.' : language === 'en' ? 'Freshly added hot gaming deals.' : 'Свежие игровые предложения от игроков.'}
            </p>
          </div>
          {(selectedGame || selectedCategory) && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => { setSelectedGame(null); setSelectedCategory(null); }}
              className="text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              {language === 'kz' ? 'Фильтрлерді тазалау' : language === 'en' ? 'Reset Filters' : 'Сбросить фильтры'}
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
                <Card className="bg-zinc-900/20 border-white/5 hover:border-primary/20 transition-all duration-300 h-full flex flex-col hover:shadow-[0_0_15px_rgba(6,182,212,0.08)] cursor-pointer group">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{listing.game?.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/5 text-[9px] text-zinc-400">
                        {listing.category?.name === 'Items' ? language === 'kz' ? 'Заттар' : language === 'en' ? 'Items' : 'Предметы' :
                         listing.category?.name === 'Currency' ? language === 'kz' ? 'Валюта' : language === 'en' ? 'Currency' : 'Валюта' :
                         listing.category?.name === 'Accounts' ? language === 'kz' ? 'Аккаунты' : language === 'en' ? 'Accounts' : 'Аккаунты' :
                         language === 'kz' ? 'Бустинг' : language === 'en' ? 'Boosting' : 'Бустинг'}
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
                    <div className="text-lg font-black text-primary font-mono">{listing.price.toFixed(0)} ₸</div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span>{listing.seller?.rating?.toFixed(1) || '5.0'} ({listing.seller?.sales_count || 0})</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-zinc-900/10 border border-white/5 text-center space-y-4 max-w-xl mx-auto">
            <Gamepad className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">
              {language === 'kz' ? 'Ұсыныстар табылмады' : language === 'en' ? 'No Offers Found' : 'Предложения не найдены'}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
              {ht.noListings}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              {user ? (
                <>
                  <Link href="/listings/create">
                    <Button size="sm" className="bg-primary hover:bg-primary/95 text-white font-semibold gap-1.5 text-xs h-9 cursor-pointer">
                      <PlusCircle className="h-4 w-4" /> {t('navbar').listItem}
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={seeding}
                    onClick={handleSeedMockData}
                    className="border-white/10 text-zinc-400 hover:text-white text-xs h-9 cursor-pointer"
                  >
                    {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : language === 'kz' ? 'Үлгі тауарларды қосу' : language === 'en' ? 'Seed Default Offers' : 'Добавить тестовые товары'}
                  </Button>
                </>
              ) : (
                <Link href="/auth/login">
                  <Button size="sm" className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs h-9 cursor-pointer">
                    {t('navbar').signIn}
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
          <h2 className="text-2xl font-black text-white">{ht.howItWorksTitle}</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {language === 'kz' ? 'P2P саудасы қауіпті болуы мүмкін. Біз сатушы тауарды жібергенше сатып алушының төлемін қауіпсіз сақтаймыз.' : language === 'en' ? 'P2P item trades can be risky. We hold the buyer\'s payment safely until the seller sends the item.' : 'P2P сделки могут быть рискованными. Мы надежно удерживаем платеж покупателя, пока продавец не передаст товар.'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-3 p-6 bg-zinc-900/10 border border-white/5 rounded-xl">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black rounded-lg mx-auto">1</div>
            <h3 className="text-sm font-bold text-white">{ht.howItWorksStep1Title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-light">{ht.howItWorksStep1Desc}</p>
          </div>
          <div className="space-y-3 p-6 bg-zinc-900/10 border border-white/5 rounded-xl">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black rounded-lg mx-auto">2</div>
            <h3 className="text-sm font-bold text-white">{ht.howItWorksStep2Title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-light">{ht.howItWorksStep2Desc}</p>
          </div>
          <div className="space-y-3 p-6 bg-zinc-900/10 border border-white/5 rounded-xl">
            <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black rounded-lg mx-auto">3</div>
            <h3 className="text-sm font-bold text-white">{ht.howItWorksStep3Title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-light">{ht.howItWorksStep3Desc}</p>
          </div>
        </div>
      </section>

      {/* 5. Benefits Section */}
      <section className="py-12 border-t border-white/5 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl font-black text-white">{ht.statsTitle}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="space-y-2 p-6 bg-zinc-900/10 border border-white/5 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h3 className="text-sm font-bold text-white">{ht.statsEscrow}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{ht.statsEscrowDesc}</p>
          </div>
          <div className="space-y-2 p-6 bg-zinc-900/10 border border-white/5 rounded-xl">
            <Zap className="h-6 w-6 text-primary animate-pulse" />
            <h3 className="text-sm font-bold text-white">{ht.statsRealtime}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{ht.statsRealtimeDesc}</p>
          </div>
          <div className="space-y-2 p-6 bg-zinc-900/10 border border-white/5 rounded-xl">
            <Scale className="h-6 w-6 text-primary" />
            <h3 className="text-sm font-bold text-white">{ht.statsArbitration}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{ht.statsArbitrationDesc}</p>
          </div>
        </div>
      </section>

    </div>
  )
}
