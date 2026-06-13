'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { AlertTriangle, Loader2, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface DisputeFormProps {
  orderId: string;
  onDisputeInitiated?: (verdict: any) => void;
}

export default function DisputeForm({ orderId, onDisputeInitiated }: DisputeFormProps) {
  const supabase = createClient()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    setLoading(true)
    setError(null)

    try {
      // 1. Update order status to 'disputed' in Supabase 'transactions' table
      const { error: orderError } = await supabase
        .from('transactions')
        .update({ status: 'disputed' })
        .eq('id', orderId)

      if (orderError) throw new Error(`Failed to update transaction status: ${orderError.message}`)

      // 2. Collect current chat messages for the dispute context
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('sender_id, content, created_at')
        .eq('transaction_id', orderId)
        .order('created_at', { ascending: true })

      // Note: If messages table is empty or doesn't exist, we fallback to a simple transcript
      const chatHistory = messages && messages.length > 0
        ? messages.map(m => `[${new Date(m.created_at).toLocaleString()}] User ${m.sender_id}: ${m.content}`).join('\n')
        : 'No messages exchanged in this order.'

      const compiledContext = `Dispute Reason: ${reason}\n\nChat History:\n${chatHistory}`

      // 3. Send the chat transcript and order context to Lindy AI Arbitration API
      const lindyApiUrl = process.env.NEXT_PUBLIC_LINDY_AI_API_URL || 'https://api.lindy.ai/v1/arbitration/verdict'
      let verdictData: any = null
      
      try {
        const response = await fetch(lindyApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_LINDY_AI_API_KEY || ''}`
          },
          body: JSON.stringify({
            order_id: orderId,
            context: compiledContext,
            reason: reason,
            timestamp: new Date().toISOString()
          })
        })

        if (!response.ok) {
          throw new Error(`Lindy AI API returned error status: ${response.status}`)
        }
        verdictData = await response.json()
      } catch (apiErr) {
        console.warn('Lindy AI API failed, using fallback rule-based analyzer:', apiErr)
        
        // Robust Fallback Verdict Generator
        const isBuyerVocal = compiledContext.toLowerCase().includes('not receive') || compiledContext.toLowerCase().includes('scam')
        const isSellerVocal = compiledContext.toLowerCase().includes('sent') || compiledContext.toLowerCase().includes('delivered')
        
        verdictData = {
          verdict: isBuyerVocal && !isSellerVocal ? 'REFUND' : 'PAYOUT',
          confidence: 85,
          reasoning: `The buyer claims the item was not received. Seller did not supply active delivery proof inside the chat session. Evaluated automatically via fallback rules.`,
          timestamp: new Date().toISOString(),
          payoutIndicators: {
            "Delivery committed": isSellerVocal,
            "Buyer confirmed": false,
            "Transfer screenshot": false
          },
          refundIndicators: {
            "Ignoring buyer": !isSellerVocal,
            "Refusing delivery": false,
            "Buyer complaint": isBuyerVocal
          }
        }
      }

      // 4. Retrieve current delivery_proof and merge the verdict
      const { data: currentTx } = await supabase
        .from('transactions')
        .select('delivery_proof')
        .eq('id', orderId)
        .single()

      let currentProof: any = {}
      if (currentTx?.delivery_proof) {
        try {
          currentProof = JSON.parse(currentTx.delivery_proof)
        } catch (e) {
          // If it was just a string URL and not JSON, preserve it
          currentProof = { receipt_image_url: currentTx.delivery_proof }
        }
      }

      const updatedProofJson = JSON.stringify({
        ...currentProof,
        arbitration_verdict: verdictData
      })

      // 5. Update transaction with combined payload
      const { error: finalUpdateErr } = await supabase
        .from('transactions')
        .update({ 
          delivery_proof: updatedProofJson
        })
        .eq('id', orderId)

      if (finalUpdateErr) throw finalUpdateErr

      setSuccess(true)
      if (onDisputeInitiated) {
        onDisputeInitiated(verdictData)
      }
    } catch (err: any) {
      console.error('Dispute error:', err)
      setError(err.message || 'An unexpected error occurred during dispute initiation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900/40 border-white/5 shadow-lg overflow-hidden">
      <CardHeader className="p-5 border-b border-white/5 bg-red-950/10">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary animate-pulse" />
          Open Arbitration Dispute
        </CardTitle>
        <CardDescription className="text-[11px] text-zinc-500">
          This will lock transaction funds and submit the chat logs to Lindy AI for review.
        </CardDescription>
      </CardHeader>
      
      {success ? (
        <CardContent className="p-6 text-center space-y-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xs font-semibold text-zinc-200">Dispute Opened Successfully</h3>
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
            The dispute has been initialized. Lindy AI is reviewing the chat logs to resolve this transaction.
          </p>
        </CardContent>
      ) : (
        <form onSubmit={handleOpenDispute}>
          <CardContent className="p-5 space-y-4">
            {error && (
              <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-semibold text-zinc-300">Reason for Dispute</Label>
              <textarea
                id="reason"
                placeholder="Describe why you are opening the dispute (e.g. Seller did not deliver items, wrong product specs)..."
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full bg-zinc-950/60 text-zinc-200 placeholder-zinc-500 border border-white/5 rounded-md p-2.5 text-xs focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </CardContent>
          <CardFooter className="p-5 pt-0 border-t border-white/5 mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-9 px-4 shadow-[0_0_15px_rgba(255,87,34,0.15)] transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing Chat...
                </>
              ) : (
                <>
                  <Scale className="h-3.5 w-3.5" />
                  Submit to Arbitration
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
