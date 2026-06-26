'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2,
  LogIn
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { language, t } = useTranslation()
  const pt = t('profile')
  const ot = t('order')
  
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

      setConfirmSuccessMsg(
        language === 'kz'
          ? `Сәтті! ${amount.toFixed(0)} ₸ қаражат эскроудан сатушының балансына аударылды.`
          : language === 'en'
          ? `Success! Funds of ${amount.toFixed(0)} ₸ have been released from escrow to the seller.`
          : `Успешно! Средства в размере ${amount.toFixed(0)} ₸ разблокированы из эскроу и зачислены продавцу.`
      )
      
      await loadProfileData()
    } catch (err: any) {
      console.error('Delivery confirmation error:', err)
      alert(err.message || 'An error occurred during delivery confirmation.')
    } finally {
      setConfirmLoadingId(null)
    }
  }

  const accessDeniedTitle = language === 'kz' ? 'Рұқсат берілмеді' : language === 'en' ? 'Access Denied' : 'Доступ запрещен'
  const accessDeniedDesc = language === 'kz' ? 'Кабинетті көру немесе теңгерімді басқару үшін жүйеге кіріңіз.' : language === 'en' ? 'Please sign in to view your dashboard, check order status, or manage your balance.' : 'Пожалуйста, войдите в аккаунт, чтобы просмотреть кабинет или управлять балансом.'
  const backToHome = language === 'kz' ? 'Басты бетке' : language === 'en' ? 'Back to Homepage' : 'Назад на главную'

  const verifiedMerchantLabel = language === 'kz' ? 'Сенімді саудагер' : language === 'en' ? 'Verified Member' : 'Проверенный мерчант'
  const registeredLabel = language === 'kz' ? 'Тіркелген күні' : language === 'en' ? 'Registered' : 'Регистрация'
  const completedSalesLabel = language === 'kz' ? 'аяқталған мәмілелер' : language === 'en' ? 'completed sales' : 'завершенных продаж'

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
              <User className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-white">{accessDeniedTitle}</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              {accessDeniedDesc}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-1.5 h-10 text-xs cursor-pointer"
            >
              <LogIn className="h-4 w-4" /> {t('navbar').signIn}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/')}
              className="w-full text-zinc-400 hover:text-white text-xs cursor-pointer"
            >
              {backToHome}
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
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold uppercase shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            {profile?.username ? profile.username.substring(0, 2) : 'AK'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {profile?.username || user.email?.split('@')[0]}
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/5 text-[9px] text-zinc-400 font-mono">
                {verifiedMerchantLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{registeredLabel}: {new Date(profile?.created_at || user.created_at).toLocaleDateString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5 text-xs text-zinc-300">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="font-semibold text-white">{profile?.rating?.toFixed(2) || '5.00'}</span>
              </div>
              <span className="text-zinc-600 text-[10px]">•</span>
              <span className="text-xs text-zinc-500">{profile?.sales_count || 0} {completedSalesLabel}</span>
            </div>
          </div>
        </div>

        {/* Balance & Quick Actions */}
        <div className="flex flex-col items-stretch md:items-end justify-center gap-4 bg-zinc-900/40 border border-white/5 p-4 rounded-xl shrink-0 w-full sm:w-[280px]">
          <div className="flex justify-between md:justify-end md:gap-4 items-center w-full">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{pt.balanceLabel}</span>
            <div className="text-xl sm:text-2xl font-black text-primary font-mono mt-0.5">
              {parseFloat(profile?.balance || 0).toFixed(0)} ₸
            </div>
          </div>
          
          <div className="flex gap-2 w-full">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setActiveAction(activeAction === 'deposit' ? null : 'deposit')}
              className="flex-1 h-8 text-[10px] border-white/10 hover:border-white/20 text-zinc-300 gap-1 cursor-pointer"
            >
              <ArrowDownLeft className="h-3 w-3 text-emerald-400" /> {language === 'kz' ? 'Толықтыру' : language === 'en' ? 'Deposit' : 'Пополнить'}
            </Button>
            <Button 
              size="sm" 
              onClick={() => setActiveAction(activeAction === 'withdraw' ? null : 'withdraw')}
              className="flex-1 h-8 text-[10px] bg-primary hover:bg-primary/95 text-white gap-1 shadow-[0_0_10px_rgba(6,182,212,0.15)] cursor-pointer"
            >
              <ArrowUpRight className="h-3 w-3" /> {pt.withdrawBtn}
            </Button>
          </div>

          {/* Action Input Panel (Deposit/Withdraw) */}
          {activeAction && (
            <div className="w-full border-t border-white/5 pt-3 mt-1 space-y-3">
              {activeAction === 'deposit' ? (
                <div className="space-y-3 text-left">
                  <div className="p-3 rounded-lg bg-zinc-950/40 border border-white/5 text-[10px] space-y-2 text-zinc-400">
                    <p className="font-semibold text-white">
                      {language === 'kz' ? 'Kaspi арқылы теңгерімді толтыру:' : 'Пополнение баланса через Kaspi:'}
                    </p>
                    <p>
                      {language === 'kz' 
                        ? '1. Реквизиттер бойынша аударым жасаңыз:' 
                        : '1. Сделайте перевод по реквизитам:'}
                      <br />
                      <span className="font-mono text-primary font-bold">Kaspi Gold: +7 (707) 123-45-67</span> (Арсен О.)
                    </p>
                    <p>
                      {language === 'kz' 
                        ? '2. Чекті Telegram/WhatsApp-қа жіберіңіз: ' 
                        : '2. Отправьте чек в Telegram/WhatsApp: '}
                      <a href="https://wa.me/77071234567" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">
                        +7 (707) 123-45-67
                      </a>
                    </p>
                    <p className="text-[9px] text-zinc-500 italic">
                      {language === 'kz' 
                        ? '*Баланс чек тексерілгеннен кейін 5-10 минут ішінде аударылады.' 
                        : '*Баланс будет зачислен в течение 5-10 минут после проверки чека.'}
                    </p>
                  </div>
                  
                  {/* Demo automatic loader */}
                  <form onSubmit={handleBalanceSubmit} className="space-y-2">
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">
                      {language === 'kz' ? 'Тест үшін демо-толтыру:' : 'Демо-пополнение для тестирования:'}
                    </p>
                    {actionError && (
                      <div className="text-[9px] text-red-400 bg-red-500/5 p-1 rounded border border-red-500/10">
                        {actionError}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Сумма (₸)"
                        value={actionAmount}
                        onChange={(e) => setActionAmount(e.target.value)}
                        required
                        className="bg-zinc-950/40 border-white/5 h-8 text-[10px] text-zinc-200"
                      />
                      <Button 
                        type="submit" 
                        disabled={actionLoading}
                        className="h-8 text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer px-3 shrink-0"
                      >
                        {actionLoading ? t('common').loading : language === 'kz' ? 'Толықтыру' : 'Зачислить'}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <form onSubmit={handleBalanceSubmit} className="space-y-2">
                  <p className="text-[10px] text-zinc-400 font-semibold text-left">
                    {language === 'kz' ? 'Қаражатты шығару:' : 'Вывод средств:'}
                  </p>
                  {actionError && (
                    <div className="text-[9px] text-red-400 bg-red-500/5 p-1 rounded border border-red-500/10">
                      {actionError}
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-zinc-950/40 border border-white/5 text-[9px] text-zinc-400 text-left space-y-1">
                    <p>{language === 'kz' ? 'Қаражатты Kaspi Gold картаңызға шығару сұранысын жасаңыз.' : 'Будет создан запрос на вывод средств на вашу карту Kaspi Gold.'}</p>
                    <p className="text-zinc-500 italic">{language === 'kz' ? '*Шығару 1 сағатқа дейін созылады.' : '*Вывод обрабатывается гарантом до 1 часа.'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder={pt.withdrawAmountPlaceholder}
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      required
                      className="bg-zinc-950/40 border-white/5 h-8 text-[10px] text-zinc-200"
                    />
                    <Button 
                      type="submit" 
                      disabled={actionLoading}
                      className="h-8 text-[9px] bg-primary hover:bg-primary/95 text-white cursor-pointer px-3 shrink-0"
                    >
                      {actionLoading ? t('common').loading : language === 'kz' ? 'Шығару' : 'Вывести'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
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
          <TabsTrigger value="listings" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white cursor-pointer">
            {pt.activeOffersTab} ({activeListings.length})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white cursor-pointer">
            {pt.purchasesTab} ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white cursor-pointer">
            {pt.salesTab} ({sales.length})
          </TabsTrigger>
        </TabsList>

        {/* A. My Listings Tab */}
        <TabsContent value="listings" className="space-y-4">
          <Card className="bg-zinc-900/10 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
              <div>
                <CardTitle className="text-sm font-semibold text-white">
                  {language === 'kz' ? 'Сіздің белсенді хабарландыруларыңыз' : language === 'en' ? 'Your Active Marketplace Offers' : 'Ваши активные объявления'}
                </CardTitle>
                <CardDescription className="text-[11px] text-zinc-500">
                  {language === 'kz' ? 'Сіз қазір сатып жатқан тауарлар мен қызметтер.' : language === 'en' ? 'Items and services you are currently selling.' : 'Товары и услуги, которые вы сейчас продаете.'}
                </CardDescription>
              </div>
              <Link href="/listings/create">
                <Button size="sm" className="h-8 text-[10px] bg-zinc-800 hover:bg-primary text-white border border-white/5 cursor-pointer">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" /> {language === 'kz' ? 'Қосу' : language === 'en' ? 'Add New' : 'Добавить'}
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  {t('common').loading}
                </div>
              ) : activeListings.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {activeListings.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-zinc-900/20 transition text-xs">
                      <div className="space-y-1">
                        <Link href={`/listings/${item.id}`} className="font-semibold text-zinc-200 hover:text-primary transition-colors">
                          {item.title}
                        </Link>
                        <div className="text-[10px] text-zinc-500">
                          {item.game?.name} • {
                            item.category?.name === 'Items' ? language === 'kz' ? 'Заттар' : language === 'en' ? 'Items' : 'Предметы' :
                            item.category?.name === 'Currency' ? 'Валюта' :
                            item.category?.name === 'Accounts' ? language === 'kz' ? 'Аккаунты' : 'Accounts' :
                            language === 'kz' ? 'Бустинг' : 'Boosting'
                          }
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="font-semibold text-primary font-mono">{parseFloat(item.price).toFixed(0)} ₸</div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 uppercase">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  {pt.noActiveOffers}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* B. Purchases Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <Card className="bg-zinc-900/10 border-white/5">
            <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="text-sm font-semibold text-white">
                {language === 'kz' ? 'Сатып алу тарихы' : language === 'en' ? 'Purchase History' : 'История покупок'}
              </CardTitle>
              <CardDescription className="text-[11px] text-zinc-500">
                {language === 'kz' ? 'Сатып алған тауарларыңыз бен эскроу күйін бақылаңыз.' : language === 'en' ? 'Monitor items you purchased and active escrow state.' : 'Отслеживайте ваши покупки и состояние эскроу.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  {t('common').loading}
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
                          <span>{language === 'kz' ? 'Сатушы' : language === 'en' ? 'Seller' : 'Продавец'}: {purchase.seller?.username || 'gamer_store'}</span>
                          <span>•</span>
                          <span>{new Date(purchase.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="font-semibold text-zinc-100 font-mono">{parseFloat(purchase.amount).toFixed(0)} ₸</div>
                        
                        {/* Transaction Status Flow */}
                        {purchase.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[9px] text-zinc-400">
                            {ot.statusPending}
                          </span>
                        )}

                        {purchase.status === 'escrow' && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 animate-pulse" /> {ot.statusEscrow}
                            </span>
                            <Button 
                              size="sm" 
                              onClick={() => handleConfirmDelivery(purchase.id, purchase.seller?.id, parseFloat(purchase.amount))}
                              disabled={confirmLoadingId === purchase.id}
                              className="h-7 text-[9px] bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              {confirmLoadingId === purchase.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                ot.confirmReceiptBtn.includes('confirm') ? 'Confirm' : language === 'kz' ? 'Растау' : 'Подтвердить'
                              )}
                            </Button>
                          </div>
                        )}

                        {purchase.status === 'disputed' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5" /> {ot.statusDisputed}
                          </span>
                        )}

                        {purchase.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[9px] text-zinc-400 flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> {ot.statusCompleted}
                          </span>
                        )}

                        {purchase.status === 'canceled' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] text-red-500">
                            {ot.statusCanceled}
                          </span>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  {pt.noPurchases}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* C. Sales & Escrow Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card className="bg-zinc-900/10 border-white/5">
            <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="text-sm font-semibold text-white">
                {language === 'kz' ? 'Кіріс сатылымдар және эскроу' : language === 'en' ? 'Incoming Sales & Escrows' : 'Входящие продажи и эскроу'}
              </CardTitle>
              <CardDescription className="text-[11px] text-zinc-500">
                {language === 'kz' ? 'Эскроудан қаражатты алу үшін сатып алушыға тауарды жеткізіңіз.' : language === 'en' ? 'Deliver items to buyers to release funds from escrow.' : 'Передайте товар покупателю для разблокировки средств эскроу.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  {t('common').loading}
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
                          <span>{language === 'kz' ? 'Сатып алушы' : language === 'en' ? 'Buyer' : 'Покупатель'}: {sale.buyer?.username || 'gamer_store'}</span>
                          <span>•</span>
                          <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="font-semibold text-primary font-mono">{parseFloat(sale.amount).toFixed(0)} ₸</div>
                        
                        {sale.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[9px] text-zinc-400">
                            {language === 'kz' ? 'Төлемді күту' : language === 'en' ? 'Waiting for Payment' : 'Ожидание оплаты'}
                          </span>
                        )}

                        {sale.status === 'escrow' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5 animate-pulse" /> {language === 'kz' ? 'Эскроу бұғатталды: Тауарды тапсырыңыз' : language === 'en' ? 'Escrow Locked: Deliver Item' : 'Эскроу залочен: передайте товар'}
                          </span>
                        )}

                        {sale.status === 'disputed' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5" /> {ot.statusDisputed}
                          </span>
                        )}

                        {sale.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-[9px] text-zinc-400 flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> {language === 'kz' ? 'Эскроу босатылды (Төленді)' : language === 'en' ? 'Escrow Released' : 'Эскроу разблокирован (Выплачено)'}
                          </span>
                        )}

                        {sale.status === 'canceled' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] text-red-500">
                            {ot.statusCanceled}
                          </span>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  {pt.noSales}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
 
    </div>
  )
}
