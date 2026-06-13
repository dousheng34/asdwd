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
  AlertTriangle,
  Lock,
  ThumbsUp,
  Scale
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import PaymentUploadForm from '@/components/PaymentUploadForm'
import DisputeForm from '@/components/DisputeForm'
import ArbitrationAnalyzer from '@/components/ArbitrationAnalyzer'

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const supabase = createClient()

  const [tx, setTx] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
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
    } catch (err: any) {
      console.error('Error loading order data:', err)
      setError(err.message || 'Failed to load transaction details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrderData()

    // 4. Set up real-time subscription for messages and transaction changes
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
          // Refresh order data (status updates, new receipts, etc.)
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
      await supabase.from('messages').insert({
        transaction_id: tx.id,
        sender_id: tx.buyer.id, // Buyer confirmed
        recipient_id: tx.seller.id,
        content: `[System Notification: Buyer confirmed delivery. Escrow funds of $${parseFloat(tx.amount).toFixed(2)} have been released to the seller's balance.]`
      })

      await loadOrderData()
    } catch (err: any) {
      console.error('Delivery confirmation error:', err)
      alert(err.message || 'Failed to complete transaction.')
    } finally {
      setConfirmLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-zinc-500 text-xs font-light">Retrieving secure trade channel...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <Lock className="h-10 w-10 text-zinc-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Authentication Required</h2>
        <p className="text-xs text-zinc-500">You must be signed in to access your transactions.</p>
        <Link href="/auth/login">
          <Button size="sm" className="bg-primary hover:bg-primary/95 text-white text-xs h-9">
            Sign In
          </Button>
        </Link>
      </div>
    )
  }

  if (error || !tx || (user.id !== tx.buyer.id && user.id !== tx.seller.id)) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-zinc-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Order Access Error</h2>
        <p className="text-xs text-zinc-500">This order doesn't exist or you do not have permission to view it.</p>
        <Link href="/profile">
          <Button size="sm" variant="outline" className="border-white/10 hover:border-white/20 text-xs text-zinc-300">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  const isBuyer = user.id === tx.buyer.id
  const orderPartner = isBuyer ? tx.seller.username : tx.buyer.username

  // Parse delivery time
  const deliveryMatch = tx.listing?.description?.match(/^\[Delivery: ([^\]]+)\]/)
  const deliveryTime = deliveryMatch ? deliveryMatch[1] : 'Instant'

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
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>

      {/* Grid of details & chats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Order Details & Real-Time Chat */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <Card className="bg-zinc-900/10 border-white/5 p-6 rounded-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Order #{tx.id.substring(0, 8)}</span>
                <h1 className="text-lg sm:text-xl font-bold text-white mt-1 leading-tight">{tx.listing?.title}</h1>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Game: <span className="text-zinc-200">{tx.listing?.game?.name}</span> • 
                  Category: <span className="text-zinc-200 ml-1">{tx.listing?.category?.name}</span>
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Amount Escrowed</span>
                <span className="text-xl sm:text-2xl font-black text-primary font-mono">${parseFloat(tx.amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Custom transaction status line */}
            <div className="mt-6 border-t border-white/5 pt-4 flex flex-wrap gap-4 items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Order Partner:</span>
                <span className="text-zinc-200 font-semibold flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-zinc-400" /> {orderPartner}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Fulfillment Status:</span>
                {tx.status === 'pending' && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/5 text-zinc-400 font-semibold">
                    Waiting for Payment
                  </span>
                )}
                {tx.status === 'escrow' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold flex items-center gap-1 animate-pulse">
                    <Clock className="h-2.5 w-2.5" /> Escrow Locked
                  </span>
                )}
                {tx.status === 'disputed' && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold flex items-center gap-1">
                    <Scale className="h-2.5 w-2.5 text-primary" /> Under Arbitration
                  </span>
                )}
                {tx.status === 'completed' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" /> Completed
                  </span>
                )}
                {tx.status === 'canceled' && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-semibold">
                    Canceled & Refunded
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
                  <CardTitle className="text-xs font-bold text-zinc-200">Secure Deal Chat Room</CardTitle>
                  <CardDescription className="text-[9px] text-zinc-500 mt-0.5">Logs are archived for dispute arbitration.</CardDescription>
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
                    return (
                      <div key={msg.id || index} className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-zinc-400 text-center max-w-xl mx-auto italic leading-normal">
                        {msg.content.replace(/^\[System Notification:\s*|\]$/g, '')}
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
                        {isMe ? 'You' : orderPartner} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                  <MessageSquare className="h-8 w-8 text-zinc-700 animate-pulse" />
                  <p className="text-[10px]">No messages yet. Send a greeting to begin coordination!</p>
                </div>
              )}
            </div>
            
            {/* Input form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-2 bg-zinc-900/20">
              <Input
                placeholder="Message your partner..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-zinc-950/40 border-white/5 text-xs h-10 focus-visible:ring-primary/50 text-zinc-200"
              />
              <Button type="submit" className="h-10 px-4 bg-primary hover:bg-primary/95 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>

        </div>

        {/* Right Column: Escrow Steps & Active Actions */}
        <div className="space-y-6">
          
          {/* Action Steps Card */}
          <Card className="bg-zinc-900/20 border-white/5 shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-xs uppercase font-bold tracking-wider text-zinc-400">Escrow Guidelines</CardTitle>
              <CardDescription className="text-[10px] text-zinc-500">Follow the steps below to securely complete this trade.</CardDescription>
            </CardHeader>
            
            <CardContent className="p-5 space-y-4">
              
              {/* Dynamic instruction based on user role and transaction status */}
              
              {/* STATUS: PENDING */}
              {tx.status === 'pending' && (
                isBuyer ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/10 text-xs text-zinc-300 space-y-2 leading-relaxed">
                      <p className="font-semibold text-white">💳 Step 1: Upload Kaspi Receipt</p>
                      <p className="text-[11px] text-zinc-400">Please send **${parseFloat(tx.amount).toFixed(2)}** via Kaspi and upload the receipt screenshot below to verify the escrow payment.</p>
                    </div>
                    <PaymentUploadForm orderId={tx.id} />
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-zinc-900/40 border border-white/5 text-xs text-zinc-400 leading-relaxed text-center space-y-3 py-6">
                    <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
                    <div>
                      <p className="font-semibold text-white">Waiting for Buyer Payment</p>
                      <p className="text-[10px] text-zinc-500 mt-1">The buyer has not verified payment yet. Do not send items until status changes to **Escrow Locked**.</p>
                    </div>
                  </div>
                )
              )}

              {/* STATUS: ESCROW */}
              {tx.status === 'escrow' && (
                isBuyer ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-zinc-300 space-y-2 leading-relaxed">
                      <p className="font-semibold text-amber-400">🔒 Step 2: Receive & Verify Items</p>
                      <p className="text-[11px] text-zinc-400">The seller has been notified that payment is frozen. Wait for them to deliver the items. After verifying details, confirm delivery to release funds.</p>
                    </div>

                    <Button 
                      onClick={handleConfirmDelivery}
                      disabled={confirmLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs h-10 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center gap-1.5"
                    >
                      {confirmLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Releasing Escrow...
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="h-4 w-4" />
                          Confirm Delivery (Я получил товар)
                        </>
                      )}
                    </Button>

                    <div className="border-t border-white/5 pt-3">
                      <details className="group">
                        <summary className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer list-none transition">
                          <AlertTriangle className="h-3 w-3 text-amber-500/70" />
                          Problem with order? Open arbitration dispute
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
                      <p className="font-semibold text-emerald-400">💰 Step 2: Deliver Items to Buyer</p>
                      <p className="text-[11px] text-zinc-400">Payment of **${parseFloat(tx.amount).toFixed(2)}** is frozen in escrow. It is now completely safe to deliver the accounts/gold. Chat with the buyer to coordinate delivery.</p>
                    </div>
                    {receiptImageUrl && (
                      <div className="p-3.5 rounded bg-zinc-950/40 border border-white/5 text-[10px] space-y-1.5">
                        <span className="text-zinc-500 font-semibold block uppercase">Buyer Payment Verification</span>
                        <a 
                          href={receiptImageUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-primary hover:underline font-mono"
                        >
                          View receipt screenshot
                        </a>
                      </div>
                    )}
                    <div className="p-3 rounded bg-zinc-900/40 border border-white/5 text-[10px] text-zinc-500 text-center">
                      Once the buyer confirms they received the items, funds will be instantly released to your balance.
                    </div>
                  </div>
                )
              )}

              {/* STATUS: DISPUTED */}
              {tx.status === 'disputed' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-400 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Arbitration Dispute Open
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      The buyer raised a dispute. Lindy AI is evaluating the transaction logs and chat messages to resolve the escrow.
                    </p>
                  </div>
                  
                  {/* Lindy AI Verdict display and execution actions */}
                  <ArbitrationAnalyzer orderId={tx.id} />
                </div>
              )}

              {/* STATUS: COMPLETED */}
              {tx.status === 'completed' && (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-zinc-400 leading-relaxed text-center space-y-3 py-6">
                  <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Escrow Released & Completed</p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {isBuyer 
                        ? 'You confirmed delivery. The transaction is complete.' 
                        : 'The buyer confirmed delivery. Funds have been released to your balance.'}
                    </p>
                  </div>
                </div>
              )}

              {/* STATUS: CANCELED */}
              {tx.status === 'canceled' && (
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-zinc-400 leading-relaxed text-center space-y-2 py-6">
                  <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
                  <div>
                    <p className="font-semibold text-white">Order Canceled</p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      This transaction has been resolved by arbitration/support. The funds have been refunded to the buyer.
                    </p>
                  </div>
                </div>
              )}

            </CardContent>
            
            <CardFooter className="p-5 border-t border-white/5 text-[9px] text-zinc-500 text-center leading-normal">
              Need assistance? Support team can review this transaction chat ID **{tx.id.substring(0, 8)}** anytime.
            </CardFooter>
          </Card>

        </div>

      </div>

    </div>
  )
}
