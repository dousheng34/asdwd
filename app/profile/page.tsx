'use client'

import { useState } from 'react'
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
  ShieldCheck 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProfilePage() {
  const [balance, setBalance] = useState(250.00)
  
  const myActiveListings = [
    { id: '1', title: '50,000 WoW Gold (Alliance)', price: 42.50, game: 'World of Warcraft', status: 'Active' },
    { id: '2', title: 'Valorant Placement Boost (5 matches)', price: 35.00, game: 'Valorant', status: 'Active' }
  ]

  const myPurchases = [
    { id: 'p1', title: 'M9 Bayonet | Fade (FN)', price: 1420.00, game: 'Counter-Strike 2', seller: 'AetherSkins', status: 'Completed', date: '2026-06-12' },
    { id: 'p2', title: 'Immortal 3 Account (Valorant)', price: 240.00, game: 'Valorant', seller: 'SmurfStore', status: 'Escrow', date: '2026-06-14' }
  ]

  const mySales = [
    { id: 's1', title: 'Rank Boost (1-1000 MMR)', price: 75.00, game: 'Dota 2', buyer: 'NoobPlayer99', status: 'Waiting for Delivery', date: '2026-06-14' }
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Header/Profile Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-zinc-900/10 border border-white/5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold uppercase shadow-[0_0_15px_rgba(255,87,34,0.15)]">
            SL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">SolarGamer</h1>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/5 text-[9px] text-zinc-400 font-mono">
                Verified Seller
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Member since June 2026</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5 text-xs text-zinc-300">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="font-semibold text-white">4.95</span>
              </div>
              <span className="text-zinc-600 text-[10px]">•</span>
              <span className="text-xs text-zinc-500">42 completed orders</span>
            </div>
          </div>
        </div>

        {/* Balance & Quick Actions */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 bg-zinc-900/40 border border-white/5 p-4 rounded-xl shrink-0">
          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Available Balance</span>
            <div className="text-xl sm:text-2xl font-black text-primary font-mono mt-0.5">${balance.toFixed(2)}</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-[10px] border-white/10 hover:border-white/20 text-zinc-300 gap-1">
              <ArrowDownLeft className="h-3 w-3 text-emerald-400" /> Deposit
            </Button>
            <Button size="sm" className="h-8 text-[10px] bg-primary hover:bg-primary/95 text-white gap-1 shadow-[0_0_10px_rgba(255,87,34,0.15)]">
              <ArrowUpRight className="h-3 w-3" /> Withdraw
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Dashboard Tabs */}
      <Tabs defaultValue="listings" className="w-full space-y-6">
        <TabsList className="bg-zinc-900/40 border border-white/5 p-1 rounded-lg">
          <TabsTrigger value="listings" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            My Offers ({myActiveListings.length})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            Purchases ({myPurchases.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            Sales & Escrow ({mySales.length})
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
              <Button size="sm" className="h-8 text-[10px] bg-zinc-800 hover:bg-primary text-white border border-white/5">
                <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add New
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {myActiveListings.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 hover:bg-zinc-900/20 transition text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-zinc-200">{item.title}</div>
                      <div className="text-[10px] text-zinc-500">{item.game}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="font-semibold text-primary font-mono">${item.price.toFixed(2)}</div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="divide-y divide-white/5">
                {myPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-900/20 transition gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-zinc-200">{purchase.title}</div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                        <span>{purchase.game}</span>
                        <span>•</span>
                        <span>Seller: {purchase.seller}</span>
                        <span>•</span>
                        <span>{purchase.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="font-semibold text-zinc-100 font-mono">${purchase.price.toFixed(2)}</div>
                      {purchase.status === 'Escrow' ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> In Escrow
                          </span>
                          <Button size="sm" className="h-7 text-[9px] bg-primary hover:bg-primary/90 text-white font-semibold">
                            Confirm Delivery
                          </Button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[9px] text-zinc-400 flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> {purchase.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
              {mySales.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {mySales.map((sale) => (
                    <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-900/20 transition gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="font-semibold text-zinc-200">{sale.title}</div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span>{sale.game}</span>
                          <span>•</span>
                          <span>Buyer: {sale.buyer}</span>
                          <span>•</span>
                          <span>{sale.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="font-semibold text-primary font-mono">${sale.price.toFixed(2)}</div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5" /> Action Required
                          </span>
                          <Button size="sm" className="h-7 text-[9px] bg-zinc-800 hover:bg-primary text-white border border-white/5 font-semibold">
                            Confirm Delivery Sent
                          </Button>
                        </div>
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
