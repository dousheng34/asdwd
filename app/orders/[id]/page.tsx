'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ShieldCheck, 
  MessageSquare, 
  Clock, 
  User, 
  Check, 
  ArrowLeft, 
  Send,
  Loader2,
  AlertTriangle,
  Lock,
  ThumbsUp,
  Scale,
  Key
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import PaymentUploadForm from '@/components/PaymentUploadForm'
import DisputeForm from '@/components/DisputeForm'
import ArbitrationAnalyzer from '@/components/ArbitrationAnalyzer'
import ReviewForm from '@/components/ReviewForm'
import { useTranslation } from '@/lib/i18n'

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const supabase = createClient()
  const { language, t } = useTranslation()
  const ot = t('order')

  const [tx, setTx] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Auto-delivery credentials
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Review Status
  const [hasReviewed, setHasReviewed] = useState(false)

  // Delivery confirmation action loader
  const [confirmLoading, setConfirmLoading] = useState(false)

  const loadOrderData = async () => {
    try {
      // 1. Fetch current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        setLoading(false)
        return
      }

      // 2. Fetch transaction details with joins
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          status,
          delivery_proof,
          created_at,
          listing:listings(
            id,
            title,
            description,
            game:games(id, name, slug),
            category:categories(id, name, slug)
          ),
          buyer:profiles!buyer_id(id, username, rating),
          seller:profiles!seller_id(id, username, rating)
        `)
        .eq('id', id)
        .single()

      if (txError) throw txError
      setTx(txData)

      // 3. Fetch chat history
      const { data: msgsData } = await supabase
        .from('messages')
        .select('*')
        .eq('transaction_id', id)
        .order('created_at', { ascending: true })

      setMessages(msgsData || [])

      // 4. Try loading Auto-delivery secret if status permits (escrow, completed, disputed)
      if (txData.status !== 'pending') {
        const { data: secretData } = await supabase
          .from('listing_secrets')
          .select('secret_data')
          .eq('listing_id', txData.listing.id)
          .maybeSingle()

        if (secretData) {
          setSecret(secretData.secret_data)
        }
      }

      // 5. Check if buyer has already reviewed this transaction
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('id')
        .eq('transaction_id', id)
        .maybeSingle()

      if (reviewData) {
        setHasReviewed(true)
      }
    } catch (err: any) {
      console.error('Error loading order data:', err)
      setError(err.message || 'Failed to load transaction details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrderData()

    // 6. Set up real-time subscription for messages and transaction changes
    const channel = supabase
      .channel(`order-room-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `transaction_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `id=eq.${id}` },
        (payload) => {
          loadOrderData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !tx) return

    const recipientId = user.id === tx.buyer.id ? tx.seller.id : tx.buyer.id

    try {
      const { error: sendErr } = await supabase
        .from('messages')
        .insert({
          transaction_id: id,
          sender_id: user.id,
          recipient_id: recipientId,
          content: newMessage
        })

      if (sendErr) throw sendErr
      setNewMessage('')
    } catch (err: any) {
      console.error('Message send error:', err)
      alert('Failed to send message.')
    }
  }

  const handleConfirmDelivery = async () => {
    if (!tx || !user) return
    setConfirmLoading(true)
    try {
      // 1. Set status to completed
      const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', tx.id)

      if (txError) throw txError

      // 2. Fetch current seller balance and sales count
      const { data: sellerProfile, error: sellerError } = await supabase
        .from('profiles')
        .select('balance, sales_count')
        .eq('id', tx.seller.id)
        .single()

      if (sellerError) throw sellerError

      // 3. Update seller's balance and sales count in database
      const currentSellerBalance = parseFloat(sellerProfile.balance || 0)
      const currentSellerSalesCount = parseInt(sellerProfile.sales_count || 0)

      const { error: finalError } = await supabase
        .from('profiles')
        .update({
          balance: currentSellerBalance + parseFloat(tx.amount),
          sales_count: currentSellerSalesCount + 1
        })
        .eq('id', tx.seller.id)

      if (finalError) throw finalError

      // Trigger automatic system notification message in chat
      const systemMsgContent = language === 'kz' 
        ? `[System Notification: Сатып алушы жеткізуді растады. Эскроу қаражаты ${parseFloat(tx.amount).toFixed(0)} ₸ сатушының балансына аударылды.]`
        : language === 'en'
        ? `[System Notification: Buyer confirmed delivery. Escrow funds of ${parseFloat(tx.amount).toFixed(0)} ₸ have been released to the seller's balance.]`
        : `[System Notification: Покупатель подтвердил доставку. Средства эскроу в размере ${parseFloat(tx.amount).toFixed(0)} ₸ были переведены на баланс продавца.]`

      await supabase.from('messages').insert({
        transaction_id: tx.id,
        sender_id: tx.buyer.id,
        recipient_id: tx.seller.id,
        content: systemMsgContent
      })

      await loadOrderData()
    } catch (err: any) {
      console.error('Delivery confirmation error:', err)
      alert(err.message || 'Failed to complete transaction.')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleCopyToClipboard = () => {
    if (!secret) return
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const authRequiredTitle = language === 'kz' ? 'Аутентификация қажет' : language === 'en' ? 'Authentication Required' : 'Требуется авторизация'
  const authRequiredDesc = language === 'kz' ? 'Транзакцияларды көру үшін жүйеге кіруіңіз керек.' : language === 'en' ? 'You must be signed in to access your transactions.' : 'Вы должны войти в аккаунт для доступа к вашим транзакциям.'
  
  const orderAccessErrorTitle = language === 'kz' ? 'Тапсырысқа кіру қатесі' : language === 'en' ? 'Order Access Error' : 'Ошибка доступа к заказу'
  const orderAccessErrorDesc = language === 'kz' ? 'Бұл тапсырыс жоқ немесе оны көруге рұқсатыңыз жоқ.' : language === 'en' ? "This order doesn't exist or you do not have permission to view it." : 'Этот заказ не существует или у вас нет прав на его просмотр.'
  const backToDashboardBtn = language === 'kz' ? 'Кабинетке қайту' : language === 'en' ? 'Back to Dashboard' : 'Назад в кабинет'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-zinc-500 text-xs font-light">{t('common').loading}</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <Lock className="h-10 w-10 text-zinc-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">{authRequiredTitle}</h2>
        <p className="text-xs text-zinc-500">{authRequiredDesc}</p>
        <Link href="/auth/login">
          <Button size="sm" className="bg-primary hover:bg-primary/95 text-white text-xs h-9 cursor-pointer">
            {t('navbar').signIn}
          </Button>
        </Link>
      </div>
    )
  }

  if (error || !tx || (user.id !== tx.buyer.id && user.id !== tx.seller.id)) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-zinc-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">{orderAccessErrorTitle}</h2>
        <p className="text-xs text-zinc-500">{orderAccessErrorDesc}</p>
        <Link href="/profile">
          <Button size="sm" variant="outline" className="border-white/10 hover:border-white/20 text-xs text-zinc-300 cursor-pointer">
            {backToDashboardBtn}
          </Button>
        </Link>
      </div>
    )
  }

  const isBuyer = user.id === tx.buyer.id
  const orderPartner = isBuyer ? tx.seller.username : tx.buyer.username

  // Extract receipt image URL if payment completed
  let receiptImageUrl = null
  if (tx.delivery_proof) {
    try {
      const parsedProof = JSON.parse(tx.delivery_proof)
      receiptImageUrl = parsedProof.receipt_image_url
    } catch (e) {
      if (tx.delivery_proof.startsWith('http')) {
        receiptImageUrl = tx.delivery_proof
      }
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <Link href="/profile" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition">
        <ArrowLeft className="h-3.5 w-3.5" /> {backToDashboardBtn}
      </Link>

      {/* Grid of details & chats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Order Details & Real-Time Chat */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <Card className="bg-zinc-900/10 border-white/5 p-6 rounded-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">{ot.orderId} #{tx.id.substring(0, 8)}</span>
                <h1 className="text-lg sm:text-xl font-bold text-white mt-1 leading-tight">{tx.listing?.title}</h1>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {language === 'kz' ? 'Ойын' : language === 'en' ? 'Game' : 'Игра'}: <span className="text-zinc-200">{tx.listing?.game?.name}</span> • 
                  {language === 'kz' ? 'Санат' : language === 'en' ? 'Category' : 'Категория'}: <span className="text-zinc-200 ml-1">
                    {tx.listing?.category?.name === 'Items' ? language === 'kz' ? 'Заттар' : language === 'en' ? 'Items' : 'Предметы' :
                     tx.listing?.category?.name === 'Currency' ? 'Валюта' :
                     tx.listing?.category?.name === 'Accounts' ? language === 'kz' ? 'Аккаунты' : 'Accounts' :
                     language === 'kz' ? 'Бустинг' : 'Boosting'}
                  </span>
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block">
                  {language === 'kz' ? 'Эскроу сомасы' : language === 'en' ? 'Amount Escrowed' : 'Сумма в эскроу'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-primary font-mono">{parseFloat(tx.amount).toFixed(0)} ₸</span>
              </div>
            </div>

            {/* Custom transaction status line */}
            <div className="mt-6 border-t border-white/5 pt-4 flex flex-wrap gap-4 items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">
                  {language === 'kz' ? 'Мәміле серіктесі:' : language === 'en' ? 'Order Partner:' : 'Партнер по сделке:'}
                </span>
                <span className="text-zinc-200 font-semibold flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-zinc-400" /> {orderPartner}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500">
                  {language === 'kz' ? 'Орындалу күйі:' : language === 'en' ? 'Fulfillment Status:' : 'Статус выполнения:'}
                </span>
                {tx.status === 'pending' && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-zinc-400 font-semibold">
                    {ot.statusPending}
                  </span>
                )}
                {tx.status === 'escrow' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold flex items-center gap-1 animate-pulse">
                    <Clock className="h-2.5 w-2.5" /> {ot.statusEscrow}
                  </span>
                )}
                {tx.status === 'disputed' && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold flex items-center gap-1">
                    <Scale className="h-2.5 w-2.5 text-primary" /> {ot.statusDisputed}
                  </span>
                )}
                {tx.status === 'completed' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" /> {ot.statusCompleted}
                  </span>
                )}
                {tx.status === 'canceled' && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-semibold">
                    {ot.statusCanceled}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Secure Transaction Chat */}
          <Card className="rounded-2xl border-white/5 bg-zinc-900/10 overflow-hidden flex flex-col h-[480px]">
            <CardHeader className="bg-zinc-900/40 px-5 py-3.5 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-primary" />
                <div>
                  <CardTitle className="text-xs font-bold text-zinc-200">{ot.chatTitle}</CardTitle>
                  <CardDescription className="text-[9px] text-zinc-500 mt-0.5">
                    {language === 'kz' ? 'Мәліметтер дауларды шешу үшін мұрағатталады.' : language === 'en' ? 'Logs are archived for dispute arbitration.' : 'История чата сохраняется для разрешения споров.'}
                  </CardDescription>
                </div>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono font-semibold bg-zinc-950/40 px-2 py-0.5 rounded border border-white/5">
                P2P CHANNEL
              </span>
            </CardHeader>
            
            {/* Messages body */}
            <div className="p-5 flex-grow overflow-y-auto space-y-4 text-xs">
              {messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isSystem = msg.content.startsWith('[System Notification:')
                  const isMe = msg.sender_id === user.id

                  if (isSystem) {
                    const systemText = msg.content.replace(/^\[System Notification:\s*|\]$/g, '')
                    // Translate system message strings on display if they contain key terms
                    let displaySystemText = systemText
                    if (systemText.includes('confirmed delivery')) {
                      displaySystemText = language === 'kz'
                        ? `Сатып алушы жеткізуді растады. Эскроу қаражаты ${parseFloat(tx.amount).toFixed(0)} ₸ сатушының балансына аударылды.`
                        : language === 'en'
                        ? `Buyer confirmed delivery. Escrow funds of ${parseFloat(tx.amount).toFixed(0)} ₸ have been released.`
                        : `Покупатель подтвердил доставку. Средства эскроу в размере ${parseFloat(tx.amount).toFixed(0)} ₸ были переведены на баланс продавца.`
                    } else if (systemText.includes('Buyer left a review')) {
                      displaySystemText = language === 'kz'
                        ? `Сатып алушы пікір қалдырды.`
                        : language === 'en'
                        ? `Buyer left a review.`
                        : `Покупатель оставил отзыв.`
                    }

                    return (
                      <div key={msg.id || index} className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-zinc-400 text-center max-w-xl mx-auto italic leading-normal">
                        {displaySystemText}
                      </div>
                    )
                  }

                  return (
                    <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-xl max-w-[80%] leading-relaxed ${
                        isMe 
                          ? 'bg-primary/10 border border-primary/20 text-white rounded-br-none' 
                          : 'bg-zinc-800/40 border border-white/5 text-zinc-200 rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-zinc-500 mt-1 px-1">
                        {isMe ? (language === 'kz' ? 'Сіз' : language === 'en' ? 'You' : 'Вы') : orderPartner} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                  <MessageSquare className="h-8 w-8 text-zinc-700 animate-pulse" />
                  <p className="text-[10px]">
                    {language === 'kz' ? 'Хабарламалар әлі жоқ. Ақпарат алмасуды бастау үшін сәлемдесу жіберіңіз!' : language === 'en' ? 'No messages yet. Send a greeting to begin coordination!' : 'Сообщений пока нет. Напишите что-нибудь для начала общения!'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Input form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-2 bg-zinc-900/20">
              <Input
                placeholder={ot.chatPlaceholder}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-zinc-950/40 border-white/5 text-xs h-10 focus-visible:ring-primary/50 text-zinc-200"
              />
              <Button type="submit" className="h-10 px-4 bg-primary hover:bg-primary/95 text-white cursor-pointer">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>

        </div>

        {/* Right Column: Escrow Steps, Auto-Delivery Secret & Review */}
        <div className="space-y-6">
          
          {/* AUTO-DELIVERY SECRET PANEL (Playerok Key Feature) */}
          {secret && (
            <Card className="bg-primary/5 border-primary/20 shadow-xl overflow-hidden relative border-dashed">
              <CardHeader className="p-5 border-b border-primary/10 bg-primary/10">
                <CardTitle className="text-xs uppercase font-bold tracking-wider text-primary flex items-center gap-1.5 animate-pulse">
                  <Key className="h-4 w-4 text-primary" /> {ot.autoDeliveryTitle}
                </CardTitle>
                <CardDescription className="text-[10px] text-zinc-400">
                  {ot.autoDeliveryDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="p-3 bg-zinc-950/60 rounded-lg border border-white/5 font-mono text-xs text-zinc-200 break-all select-all relative group max-h-[120px] overflow-y-auto">
                  {secret}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCopyToClipboard}
                  className="w-full text-[10px] border-primary/20 hover:border-primary/40 text-zinc-300 gap-1.5 h-8 bg-zinc-900/20 cursor-pointer"
                >
                  {copied ? t('common').copied : `${t('common').copy} (${language === 'kz' ? 'Көшіру' : 'Копировать'})`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Steps & Reviews Card */}
          <Card className="bg-zinc-900/20 border-white/5 shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-xs uppercase font-bold tracking-wider text-zinc-400">{ot.timelineTitle}</CardTitle>
              <CardDescription className="text-[10px] text-zinc-500">
                {language === 'kz' ? 'Мәмілені қауіпсіз аяқтау үшін төмендегі қадамдарды орындаңыз.' : language === 'en' ? 'Follow the steps below to securely complete this trade.' : 'Следуйте шагам ниже для безопасного завершения сделки.'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-5 space-y-4">
              
              {/* STATUS: PENDING */}
              {tx.status === 'pending' && (
                isBuyer ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/10 text-xs text-zinc-300 space-y-2 leading-relaxed">
                      <p className="font-semibold text-white">💳 Step 1: {language === 'kz' ? 'Төлем квитанциясын жүктеу' : language === 'en' ? 'Upload Kaspi Receipt' : 'Загрузка чека Kaspi'}</p>
                      <p className="text-[11px] text-zinc-400">
                        {language === 'kz' 
                          ? `Қаражатты брондау үшін Kaspi Gold арқылы **${parseFloat(tx.amount).toFixed(0)} ₸** аударыңыз және төлем түбіртегін төменде жүктеңіз.` 
                          : language === 'en'
                          ? `Please send **${parseFloat(tx.amount).toFixed(0)} ₸** via Kaspi and upload the receipt screenshot below to lock funds in escrow.`
                          : `Пожалуйста, переведите **${parseFloat(tx.amount).toFixed(0)} ₸** через Kaspi и загрузите скриншот квитанции ниже для блокировки средств.`}
                      </p>
                    </div>
                    <PaymentUploadForm orderId={tx.id} />
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-zinc-900/40 border border-white/5 text-xs text-zinc-400 leading-relaxed text-center space-y-3 py-6">
                    <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
                    <div>
                      <p className="font-semibold text-white">
                        {language === 'kz' ? 'Сатып алушы төлемін күту' : language === 'en' ? 'Waiting for Buyer Payment' : 'Ожидание оплаты покупателем'}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {language === 'kz' 
                          ? 'Сатып алушы төлемді әлі растамады. Статус «Төленді (Эскроуда)» болып өзгергенше тауарды жібермеңіз.' 
                          : language === 'en' 
                          ? 'The buyer has not verified payment yet. Do not send items until status changes to Escrow Locked.' 
                          : 'Покупатель еще не подтвердил оплату. Не отправляйте товар, пока статус не изменится на «Оплачено (В эскроу)».'}
                      </p>
                    </div>
                  </div>
                )
              )}

              {/* STATUS: ESCROW */}
              {tx.status === 'escrow' && (
                isBuyer ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-zinc-300 space-y-2 leading-relaxed">
                      <p className="font-semibold text-amber-400">🔒 Step 2: {language === 'kz' ? 'Тауарды қабылдау және тексеру' : language === 'en' ? 'Receive & Verify Items' : 'Получение и проверка товара'}</p>
                      <p className="text-[11px] text-zinc-400">
                        {secret 
                          ? language === 'kz' 
                            ? 'Автоматты түрде беру деректері жоғарыда ашылды. Мәліметтерді тексеріп, төменде «Алуды растау» түймесін басыңыз.' 
                            : language === 'en'
                            ? 'Auto-Delivery has released your item details above. Check the credentials. If everything works, click Confirm below.'
                            : 'Данные автовыдачи открылись выше. Проверьте их и нажмите кнопку подтверждения получения ниже.'
                          : language === 'kz'
                            ? 'Сатушыға төлем эскроуда бұғатталғаны туралы хабарланды. Тауарды жіберуін күтіңіз. Тексергеннен кейін алуды растаңыз.'
                            : language === 'en'
                            ? 'The seller has been notified that payment is frozen. Wait for them to deliver the items. After verifying details, confirm delivery to release funds.'
                            : 'Продавец уведомлен о блокировке средств. Ожидайте передачи товара. После проверки подтвердите получение для выплаты продавцу.'}
                      </p>
                    </div>

                    <Button 
                      onClick={handleConfirmDelivery}
                      disabled={confirmLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs h-10 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {confirmLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Releasing Escrow...
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="h-4 w-4" />
                          {ot.confirmReceiptBtn}
                        </>
                      )}
                    </Button>

                    <div className="border-t border-white/5 pt-3">
                      <details className="group">
                        <summary className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer list-none transition">
                          <AlertTriangle className="h-3 w-3 text-amber-500/70" />
                          {ot.disputeBtn}
                        </summary>
                        <div className="mt-3">
                          <DisputeForm orderId={tx.id} />
                        </div>
                      </details>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-zinc-300 space-y-2 leading-relaxed">
                      <p className="font-semibold text-emerald-400">💰 Step 2: {language === 'kz' ? 'Тауарды сатып алушыға тапсыру' : language === 'en' ? 'Deliver Items to Buyer' : 'Передача товара покупателю'}</p>
                      <p className="text-[11px] text-zinc-400">
                        {secret 
                          ? language === 'kz' 
                            ? 'Бұл тауарда автоматты түрде беру қосулы болды. Деректер сатып алушыға автоматты түрде берілді. Ештеңе істеудің қажеті жоқ!' 
                            : language === 'en'
                            ? 'This listing had Auto-Delivery enabled. The credentials have been securely released to the buyer. You do not need to do anything!'
                            : 'Для этого товара была включена автовыдача. Деректер автоматически переданы покупателю. Вам ничего делать не нужно!'
                          : language === 'kz'
                            ? `Төлем ${parseFloat(tx.amount).toFixed(0)} ₸ эскроуда бұғатталды. Енді тауарды қауіпсіз тапсыра аласыз. Чатта үйлестіріңіз.`
                            : language === 'en'
                            ? `Payment of ${parseFloat(tx.amount).toFixed(0)} ₸ is frozen in escrow. It is now safe to deliver the items. Chat with the buyer.`
                            : `Платеж в размере ${parseFloat(tx.amount).toFixed(0)} ₸ заблокирован в эскроу. Теперь можно безопасно передать товар. Договоритесь в чате.`}
                      </p>
                    </div>
                    {receiptImageUrl && (
                      <div className="p-3.5 rounded bg-zinc-950/40 border border-white/5 text-[10px] space-y-1.5">
                        <span className="text-zinc-500 font-semibold block uppercase">
                          {language === 'kz' ? 'Сатып алушының төлемді растауы' : language === 'en' ? 'Buyer Payment Verification' : 'Подтверждение оплаты покупателем'}
                        </span>
                        <a 
                          href={receiptImageUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-primary hover:underline font-mono"
                        >
                          {language === 'kz' ? 'Түбіртек скриншотын көру' : language === 'en' ? 'View receipt screenshot' : 'Посмотреть скриншот квитанции'}
                        </a>
                      </div>
                    )}
                    <div className="p-3 rounded bg-zinc-900/40 border border-white/5 text-[10px] text-zinc-500 text-center">
                      {language === 'kz' 
                        ? 'Сатып алушы тауарды алғанын растағаннан кейін, қаражат сіздің балансыңызға бірден аударылады.' 
                        : language === 'en' 
                        ? 'Once the buyer confirms they received the items, funds will be instantly released to your balance.' 
                        : 'После того как покупатель подтвердит получение товара, средства мгновенно поступят на ваш баланс.'}
                    </div>
                  </div>
                )
              )}

              {/* STATUS: DISPUTED */}
              {tx.status === 'disputed' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-400 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> {ot.statusDisputed}
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      {language === 'kz' 
                        ? 'Сатып алушы дау ашты. Lindy AI арбитражы мәмілені шешу үшін чат тарихын және журналдарды талдауда.' 
                        : language === 'en' 
                        ? 'The buyer raised a dispute. Lindy AI is evaluating the transaction logs and chat messages to resolve the escrow.' 
                        : 'Покупатель открыл спор. Арбитраж Lindy AI анализирует историю чата и логи сделки для вынесения вердикта.'}
                    </p>
                  </div>
                  
                  {/* Lindy AI Verdict display and execution actions */}
                  <ArbitrationAnalyzer orderId={tx.id} />
                </div>
              )}

              {/* STATUS: COMPLETED */}
              {tx.status === 'completed' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-zinc-400 leading-relaxed text-center space-y-3 py-6">
                    <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{ot.statusCompleted}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {isBuyer 
                          ? language === 'kz' 
                            ? 'Сіз тауарды алғаныңызды растадыңыз. Мәміле аяқталды.' 
                            : language === 'en' 
                            ? 'You confirmed delivery. The transaction is complete.' 
                            : 'Вы подтвердили получение товара. Сделка успешно завершена.'
                          : language === 'kz' 
                            ? 'Сатып алушы алуды растады. Қаражат сіздің балансыңызға аударылды.' 
                            : language === 'en' 
                            ? 'The buyer confirmed delivery. Funds have been released to your balance.' 
                            : 'Покупатель подтвердил получение. Средства переведены на ваш баланс.'}
                      </p>
                    </div>
                  </div>

                  {/* Review Form for Buyer after completion */}
                  {isBuyer && !hasReviewed && (
                    <div className="border-t border-white/5 pt-4">
                      <ReviewForm 
                        transactionId={tx.id} 
                        sellerId={tx.seller.id} 
                        buyerId={tx.buyer.id} 
                        onReviewSubmitted={() => setHasReviewed(true)} 
                      />
                    </div>
                  )}

                  {isBuyer && hasReviewed && (
                    <div className="p-3 rounded bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-center text-zinc-400">
                      ✓ {t('reviews').reviewSuccess}
                    </div>
                  )}
                </div>
              )}

              {/* STATUS: CANCELED */}
              {tx.status === 'canceled' && (
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-zinc-400 leading-relaxed text-center space-y-2 py-6">
                  <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
                  <div>
                    <p className="font-semibold text-white">{ot.statusCanceled}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {language === 'kz'
                        ? 'Бұл мәміле арбитраж шешімімен жойылды. Қаражат сатып алушыға қайтарылды.'
                        : language === 'en'
                        ? 'This transaction has been resolved by arbitration/support. The funds have been refunded to the buyer.'
                        : 'Эта сделка была отменена арбитражем. Средства возвращены покупателю.'}
                    </p>
                  </div>
                </div>
              )}

            </CardContent>
            
            <CardFooter className="p-5 border-t border-white/5 text-[9px] text-zinc-500 text-center leading-normal">
              {language === 'kz' 
                ? `Көмек керек пе? Қолдау қызметі кез келген уақытта осы тапсырысты (ID ${tx.id.substring(0, 8)}) тексере алады.` 
                : language === 'en' 
                ? `Need assistance? Support team can review this transaction chat ID ${tx.id.substring(0, 8)} anytime.` 
                : `Нужна помощь? Служба поддержки может проверить эту сделку (ID ${tx.id.substring(0, 8)}) в любое время.`}
            </CardFooter>
          </Card>

        </div>

      </div>

    </div>
  )
}
