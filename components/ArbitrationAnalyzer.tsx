'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Scale, CheckCircle, AlertTriangle, ShieldCheck, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ArbitrationAnalyzerProps {
  orderId: string;
  initialVerdict?: any;
}

export default function ArbitrationAnalyzer({ orderId, initialVerdict }: ArbitrationAnalyzerProps) {
  const supabase = createClient()
  const [verdict, setVerdict] = useState<any>(initialVerdict || null)
  const [loading, setLoading] = useState(!initialVerdict)
  const [executingAction, setExecutingAction] = useState(false)
  const [executedMessage, setExecutedMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchVerdict = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('delivery_proof, status')
        .eq('id', orderId)
        .single()

      if (fetchError) throw fetchError

      if (data?.delivery_proof) {
        try {
          const parsedProof = JSON.parse(data.delivery_proof)
          if (parsedProof.arbitration_verdict) {
            setVerdict(parsedProof.arbitration_verdict)
          } else {
            setVerdict(null)
          }
        } catch (e) {
          setVerdict(null)
        }
      } else {
        setVerdict(null)
      }
      
      // If the transaction status is already canceled or completed, set the executed message
      if (data?.status === 'canceled') {
        setExecutedMessage('Arbitration complete: Order cancelled and funds successfully refunded to the buyer.')
      } else if (data?.status === 'completed') {
        setExecutedMessage('Arbitration complete: Order confirmed and escrow funds released to the seller.')
      }
    } catch (err: any) {
      console.error('Error fetching verdict:', err)
      setError('No verdict found yet or failed to connect to database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialVerdict) {
      fetchVerdict()
    }
  }, [orderId])

  const handleExecuteResolution = async (resolution: 'refund' | 'release') => {
    setExecutingAction(true)
    setError(null)

    try {
      // Execute transaction release/refund in the database
      const finalStatus = resolution === 'refund' ? 'canceled' : 'completed'
      
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: finalStatus })
        .eq('id', orderId)

      if (updateError) throw updateError

      setExecutedMessage(
        resolution === 'refund' 
          ? 'Arbitration complete: Order cancelled and funds successfully refunded to the buyer.'
          : 'Arbitration complete: Order confirmed and escrow funds released to the seller.'
      )
    } catch (err: any) {
      console.error('Resolution execution error:', err)
      setError(`Failed to apply resolution: ${err.message}`)
    } finally {
      setExecutingAction(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900/40 border-white/5 p-8 text-center space-y-4">
        <Scale className="h-8 w-8 text-primary animate-bounce mx-auto" />
        <p className="text-xs text-zinc-400">Consulting Lindy AI Arbitration model...</p>
      </Card>
    )
  }

  if (error || !verdict) {
    return (
      <Card className="bg-zinc-900/40 border-white/5 p-6 text-center space-y-4">
        <AlertTriangle className="h-7 w-7 text-zinc-500 mx-auto" />
        <div>
          <h3 className="text-xs font-semibold text-zinc-300">No Arbitration Verdict Available</h3>
          <p className="text-[10px] text-zinc-500 mt-1">
            Wait for Lindy AI to complete analyzing the dispute context or retry.
          </p>
        </div>
        <Button onClick={fetchVerdict} variant="outline" size="sm" className="h-8 text-[10px] border-white/10 mx-auto gap-1">
          <RefreshCcw className="h-3 w-3" /> Retry Check
        </Button>
      </Card>
    )
  }

  // Lindy AI Verdict parameters mapping
  const resolution = verdict.verdict === 'REFUND' ? 'refund' : 'release'
  const confidence = verdict.confidence || 90
  const reasoning = Array.isArray(verdict.reasoning) 
    ? verdict.reasoning 
    : [verdict.reasoning || 'No details reasoning provided by arbitration system.']

  return (
    <Card className="bg-zinc-900/40 border-white/5 shadow-xl overflow-hidden">
      <CardHeader className="p-5 border-b border-white/5 bg-zinc-900/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Lindy AI Arbitration Report
          </CardTitle>
          <span className="text-[10px] font-mono font-semibold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
            CONFIDENCE: {confidence}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        
        {/* Recommendation Badge */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-2">
          <div className="text-[10px] text-zinc-500 font-semibold">RECOMMENDED RESOLUTION</div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-white uppercase tracking-wide">
              {resolution === 'refund' ? 'Refund Buyer' : 'Release Funds to Seller'}
            </span>
          </div>
        </div>

        {/* Reasoning Points */}
        <div className="space-y-2">
          <div className="text-[10px] text-zinc-500 font-semibold uppercase">Decision Reasoning</div>
          <ul className="space-y-2">
            {reasoning.map((point: string, i: number) => (
              <li key={i} className="text-xs text-zinc-400 flex items-start gap-2 leading-relaxed">
                <span className="text-primary mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {executedMessage && (
          <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2">
            <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{executedMessage}</span>
          </div>
        )}

      </CardContent>

      {!executedMessage && (
        <CardFooter className="p-5 pt-0 border-t border-white/5 mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => handleExecuteResolution('refund')}
            disabled={executingAction}
            variant="outline"
            className="w-full sm:w-1/2 border-white/10 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 text-zinc-300 font-semibold text-xs h-9"
          >
            Execute Refund
          </Button>
          <Button
            onClick={() => handleExecuteResolution('release')}
            disabled={executingAction}
            className="w-full sm:w-1/2 bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-9 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            Execute Release
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
