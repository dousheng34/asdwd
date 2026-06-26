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
import { useTranslation } from '@/lib/i18n'

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const supabase = createClient()
  const { language, t } = useTranslation()

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

        // Extract delivery time
        const deliveryMatch = listingData?.description?.match(/^\[Delivery: ([^\]]+)\]/)
        const deliveryVal = deliveryMatch ? deliveryMatch[1] : 'Instant'

        const greetingText = language === 'kz' 
          ? `Сәлем! Бұл ұсыныс бойынша сұрақтарыңыз болса, қоя беріңіз. Жеткізу уақыты шамамен: ${deliveryVal}.`
          : language === 'en'
          ? `Hey! Let me know if you have any questions about this offer. Delivery is estimated at ${deliveryVal}.`
          : `Привет! Если у вас есть вопросы по этому предложению, пишите. Жеткізу уақыты шамамен: ${deliveryVal}.`

        setMessages([
          { 
            sender: listingData?.seller?.username || 'Seller', 
            content: greetingText, 
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
  }, [id, language])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setMessages([...messages, { sender: 'You', content: newMessage, time: 'Just now' }])
    setNewMessage('')
  }

  const handlePurchase = async () => {
    if (!user) {
      setError(language === 'kz' ? 'Сатып алу үшін жүйеге кіріңіз.' : language === 'en' ? 'You must be logged in to buy items. Please sign in.' : 'Войдите в аккаунт, чтобы совершить покупку.')
      return
    }

    if (user.id === listing?.seller?.id) {
      setError(language === 'kz' ? 'Өз хабарландыруыңызды сатып ала алмайсыз!' : language === 'en' ? 'You cannot buy your own listing!' : 'Вы не можете купить свой собственный товар!')
      return
    }

    setPurchasing(true)
    setError(null)
    try {
      // Create escrow transaction
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

      router.push(`/orders/${data.id}`)
    } catch (err: any) {
      console.error('Purchase initialization error:', err)
      setError(err.message || 'Failed to initialize transaction in database.')
    } finally {
      setPurchasing(false)
    }
  }

  // Localized texts
  const backToListingsBtn = language === 'kz' ? 'Хабарландыруларға оралу' : language === 'en' ? 'Back to Listings' : 'Назад к объявлениям'
  const itemDescTitle = language === 'kz' ? 'Тауар сипаттамасы' : language === 'en' ? 'Item Description' : 'Описание товара'
  const noDescProvided = language === 'kz' ? 'Сипаттама берілмеген.' : language === 'en' ? 'No description provided.' : 'Описание отсутствует.'
  
  const offerSpecsTitle = language === 'kz' ? 'Ұсыныстың сипаттамалары' : language === 'en' ? 'Offer Specifications' : 'Характеристики предложения'
  const specDeliveryMethod = language === 'kz' ? 'Жеткізу әдісі' : language === 'en' ? 'Delivery Method' : 'Метод доставки'
  const specStock = language === 'kz' ? 'Қолжетімді саны' : language === 'en' ? 'Quantity Available' : 'Доступно для покупки'
  const specSecurity = language === 'kz' ? 'Қауіпсіздік' : language === 'en' ? 'Security' : 'Безопасность'
  const specSecurityVal = language === 'kz' ? '100% Қорғалған' : language === 'en' ? '100% Protected' : '100% Защищено'
  
  const prePurchaseChatTitle = language === 'kz' ? 'Сатушымен алдын ала чат' : language === 'en' ? 'Pre-Purchase Chat with Seller' : 'Чат с продавцом до покупки'
  const prePurchaseChatPlaceholder = language === 'kz' ? 'Тауардың қолжетімділігі, жеткізу жылдамдығы туралы сұраңыз...' : language === 'en' ? 'Ask about availability, delivery speed...' : 'Спросите о наличии, скорости доставки...'
  
  const totalPriceLabel = language === 'kz' ? 'Жалпы бағасы' : language === 'en' ? 'Total price' : 'Итоговая цена'
  const checkoutDeliveryMethod = language === 'kz' ? 'Жеткізу әдісі' : language === 'en' ? 'Delivery Method' : 'Метод доставки'
  const expectedDeliveryLabel = language === 'kz' ? 'Күтілетін жеткізу' : language === 'en' ? 'Expected Delivery' : 'Ожидаемое время доставки'
  const escrowSecurityLabel = language === 'kz' ? 'Эскроу қауіпсіздігі' : language === 'en' ? 'Escrow Security' : 'Безопасность эскроу'
  const escrowSecurityVal = language === 'kz' ? 'Расталған қауіпсіз' : language === 'en' ? 'Verified Secure' : 'Проверенная защита'
  
  const buyNowBtnText = language === 'kz' ? 'Қазір сатып алу — Эскроу қорғанысы' : language === 'en' ? 'Buy Now — Escrow Protected' : 'Купить сейчас — Эскроу защита'
  const creatingOrderBtnText = language === 'kz' ? 'Тапсырыс жасалуда...' : language === 'en' ? 'Creating Order...' : 'Создание заказа...'
  
  const tradeProtectionLabel = language === 'kz' ? 'Asyk.kz Сауданы Қорғау' : language === 'en' ? 'Asyk.kz Trade Protection' : 'Защита сделок Asyk.kz'
  const tradeProtectionDesc = language === 'kz' ? 'Қаражат біздің эскроуда сақталады және сіз тауарды алғаныңызды растағаннан кейін ғана босатылады.' : language === 'en' ? 'Money is held in our escrow and is only released after you confirm you have received the item.' : 'Деньги хранятся в нашем эскроу и переводятся продавцу только после вашего подтверждения получения.'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-zinc-500 text-xs">{t('common').loading}</span>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-zinc-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">{language === 'kz' ? 'Ұсыныс табылмады' : language === 'en' ? 'Offer Not Found' : 'Предложение не найдено'}</h2>
        <p className="text-xs text-zinc-500">{error}</p>
        <Link href="/">
          <Button size="sm" variant="outline" className="border-white/10 hover:border-white/20 text-xs text-zinc-300 cursor-pointer">
            {language === 'kz' ? 'Басты бетке қайту' : language === 'en' ? 'Back to Home' : 'Назад на главную'}
          </Button>
        </Link>
      </div>
    )
  }

  const deliveryMatch = listing.description?.match(/^\[Delivery: ([^\]]+)\]/)
  const deliveryTime = deliveryMatch ? deliveryMatch[1] : 'Instant'
  const cleanDescription = listing.description?.replace(/^\[Delivery: [^\]]+\]\s*/, '') || ''

  const prePurchaseChatReply = language === 'kz' ? `Әдетте жауап береді: ${deliveryTime}` : language === 'en' ? `Usually replies in ${deliveryTime}` : `Обычно отвечает в течение ${deliveryTime}`

  const specs = [
    { label: specDeliveryMethod, value: 'P2P / Escrow' },
    { label: specStock, value: language === 'kz' ? `${listing.stock} дана` : language === 'en' ? `${listing.stock} units` : `${listing.stock} шт.` },
    { label: specSecurity, value: specSecurityVal }
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back to Home Link */}
      <Link href="/" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition">
        <ArrowLeft className="h-3.5 w-3.5" /> {backToListingsBtn}
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
                {listing.category?.name === 'Items' ? language === 'kz' ? 'Заттар' : language === 'en' ? 'Items' : 'Предметы' :
                 listing.category?.name === 'Currency' ? 'Валюта' :
                 listing.category?.name === 'Accounts' ? language === 'kz' ? 'Аккаунты' : 'Accounts' :
                 language === 'kz' ? 'Бустинг' : 'Boosting'}
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
              <div>{listing.seller?.sales_count || '0'} {language === 'kz' ? 'аяқталған сауда' : language === 'en' ? 'completed sales' : 'завершенных сделок'}</div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">{itemDescTitle}</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light whitespace-pre-line">
              {cleanDescription || noDescProvided}
            </p>
          </div>

          {/* Specs Grid */}
          <div className="p-6 rounded-xl bg-zinc-900/10 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">{offerSpecsTitle}</h3>
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
                <span className="text-xs font-semibold text-zinc-300">{prePurchaseChatTitle}</span>
              </div>
              <span className="text-[10px] text-zinc-500">{prePurchaseChatReply}</span>
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
                  <span className="text-[9px] text-zinc-500 mt-1">{msg.time === 'Just now' ? language === 'kz' ? 'Қазір ғана' : language === 'en' ? 'Just now' : 'Только что' : msg.time}</span>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 flex gap-2 bg-zinc-900/20">
              <Input
                placeholder={prePurchaseChatPlaceholder}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-zinc-950/40 border-white/5 text-xs h-9 focus-visible:ring-primary/50 text-zinc-200"
              />
              <Button type="submit" size="sm" className="h-9 px-3 bg-zinc-800 hover:bg-primary text-white cursor-pointer">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>

        </div>

        {/* Right Column: Checkout Card */}
        <div className="space-y-6">
          <Card className="bg-zinc-900/20 border-white/5 shadow-xl sticky top-20">
            <CardHeader className="p-6">
              <CardDescription className="text-xs text-zinc-500 uppercase tracking-wider">{totalPriceLabel}</CardDescription>
              <CardTitle className="text-3xl font-black text-primary font-mono mt-1">
                {listing.price.toFixed(0)} ₸
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              
              <div className="space-y-3 text-xs border-y border-white/5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">{checkoutDeliveryMethod}</span>
                  <span className="text-zinc-200 font-medium">In-Game / P2P</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">{expectedDeliveryLabel}</span>
                  <span className="text-zinc-200 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" /> {deliveryTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">{escrowSecurityLabel}</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> {escrowSecurityVal}
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
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.2)] h-11 text-xs cursor-pointer"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                    {creatingOrderBtnText}
                  </>
                ) : (
                  buyNowBtnText
                )}
              </Button>
            </CardContent>
            <CardFooter className="p-6 pt-4 text-[10px] text-zinc-500 text-center flex flex-col gap-2 border-t border-white/5">
              <span className="flex items-center gap-1 justify-center text-zinc-400">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {tradeProtectionLabel}
              </span>
              <span>
                {tradeProtectionDesc}
              </span>
            </CardFooter>
          </Card>
        </div>

      </div>

    </div>
  )
}
