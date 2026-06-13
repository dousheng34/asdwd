'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Gamepad2, Coins, Sword, ShieldAlert, ArrowLeft, Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'

export default function CreateListingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [games, setGames] = useState<{ id: string, name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [game, setGame] = useState('')
  const [category, setCategory] = useState('')
  const [delivery, setDelivery] = useState('Instant') // Saved in description or UI-only if not in schema
  
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

        // Auto-seed games if database tables are empty (first run fallback)
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

      // Format description to include delivery details if they differ from description
      const finalDescription = `[Delivery: ${delivery}] ${description}`

      const { data, error: insertError } = await supabase
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

      router.push('/')
    } catch (err: any) {
      console.error('Insert error:', err)
      setError(err.message || 'Failed to create listing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-zinc-500 text-xs">Checking authorization...</span>
      </div>
    )
  }

  // Not logged in fallback screen
  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <Card className="bg-zinc-900/20 border-white/5 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-white">Authentication Required</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              You must be signed in to list game currency, accounts, or items for sale.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-1.5 h-10 text-xs"
            >
              <LogIn className="h-4 w-4" /> Sign In to Seller Account
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/')}
              className="w-full text-zinc-400 hover:text-white text-xs"
            >
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <Card className="bg-zinc-900/20 border-white/5 shadow-xl">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="text-xl font-bold text-white">List Your Gaming Value</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Publish an offer to sell in-game currency, items, skins, or accounts.
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
                <Label htmlFor="game" className="text-xs font-semibold text-zinc-300">Select Game</Label>
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
                <Label htmlFor="category" className="text-xs font-semibold text-zinc-300">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950/40 text-zinc-300 border border-white/5 px-3 py-2.5 rounded-md text-xs focus:border-primary/50 focus:outline-none"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-zinc-900 text-zinc-300">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-semibold text-zinc-300">Listing Title</Label>
              <Input
                id="title"
                placeholder="e.g. 50,000 Gold Alliance firemaw"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-zinc-950/40 border-white/5 text-xs focus-visible:ring-primary/50 text-zinc-200"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-xs font-semibold text-zinc-300">Description</Label>
              <textarea
                id="desc"
                placeholder="Specify delivery details, stock availability, character specifications..."
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
                <Label htmlFor="price" className="text-xs font-semibold text-zinc-300">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="bg-zinc-950/40 border-white/5 text-xs focus-visible:ring-primary/50 text-zinc-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock" className="text-xs font-semibold text-zinc-300">Quantity / Stock</Label>
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
                <Label htmlFor="delivery" className="text-xs font-semibold text-zinc-300">Delivery Time</Label>
                <Input
                  id="delivery"
                  placeholder="e.g. Instant, 15 Mins, 1 Hour"
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  required
                  className="bg-zinc-950/40 border-white/5 text-xs focus-visible:ring-primary/50 text-zinc-200"
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-3 text-xs text-zinc-400">
              <ShieldAlert className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
              <div className="leading-normal">
                <span className="font-semibold text-zinc-200">Delivery verification:</span> You must be ready to provide proof of delivery (screenshots, trade logs) in case the buyer raises a dispute. SolarLoot protects honest sellers.
              </div>
            </div>

          </CardContent>
          <CardFooter className="border-t border-white/5 p-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_15px_rgba(255,87,34,0.2)] text-xs h-10 px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Publishing...
                </>
              ) : (
                'Publish Offer'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

    </div>
  )
}
