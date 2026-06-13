'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Coins, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  ShieldCheck,
  Loader2,
  Gamepad,
  LogIn
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeListings, setActiveListings] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  
  // Balance Actions State
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | null>(null)
  const [actionAmount, setActionAmount] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Delivery Confirm State
  const [confirmLoadingId, setConfirmLoadingId] = useState<string | null>(null)
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<string | null>(null)

  const loadProfileData = async () => {
    setLoading(true)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        setUser(null)
        setAuthLoading(false)
        setLoading(false)
        return
      }

      setUser(currentUser)
      setAuthLoading(false)

      // 1. Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      setProfile(profileData)

      // 2. Fetch active listings
      const { data: listingsData } = await supabase
        .from('listings')
        .select('*, game:games(*), category:categories(*)')
        .eq('seller_id', currentUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      setActiveListings(listingsData || [])

      // 3. Fetch purchases
      const { data: purchasesData } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          status,
          created_at,
          listing:listings(
            id,
            title,
            game:games(name, slug),
            category:categories(name, slug)
          ),
          seller:profiles(id, username)
        `)
        .eq('buyer_id', currentUser.id)
        .order('created_at', { ascending: false })

      setPurchases(purchasesData || [])

      // 4. Fetch sales
      const { data: salesData } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          status,
          created_at,
          listing:listings(
            id,
            title,
            game:games(name, slug),
            category:categories(name, slug)
          ),
          buyer:profiles(id, username)
        `)
        .eq('seller_id', currentUser.id)
        .order('created_at', { ascending: false })

      setSales(salesData || [])

    } catch (err) {
      console.error('Error loading profile page data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [])

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    const amount = parseFloat(actionAmount)
    if (isNaN(amount) || amount <= 0) {
      setActionError('Please enter a valid positive amount.')
      return
    }

    setActionLoading(true)
    setActionError(null)

    try {
      let currentBalance = parseFloat(profile.balance || 0)
      if (activeAction === 'deposit') {
        currentBalance += amount
      } else {
        if (amount > currentBalance) {
          throw new Error('Insufficient balance to withdraw.')
        }
        currentBalance -= amount
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ balance: currentBalance })
        .eq('id', user.id)

      if (updateErr) throw updateErr

      setProfile({ ...profile, balance: currentBalance })
      setActiveAction(null)
      setActionAmount('')
    } catch (err: any) {
      console.error('Balance update error:', err)
      setActionError(err.message || 'Failed to update balance.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmDelivery = async (txId: string, sellerId: string, amount: number) => {
    setConfirmLoadingId(txId)
    setConfirmSuccessMsg(null)
    try {
      // 1. Update transaction status to 'completed'
      const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', txId)

      if (txError) throw txError

      // 2. Fetch current seller balance and sales count
      const { data: sellerProfile, error: sellerError } = await supabase
        .from('profiles')
        .select('balance, sales_count')
        .eq('id', sellerId)
        .single()

      if (sellerError) throw sellerError

      // 3. Update seller's balance and sales count in database
      const currentSellerBalance = parseFloat(sellerProfile.balance || 0)
      const currentSellerSalesCount = parseInt(sellerProfile.sales_count || 0)

      const { error: finalError } = await supabase
        .from('profiles')
        .update({
          balance: currentSellerBalance + amount,
          sales_count: currentSellerSalesCount + 1
        })
        .eq('id', sellerId)

      if (finalError) throw finalError

      setConfirmSuccessMsg(`Success! Funds of $${amount.toFixed(2)} have been released from escrow to the seller.`)
      
      // Reload profile dashboard data
      await loadProfileData()
    } catch (err: any) {
      console.error('Delivery confirmation error:', err)
      alert(err.message || 'An error occurred during delivery confirmation.')
    } finally {
      setConfirmLoadingId(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-zinc-500 text-xs">Checking user session...</span>
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
              <User className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-white">Access Denied</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Please sign in to view your dashboard, check order status, or manage your balance.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-1.5 h-10 text-xs"
            >
              <LogIn className="h-4 w-4" /> Sign In
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/')}
              className="w-full text-zinc-400 hover:text-white text-xs"
            >
              Back to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Header/Profile Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-zinc-900/10 border border-white/5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold uppercase shadow-[0_0_15px_rgba(255,87,34,0.15)]">
            {profile?.username ? profile.username.substring(0, 2) : 'SL'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {profile?.username || user.email?.split('@')[0]}
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/5 text-[9px] text-zinc-400 font-mono">
                Verified Member
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Registered: {new Date(profile?.created_at || user.created_at).toLocaleDateString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5 text-xs text-zinc-300">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="font-semibold text-white">{profile?.rating?.toFixed(2) || '5.00'}</span>
              </div>
              <span className="text-zinc-600 text-[10px]">•</span>
              <span className="text-xs text-zinc-500">{profile?.sales_count || 0} completed sales</span>
            </div>
          </div>
        </div>

        {/* Balance & Quick Actions */}
        <div className="flex flex-col items-stretch md:items-end justify-center gap-4 bg-zinc-900/40 border border-white/5 p-4 rounded-xl shrink-0 w-full sm:w-[280px]">
          <div className="flex justify-between md:justify-end md:gap-4 items-center w-full">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Available Balance</span>
            <div className="text-xl sm:text-2xl font-black text-primary font-mono mt-0.5">
              ${parseFloat(profile?.balance || 0).toFixed(2)}
            </div>
          </div>
          
          <div className="flex gap-2 w-full">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setActiveAction(activeAction === 'deposit' ? null : 'deposit')}
              className="flex-1 h-8 text-[10px] border-white/10 hover:border-white/20 text-zinc-300 gap-1"
            >
              <ArrowDownLeft className="h-3 w-3 text-emerald-400" /> Deposit
            </Button>
            <Button 
              size="sm" 
              onClick={() => setActiveAction(activeAction === 'withdraw' ? null : 'withdraw')}
              className="flex-1 h-8 text-[10px] bg-primary hover:bg-primary/95 text-white gap-1 shadow-[0_0_10px_rgba(255,87,34,0.15)]"
            >
              <ArrowUpRight className="h-3 w-3" /> Withdraw
            </Button>
          </div>

          {/* Action Input Panel (Deposit/Withdraw) */}
          {activeAction && (
            <form onSubmit={handleBalanceSubmit} className="w-full border-t border-white/5 pt-3 mt-1 space-y-2">
              {actionError && (
                <div className="text-[9px] text-red-400 bg-red-500/5 p-1 rounded border border-red-500/10">
                  {actionError}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder={activeAction === 'deposit' ? 'Deposit amount' : 'Withdraw amount'}
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  required
                  className="bg-zinc-950/40 border-white/5 h-8 text-[10px] text-zinc-200"
                />
                <Button 
                  type="submit" 
                  disabled={actionLoading}
                  className="h-8 text-[9px] bg-zinc-800 hover:bg-primary text-white"
                >
                  {actionLoading ? 'Updating...' : 'Submit'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Success Banner */}
      {confirmSuccessMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{confirmSuccessMsg}</span>
        </div>
      )}

      {/* 2. Dashboard Tabs */}
      <Tabs defaultValue="listings" className="w-full space-y-6">
        <TabsList className="bg-zinc-900/40 border border-white/5 p-1 rounded-lg">
          <TabsTrigger value="listings" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            My Offers ({activeListings.length})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            Purchases ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            Sales & Escrow ({sales.length})
          </TabsTrigger>
        </TabsList>

        {/* A. My Listings Tab */}
        <TabsContent value="listings" className="space-y-4">
          <Card className="bg-zinc-900/10 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
              <div>
                <CardTitle className="text-sm font-semibold text-white">Your Active Marketplace Offers</CardTitle>
                <CardDescription className="text-[11px] text-zinc-500">Items and services you are currently selling.</CardDescription>
              </div>
              <Link href="/listings/create">
                <Button size="sm" className="h-8 text-[10px] bg-zinc-800 hover:bg-primary text-white border border-white/5">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add New
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  Loading active listings...
                </div>
              ) : activeListings.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {activeListings.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-zinc-900/20 transition text-xs">
                      <div className="space-y-1">
                        <Link href={`/listings/${item.id}`} className="font-semibold text-zinc-200 hover:text-primary transition-colors">
                          {item.title}
                        </Link>
                        <div className="text-[10px] text-zinc-500">{item.game?.name} • {item.category?.name}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="font-semibold text-primary font-mono">${parseFloat(item.price).toFixed(2)}</div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No active listings found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* B. Purchases Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <Card className="bg-zinc-900/10 border-white/5">
            <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="text-sm font-semibold text-white">Purchase History</CardTitle>
              <CardDescription className="text-[11px] text-zinc-500">Monitor items you purchased and active escrow state.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  Loading purchase records...
                </div>
              ) : purchases.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-900/20 transition gap-4 text-xs">
                      <div className="space-y-1">
                        <Link href={`/orders/${purchase.id}`} className="font-semibold text-zinc-200 hover:text-primary transition-colors">
                          {purchase.listing?.title || 'Unknown Gaming Value Offer'}
                        </Link>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span>{purchase.listing?.game?.name}</span>
                          <span>•</span>
                          <span>Seller: {purchase.seller?.username || 'gamer_store'}</span>
                          <span>•</span>
                          <span>{new Date(purchase.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="font-semibold text-zinc-100 font-mono">${parseFloat(purchase.amount).toFixed(2)}</div>
                        
                        {/* Transaction Status Flow */}
                        {purchase.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[9px] text-zinc-400">
                            Pending Payment
                          </span>
                        )}

                        {purchase.status === 'escrow' && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 animate-pulse" /> In Escrow
                            </span>
                            <Button 
                              size="sm" 
                              onClick={() => handleConfirmDelivery(purchase.id, purchase.seller?.id, parseFloat(purchase.amount))}
                              disabled={confirmLoadingId === purchase.id}
                              className="h-7 text-[9px] bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-1"
                            >
                              {confirmLoadingId === purchase.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Confirm Delivery'
                              )}
                            </Button>
                          </div>
                        )}

                        {purchase.status === 'disputed' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5" /> Disputed
                          </span>
                        )}

                        {purchase.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[9px] text-zinc-400 flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> Completed
                          </span>
                        )}

                        {purchase.status === 'canceled' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] text-red-500">
                            Canceled / Refunded
                          </span>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No purchases found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* C. Sales & Escrow Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card className="bg-zinc-900/10 border-white/5">
            <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="text-sm font-semibold text-white">Incoming Sales & Escrows</CardTitle>
              <CardDescription className="text-[11px] text-zinc-500">Deliver items to buyers to release funds from escrow.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  Loading sales records...
                </div>
              ) : sales.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {sales.map((sale) => (
                    <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-900/20 transition gap-4 text-xs">
                      <div className="space-y-1">
                        <Link href={`/orders/${sale.id}`} className="font-semibold text-zinc-200 hover:text-primary transition-colors">
                          {sale.listing?.title || 'Unknown Gaming Value Offer'}
                        </Link>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span>{sale.listing?.game?.name}</span>
                          <span>•</span>
                          <span>Buyer: {sale.buyer?.username || 'gamer_store'}</span>
                          <span>•</span>
                          <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="font-semibold text-primary font-mono">${parseFloat(sale.amount).toFixed(2)}</div>
                        
                        {sale.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[9px] text-zinc-400">
                            Waiting for Payment Receipt
                          </span>
                        )}

                        {sale.status === 'escrow' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5 animate-pulse" /> Escrow Locked: Deliver Item
                          </span>
                        )}

                        {sale.status === 'disputed' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5" /> Disputed
                          </span>
                        )}

                        {sale.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[9px] text-zinc-400 flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> Escrow Released (Paid)
                          </span>
                        )}

                        {sale.status === 'canceled' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] text-red-500">
                            Canceled / Refunded
                          </span>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No active incoming sales waiting for delivery.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}
