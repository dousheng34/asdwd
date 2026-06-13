'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gamepad2, Coins, Sword, ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const GAMES = [
  { name: 'Counter-Strike 2', id: 'cs2' },
  { name: 'Dota 2', id: 'dota2' },
  { name: 'World of Warcraft', id: 'wow' },
  { name: 'Valorant', id: 'valorant' }
]

const CATEGORIES = [
  { name: 'Items', id: 'items', icon: Sword },
  { name: 'Currency', id: 'currency', icon: Coins }
]

export default function CreateListingPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [game, setGame] = useState(GAMES[0].id)
  const [category, setCategory] = useState(CATEGORIES[0].id)
  const [delivery, setDelivery] = useState('Instant')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate Supabase insert listing
    setTimeout(() => {
      setLoading(false)
      // Redirect to homepage or profile
      router.push('/')
    }, 1200)
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
            
            {/* Game & Category Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="game" className="text-xs font-semibold text-zinc-300">Select Game</Label>
                <select
                  id="game"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="w-full bg-zinc-950/40 text-zinc-300 border border-white/5 px-3 py-2 rounded-md text-xs focus:border-primary/50 focus:outline-none"
                >
                  {GAMES.map((g) => (
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
                  className="w-full bg-zinc-950/40 text-zinc-300 border border-white/5 px-3 py-2 rounded-md text-xs focus:border-primary/50 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
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
              {loading ? 'Publishing...' : 'Publish Offer'}
            </Button>
          </CardFooter>
        </form>
      </Card>

    </div>
  )
}
