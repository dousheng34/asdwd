'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Gamepad2, Coins, Sword, ShieldAlert, ArrowLeft, Loader2, LogIn, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { useTranslation } from '@/lib/i18n'

export default function CreateListingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { language, t } = useTranslation()
  const cl = t('createListing')
  
  const [games, setGames] = useState<{ id: string, name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [game, setGame] = useState('')
  const [category, setCategory] = useState('')
  const [delivery, setDelivery] = useState('Instant')
  const [autoDeliveryData, setAutoDeliveryData] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuthAndLoadData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          setUser(null)
          setAuthLoading(false)
          return
        }

        setUser(currentUser)
        setAuthLoading(false)

        // Load Games
        let { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('id, name')
          .eq('is_active', true)
        
        // Load Categories
        let { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')

        // Auto-seed games if database tables are empty
        if ((!gamesData || gamesData.length === 0) && !gamesError) {
          const defaultGames = [
            { name: 'Counter-Strike 2', slug: 'cs2' },
            { name: 'Dota 2', slug: 'dota2' },
            { name: 'World of Warcraft', slug: 'wow' },
            { name: 'Valorant', slug: 'valorant' }
          ]
          const { data: seededGames } = await supabase.from('games').insert(defaultGames).select('id, name')
          gamesData = seededGames || []
        }

        // Auto-seed categories if empty
        if ((!categoriesData || categoriesData.length === 0) && !categoriesError) {
          const defaultCategories = [
            { name: 'Items', slug: 'items', icon: 'Sword' },
            { name: 'Currency', slug: 'currency', icon: 'Coins' },
            { name: 'Accounts', slug: 'accounts', icon: 'UserCheck' },
            { name: 'Boosting', slug: 'boosting', icon: 'TrendingUp' }
          ]
          const { data: seededCategories } = await supabase.from('categories').insert(defaultCategories).select('id, name')
          categoriesData = seededCategories || []
        }

        if (gamesData && gamesData.length > 0) {
          setGames(gamesData)
          setGame(gamesData[0].id)
        }
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData)
          setCategory(categoriesData[0].id)
        }
      } catch (err: any) {
        console.error('Error loading page requirements:', err)
        setError('Failed to load games or categories from database.')
      }
    }

    checkAuthAndLoadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to post listings.')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const parsedPrice = parseFloat(price)
      const parsedStock = parseInt(stock)

      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new Error('Price must be a valid positive number.')
      }
      if (isNaN(parsedStock) || parsedStock < 0) {
        throw new Error('Stock must be a non-negative integer.')
      }
      if (!game || !category) {
        throw new Error('Please select both a game and a category.')
      }

      const finalDescription = `[Delivery: ${delivery}] ${description}`

      // 1. Insert active listing
      const { data: listingData, error: insertError } = await supabase
        .from('listings')
        .insert({
          title,
          description: finalDescription,
          price: parsedPrice,
          stock: parsedStock,
          game_id: game,
          category_id: category,
          seller_id: user.id,
          status: 'active'
        })
        .select()

      if (insertError) throw insertError

      // 2. If auto delivery data is supplied, write it to listing_secrets securely
      if (autoDeliveryData.trim() && listingData && listingData.length > 0) {
        const { error: secretError } = await supabase
          .from('listing_secrets')
          .insert({
            listing_id: listingData[0].id,
            secret_data: autoDeliveryData.trim()
          })
        
        if (secretError) {
          console.error('Failed to save listing secret:', secretError)
          throw new Error(`Listing created, but failed to save secure auto-delivery credentials: ${secretError.message}`)
        }
      }

      router.push('/')
    } catch (err: any) {
      console.error('Insert error:', err)
      setError(err.message || 'Failed to create listing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deliveryTimeLabel = language === 'kz' ? 'Жеткізу уақыты' : language === 'en' ? 'Delivery Time' : 'Время доставки'
  const deliveryTimePlaceholder = language === 'kz' ? 'Мыс: Лездік, 15 минут, 1 сағат' : language === 'en' ? 'e.g. Instant, 15 Mins, 1 Hour' : 'Например: Моментально, 15 минут, 1 час'

  const authRequiredTitle = language === 'kz' ? 'Аутентификация қажет' : language === 'en' ? 'Authentication Required' : 'Требуется авторизация'
  const authRequiredDesc = language === 'kz' ? 'Сатуға хабарландыру жариялау үшін жүйеге кіруіңіз керек.' : language === 'en' ? 'You must be signed in to list game currency, accounts, or items for sale.' : 'Вы должны войти в аккаунт, чтобы выставить товар на продажу.'
  const signInSellerBtn = language === 'kz' ? 'Сатушы аккаунтына кіру' : language === 'en' ? 'Sign In to Seller Account' : 'Войти в аккаунт продавца'

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-zinc-500 text-xs">{t('common').loading}</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <Card className="bg-zinc-900/20 border-white/5 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-white">{authRequiredTitle}</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              {authRequiredDesc}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-1.5 h-10 text-xs cursor-pointer"
            >
              <LogIn className="h-4 w-4" /> {signInSellerBtn}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/')}
              className="w-full text-zinc-400 hover:text-white text-xs cursor-pointer"
            >
              {language === 'kz' ? 'Басты бетке қайту' : language === 'en' ? 'Back to Home' : 'Назад на главную'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition cursor-pointer">
        <ArrowLeft className="h-3.5 w-3.5" /> {language === 'kz' ? 'Артқа' : language === 'en' ? 'Back' : 'Назад'}
      </button>

      <Card className="bg-zinc-900/20 border-white/5 shadow-xl">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="text-xl font-bold text-white">{cl.title}</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            {cl.desc}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            
            {error && (
              <div className="p-3.5 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Game & Category Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="game" className="text-xs font-semibold text-zinc-300">{cl.gameLabel}</Label>
                <select
                  id="game"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="w-full bg-zinc-950/40 text-zinc-300 border border-white/5 px-3 py-2.5 rounded-md text-xs focus:border-primary/50 focus:outline-none"
                  required
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id} className="bg-zinc-900 text-zinc-300">
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-semibold text-zinc-300">{cl.categoryLabel}</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950/40 text-zinc-300 border border-white/5 px-3 py-2.5 rounded-md text-xs focus:border-primary/50 focus:outline-none"
                  required
                >
                  {categories.map((cat) => {
                    const localizedCatName = 
                      cat.name === 'Items' ? language === 'kz' ? 'Заттар' : language === 'en' ? 'Items' : 'Предметы' :
                      cat.name === 'Currency' ? 'Валюта' :
                      cat.name === 'Accounts' ? 'Аккаунты' :
                      cat.name === 'Boosting' ? 'Бустинг' : cat.name;
                    return (
                      <option key={cat.id} value={cat.id} className="bg-zinc-900 text-zinc-300">
                        {localizedCatName}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-semibold text-zinc-300">{cl.titleLabel}</Label>
              <Input
                id="title"
                placeholder={cl.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-zinc-950/40 border-white/5 text-xs focus-visible:ring-primary/50 text-zinc-200"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-xs font-semibold text-zinc-300">{cl.descriptionLabel}</Label>
              <textarea
                id="desc"
                placeholder={cl.descriptionPlaceholder}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-zinc-950/40 text-zinc-200 placeholder-zinc-500 border border-white/5 rounded-md p-3 text-xs focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            {/* Price & Stock & Delivery */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-semibold text-zinc-300">{cl.priceLabel}</Label>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="bg-zinc-950/40 border-white/5 text-xs focus-visible:ring-primary/50 text-zinc-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock" className="text-xs font-semibold text-zinc-300">{cl.stockLabel}</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  className="bg-zinc-950/40 border-white/5 text-xs focus-visible:ring-primary/50 text-zinc-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery" className="text-xs font-semibold text-zinc-300">{deliveryTimeLabel}</Label>
                <Input
                  id="delivery"
                  placeholder={deliveryTimePlaceholder}
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  required
                  className="bg-zinc-950/40 border-white/5 text-xs focus-visible:ring-primary/50 text-zinc-200"
                />
              </div>
            </div>

            {/* Auto-Delivery Data Panel (Playerok key feature) */}
            <div className="space-y-2 border-t border-white/5 pt-6">
              <Label htmlFor="secret" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Key className="h-4 w-4 text-primary" /> {cl.autoDeliveryLabel}
              </Label>
              <textarea
                id="secret"
                placeholder={cl.autoDeliveryPlaceholder}
                rows={2}
                value={autoDeliveryData}
                onChange={(e) => setAutoDeliveryData(e.target.value)}
                className="w-full bg-zinc-950/40 text-zinc-200 placeholder-zinc-500 border border-white/5 rounded-md p-3 text-xs focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <span className="text-[10px] text-zinc-500 block leading-normal">
                {cl.autoDeliveryDesc}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-3 text-xs text-zinc-400">
              <ShieldAlert className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
              <div className="leading-normal">
                <span className="font-semibold text-zinc-200">
                  {language === 'kz' ? 'Жеткізуді растау:' : language === 'en' ? 'Delivery verification:' : 'Подтверждение доставки:'}
                </span>{' '}
                {language === 'kz' 
                  ? 'Сатып алушы дау ашқан жағдайда жеткізуді растайтын дәлелдемелерді (скриншоттар, сауда журналдары) ұсынуға дайын болуыңыз керек. Asyk.kz адал сатушыларды қорғайды.' 
                  : language === 'en' 
                  ? 'You must be ready to provide proof of delivery (screenshots, trade logs) in case the buyer raises a dispute. Asyk.kz protects honest sellers.' 
                  : 'Вы должны быть готовы предоставить доказательства доставки (скриншоты, скриншоты обмена) в случае возникновения спора. Asyk.kz защищает честных продавцов.'}
              </div>
            </div>

          </CardContent>
          <CardFooter className="border-t border-white/5 p-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              {t('common').cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.2)] text-xs h-10 px-6 cursor-pointer"
            >
              {loading ? cl.submitting : cl.submitBtn}
            </Button>
          </CardFooter>
        </form>
      </Card>

    </div>
  )
}
