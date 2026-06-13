'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { 
  ShieldCheck, 
  MessageSquare, 
  Coins, 
  Clock, 
  User, 
  Star, 
  Check, 
  ArrowLeft, 
  Send 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import PaymentUploadForm from '@/components/PaymentUploadForm'

const MOCK_LISTINGS = {
  'l1': {
    title: 'M9 Bayonet | Fade (FN 98% Fade)',
    game: 'Counter-Strike 2',
    category: 'Items',
    price: 1420.00,
    seller: 'AetherSkins',
    seller_id: 'd1b07384-d113-4ec6-a558-713069b1836c', // UUID
    seller_telegram_id: 111111111, // BIGINT
    sellerRating: 4.9,
    sellerSales: 482,
    deliveryTime: 'Instant',
    desc: 'Extremely clean factory new M9 Bayonet. Fade percentage is verified at 98.2%. Float value is 0.0102. Fully ready to transfer to your Steam account. We will transfer it instantly via Steam Trade Offer as soon as you confirm payment on SolarLoot.',
    specs: [
      { label: 'Float Value', value: '0.0102' },
      { label: 'Fade %', value: '98.2%' },
      { label: 'Tradable', value: 'Yes, Instantly' }
    ]
  },
  'l2': {
    title: '100,000 Gold (US-Sargeras Alliance)',
    game: 'World of Warcraft',
    category: 'Currency',
    price: 85.00,
    seller: 'WowGoldDealer',
    seller_id: 'd2b07384-d113-4ec6-a558-713069b1836c', // UUID
    seller_telegram_id: 222222222, // BIGINT
    sellerRating: 4.8,
    sellerSales: 2153,
    deliveryTime: '10 mins',
    desc: 'Pure WoW gold farmed legitimately. Available for Alliance side on US-Sargeras realm. Delivery methods include face-to-face trade in Stormwind, ingame mail, or guild bank deposit. Please state your character name and preferred method of delivery in checkout chat.',
    specs: [
      { label: 'Faction', value: 'Alliance' },
      { label: 'Region', value: 'US' },
      { label: 'Realm', value: 'Sargeras' }
    ]
  },
  'l3': {
    title: 'Immortal 3 Account (All Agents, 12 Skins)',
    game: 'Valorant',
    category: 'Accounts',
    price: 240.00,
    seller: 'SmurfStore',
    seller_id: 'd3b07384-d113-4ec6-a558-713069b1836c', // UUID
    seller_telegram_id: 333333333, // BIGINT
    sellerRating: 4.7,
    sellerSales: 129,
    deliveryTime: 'Instant',
    desc: 'Unverified email account, completely safe and eligible for full email changing. Current rank is Immortal 3, peak rank Radiant. Includes popular skins: Reaver Vandal, Prime Vandal, Ion Phantom, and Sovereign Sword. Full lifetime recovery warranty.',
    specs: [
      { label: 'Current Rank', value: 'Immortal 3' },
      { label: 'Peak Rank', value: 'Radiant' },
      { label: 'Skins Count', value: '12 premium' }
    ]
  },
  'l4': {
    title: '1-1000 MMR Rank Boost (Solo/Duo)',
    game: 'Dota 2',
    category: 'Boosting',
    price: 75.00,
    seller: 'DotabuffPro',
    seller_id: 'd4b07384-d113-4ec6-a558-713069b1836c', // UUID
    seller_telegram_id: 444444444, // BIGINT
    sellerRating: 5.0,
    sellerSales: 87,
    deliveryTime: '24 hours',
    desc: 'Professional MMR boosting service by a 9.5k MMR top-100 player. Done via VPN for maximum safety of your Steam account. We will gain 1000 MMR on your account in less than 24 hours. Alternatively, we can play Duo queue (+20% price adjustment).',
    specs: [
      { label: 'MMR range', value: '1 to 1000 MMR' },
      { label: 'Booster Rank', value: 'Top 100 Radiant' },
      { label: 'Play Method', value: 'Solo (Acc share) or Duo' }
    ]
  }
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id as keyof typeof MOCK_LISTINGS
  const listing = MOCK_LISTINGS[id] || MOCK_LISTINGS['l1'] // Fallback if id not found
  
  const [messages, setMessages] = useState([
    { sender: listing.seller, content: 'Hey! Let me know if you have any questions about this offer.', time: '10 mins ago' }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setMessages([...messages, { sender: 'You', content: newMessage, time: 'Just now' }])
    setNewMessage('')
  }

  const handlePurchase = async () => {
    setPurchasing(true)
    setError(null)
    try {
      const supabase = createClient()
      
      // Perform database insert into the orders table
      // Storing listing_id, seller_id, seller_telegram_id, buyer_id, amount and initial status
      const { data, error: insertError } = await supabase
        .from('orders')
        .insert({
          listing_id: id,
          seller_id: listing.seller_id,
          seller_telegram_id: listing.seller_telegram_id, // BIGINT column
          buyer_id: 'd5b07384-d113-4ec6-a558-713069b1836d', // Mock buyer UUID
          amount: listing.price,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError

      setCreatedOrderId(data.id)
      setPurchaseSuccess(true)
    } catch (err: any) {
      console.error('Purchase initialization error:', err)
      setError(err.message || 'Failed to initialize deal in database.')
    } finally {
      setPurchasing(false)
    }
  }

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
                {listing.game}
              </span>
              <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
                {listing.category}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              {listing.title}
            </h1>
            
            {/* Seller Info Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 border-b border-white/5 pb-4">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 text-zinc-500" />
                <span className="font-semibold text-white">{listing.seller}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="text-white font-semibold">{listing.sellerRating}</span>
              </div>
              <div className="text-zinc-600">•</div>
              <div>{listing.sellerSales} completed sales</div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Item Description</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light">
              {listing.desc}
            </p>
          </div>

          {/* Specs Grid */}
          <div className="p-6 rounded-xl bg-zinc-900/10 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Offer Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {listing.specs.map((spec, i) => (
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
              <span className="text-[10px] text-zinc-500">Usually replies in {listing.deliveryTime}</span>
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
                    <Clock className="h-3 w-3 text-primary" /> {listing.deliveryTime}
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

              {purchaseSuccess && createdOrderId ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-1.5">
                    <div className="font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Deal Initialized!
                    </div>
                    <p className="text-[11px] text-emerald-500/80 leading-snug">
                      Your order #{createdOrderId.substring(0, 8)} is pending. Please upload payment receipt to lock the funds.
                    </p>
                  </div>
                  
                  {/* Payment Receipt Upload Form */}
                  <PaymentUploadForm orderId={createdOrderId} />
                </div>
              ) : (
                <Button 
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_15px_rgba(255,87,34,0.2)] h-11 text-xs"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                      Creating Order...
                    </>
                  ) : (
                    'Buy Now'
                  )}
                </Button>
              )}
            </CardContent>
            <CardFooter className="p-6 pt-0 text-[10px] text-zinc-500 text-center flex flex-col gap-2 border-t border-white/5 pt-4">
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

// Extra loaders import to support Spinner
import { Loader2 } from 'lucide-react'
