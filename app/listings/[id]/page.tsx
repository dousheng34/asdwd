'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ShieldCheck, 
  MessageSquare, 
  Clock, 
  User, 
  Star, 
  Check, 
  ArrowLeft, 
  Send,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const supabase = createClient()

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadListingAndUser() {
      setLoading(true)
      setError(null)
      try {
        // 1. Get user session
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)

        // 2. Fetch listing by UUID
        const { data: listingData, error: listingError } = await supabase
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
          .eq('id', id)
          .single()

        if (listingError) throw listingError
        setListing(listingData)

        // Extract delivery time from description format: [Delivery: XXX]
        const deliveryMatch = listingData?.description?.match(/^\[Delivery: ([^\]]+)\]/)
        const deliveryVal = deliveryMatch ? deliveryMatch[1] : 'Instant'

        setMessages([
          { 
            sender: listingData?.seller?.username || 'Seller', 
            content: `Hey! Let me know if you have any questions about this offer. Delivery is estimated at ${deliveryVal}.`, 
            time: 'Just now' 
          }
        ])
      } catch (err: any) {
        console.error('Error loading listing details:', err)
        setError('Listing not found or connection to database failed.')
      } finally {
        setLoading(false)
      }
    }

    loadListingAndUser()
  }, [id])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setMessages([...messages, { sender: 'You', content: newMessage, time: 'Just now' }])
    setNewMessage('')
  }

  const handlePurchase = async () => {
    if (!user) {
      setError('You must be logged in to buy items. Please sign in.')
      return
    }

    if (user.id === listing?.seller?.id) {
      setError('You cannot buy your own listing!')
      return
    }

    setPurchasing(true)
    setError(null)
    try {
      // Create escrow transaction in Supabase
      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller.id,
          amount: listing.price,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Redirect directly to the dedicated order page, like Playerok
      router.push(`/orders/${data.id}`)
    } catch (err: any) {
      console.error('Purchase initialization error:', err)
      setError(err.message || 'Failed to initialize transaction in database.')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-zinc-500 text-xs">Loading listing details...</span>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-zinc-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Offer Not Found</h2>
        <p className="text-xs text-zinc-500">{error}</p>
        <Link href="/">
          <Button size="sm" variant="outline" className="border-white/10 hover:border-white/20 text-xs text-zinc-300">
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  // Parse delivery time and description
  const deliveryMatch = listing.description?.match(/^\[Delivery: ([^\]]+)\]/)
  const deliveryTime = deliveryMatch ? deliveryMatch[1] : 'Instant'
  const cleanDescription = listing.description?.replace(/^\[Delivery: [^\]]+\]\s*/, '') || ''

  // Generate dynamic specs for nice visuals
  const specs = [
    { label: 'Delivery Method', value: 'P2P / Escrow' },
    { label: 'Quantity Available', value: `${listing.stock} units` },
    { label: 'Security', value: '100% Protected' }
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back to Home Link */}
      <Link href="/" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5 text-zinc-400 text-[10px] font-mono">
                {listing.game?.name}
              </span>
              <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
                {listing.category?.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              {listing.title}
            </h1>
            
            {/* Seller Info Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 border-b border-white/5 pb-4">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 text-zinc-500" />
                <span className="font-semibold text-white">{listing.seller?.username || 'gamer_store'}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="text-white font-semibold">{listing.seller?.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <div className="text-zinc-600">•</div>
              <div>{listing.seller?.sales_count || '0'} completed sales</div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Item Description</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light whitespace-pre-line">
              {cleanDescription || 'No description provided.'}
            </p>
          </div>

          {/* Specs Grid */}
          <div className="p-6 rounded-xl bg-zinc-900/10 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Offer Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {specs.map((spec, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-[10px] text-zinc-500">{spec.label}</div>
                  <div className="text-xs font-semibold text-zinc-200">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Messaging Chat */}
          <div className="rounded-xl border border-white/5 overflow-hidden bg-zinc-900/10 flex flex-col h-[320px]">
            <div className="bg-zinc-900/40 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-zinc-300">Pre-Purchase Chat with Seller</span>
              </div>
              <span className="text-[10px] text-zinc-500">Usually replies in {deliveryTime}</span>
            </div>
            
            <div className="p-4 flex-grow overflow-y-auto space-y-4 text-xs">
              {messages.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-xl max-w-[80%] ${
                    msg.sender === 'You' 
                      ? 'bg-primary/10 border border-primary/20 text-white rounded-br-none' 
                      : 'bg-zinc-800/40 border border-white/5 text-zinc-200 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-zinc-500 mt-1">{msg.time}</span>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 flex gap-2">
              <Input
                placeholder="Ask about availability, delivery speed..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-zinc-950/40 border-white/5 text-xs h-9 focus-visible:ring-primary/50 text-zinc-200"
              />
              <Button type="submit" size="sm" className="h-9 px-3 bg-zinc-800 hover:bg-primary text-white">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>

        </div>

        {/* Right Column: Checkout Card */}
        <div className="space-y-6">
          <Card className="bg-zinc-900/20 border-white/5 shadow-xl sticky top-20">
            <CardHeader className="p-6">
              <CardDescription className="text-xs text-zinc-500 uppercase tracking-wider">Total price</CardDescription>
              <CardTitle className="text-3xl font-black text-primary font-mono mt-1">
                ${listing.price.toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              
              <div className="space-y-3 text-xs border-y border-white/5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Delivery Method</span>
                  <span className="text-zinc-200 font-medium">In-Game / P2P</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Expected Delivery</span>
                  <span className="text-zinc-200 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" /> {deliveryTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Escrow Security</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Verified Secure
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
                  {error}
                </div>
              )}

              <Button 
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_15px_rgba(255,87,34,0.2)] h-11 text-xs animate-shimmer"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                    Creating Order...
                  </>
                ) : (
                  'Buy Now — Escrow Protected'
                )}
              </Button>
            </CardContent>
            <CardFooter className="p-6 pt-4 text-[10px] text-zinc-500 text-center flex flex-col gap-2 border-t border-white/5">
              <span className="flex items-center gap-1 justify-center text-zinc-400">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> SolarLoot Trade Protection
              </span>
              <span>
                Money is held in our escrow and is only released after you confirm you have received the item.
              </span>
            </CardFooter>
          </Card>
        </div>

      </div>

    </div>
  )
}
