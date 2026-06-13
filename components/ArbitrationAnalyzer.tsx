'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { MessageSquare, Image as ImageIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

/**
 * ArbitrationAnalyzer Component
 * Analyzes dispute evidence (chat logs and screenshots) to determine verdict
 * 
 * Analysis Process:
 * 1. Parse chat log for key evidence
 * 2. Review seller's responses and commitments
 * 3. Check if seller fulfilled obligations
 * 4. Generate verdict: PAYOUT (fulfilled) or REFUND (not fulfilled)
 */
interface ArbitrationAnalyzerProps {
  dispute: any
  onVerdictGenerated: (verdict: any) => void
}

export default function ArbitrationAnalyzer({
  dispute,
  onVerdictGenerated
}: ArbitrationAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  /**
   * Analyze the dispute evidence
   * 
   * Key Analysis Points:
   * - Did seller acknowledge the order?
   * - Did seller commit to delivering the item?
   * - Did seller provide proof of delivery/transfer?
   * - Are there any signs of deception or non-fulfillment?
   * - What is the final status of the transaction?
   */
  const analyzeDispute = async () => {
    setIsAnalyzing(true)

    try {
      // Simulate AI analysis of chat logs
      // In production, this would use Claude or another LLM
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Parse chat log for key indicators
      const chatLog = dispute.chatLog.toLowerCase()
      
      // Evidence indicators for PAYOUT (seller fulfilled)
      const payoutIndicators = {
        sellerAcknowledged: chatLog.includes('confirm') || chatLog.includes('received') || chatLog.includes('got it'),
        sellerCommitted: chatLog.includes('will send') || chatLog.includes('sending') || chatLog.includes('delivered'),
        proofProvided: chatLog.includes('sent') || chatLog.includes('transferred') || chatLog.includes('complete'),
        buyerConfirmed: chatLog.includes('thank') || chatLog.includes('received') || chatLog.includes('perfect')
      }

      // Evidence indicators for REFUND (seller didn't fulfill)
      const refundIndicators = {
        sellerIgnored: !payoutIndicators.sellerAcknowledged,
        sellerRefused: chatLog.includes('cannot') || chatLog.includes('won\'t') || chatLog.includes('refuse'),
        noProof: !payoutIndicators.proofProvided,
        buyerComplained: chatLog.includes('where') || chatLog.includes('where is') || chatLog.includes('still waiting')
      }

      // Calculate verdict based on evidence
      const payoutScore = Object.values(payoutIndicators).filter(Boolean).length
      const refundScore = Object.values(refundIndicators).filter(Boolean).length

      const verdict = payoutScore > refundScore ? 'PAYOUT' : 'REFUND'

      // Generate detailed analysis
      const analysis = {
        verdict,
        confidence: Math.min(100, Math.max(60, 50 + Math.abs(payoutScore - refundScore) * 10)),
        payoutIndicators,
        refundIndicators,
        reasoning: generateReasoning(verdict, payoutIndicators, refundIndicators),
        timestamp: new Date().toISOString()
      }

      setAnalysisResults(analysis)
      onVerdictGenerated(analysis)
    } finally {
      setIsAnalyzing(false)
    }
  }

  /**
   * Generate human-readable reasoning for the verdict
   * Explains which evidence led to the decision
   */
  const generateReasoning = (
    verdict: string,
    payoutIndicators: any,
    refundIndicators: any
  ): string => {
    if (verdict === 'PAYOUT') {
      const reasons = []
      if (payoutIndicators.sellerAcknowledged) reasons.push('Seller acknowledged the order')
      if (payoutIndicators.sellerCommitted) reasons.push('Seller committed to delivery')
      if (payoutIndicators.proofProvided) reasons.push('Seller provided proof of fulfillment')
      if (payoutIndicators.buyerConfirmed) reasons.push('Buyer confirmed receipt')
      
      return `Based on the chat log analysis: ${reasons.join(', ')}. The evidence indicates the seller fulfilled their obligations.`
    } else {
      const reasons = []
      if (refundIndicators.sellerIgnored) reasons.push('Seller did not acknowledge the order')
      if (refundIndicators.sellerRefused) reasons.push('Seller refused to fulfill the order')
      if (refundIndicators.noProof) reasons.push('No proof of delivery or transfer provided')
      if (refundIndicators.buyerComplained) reasons.push('Buyer complained about non-delivery')
      
      return `Based on the chat log analysis: ${reasons.join(', ')}. The evidence indicates the seller did not fulfill their obligations.`
    }
  }

  return (
    <div className="space-y-6">
      {/* Dispute Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Dispute Summary</CardTitle>
          <CardDescription>Review the details before analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Buyer</p>
              <p className="font-semibold text-slate-900">{dispute.buyerName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Seller</p>
              <p className="font-semibold text-slate-900">{dispute.sellerName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Item</p>
              <p className="font-semibold text-slate-900">{dispute.itemName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Value</p>
              <p className="font-semibold text-slate-900">${dispute.itemValue}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">Problem</p>
            <p className="text-slate-900">{dispute.problemDescription}</p>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Review Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Review</CardTitle>
          <CardDescription>Chat logs and supporting evidence</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat Log
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Analysis
              </TabsTrigger>
            </TabsList>

            {/* Chat Log Tab */}
            <TabsContent value="chat" className="mt-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {dispute.chatLog}
                </pre>
              </div>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="mt-4">
              {analysisResults ? (
                <div className="space-y-4">
                  {/* Verdict Badge */}
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-lg px-4 py-2 ${
                        analysisResults.verdict === 'PAYOUT'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {analysisResults.verdict === 'PAYOUT' ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      {analysisResults.verdict}
                    </Badge>
                    <div>
                      <p className="text-sm text-slate-600">Confidence</p>
                      <p className="font-semibold text-slate-900">{analysisResults.confidence}%</p>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">{analysisResults.reasoning}</p>
                  </div>

                  {/* Evidence Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Fulfillment Indicators
                      </h4>
                      <ul className="space-y-2 text-sm text-green-800">
                        {Object.entries(analysisResults.payoutIndicators).map(([key, value]) => (
                          <li key={key} className="flex items-center gap-2">
                            {value ? '✓' : '✗'} {key.replace(/([A-Z])/g, ' $1').trim()}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Non-Fulfillment Indicators
                      </h4>
                      <ul className="space-y-2 text-sm text-red-800">
                        {Object.entries(analysisResults.refundIndicators).map(([key, value]) => (
                          <li key={key} className="flex items-center gap-2">
                            {value ? '✓' : '✗'} {key.replace(/([A-Z])/g, ' $1').trim()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-600 text-center py-8">
                  Click "Analyze Evidence" to generate analysis
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Analysis Button */}
      {!analysisResults && (
        <Button
          onClick={analyzeDispute}
          disabled={isAnalyzing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Analyzing Evidence...
            </>
          ) : (
            'Analyze Evidence & Generate Verdict'
          )}
        </Button>
      )}

      {/* Re-analyze Button */}
      {analysisResults && (
        <Button
          onClick={() => {
            setAnalysisResults(null)
          }}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Re-analyze Evidence
        </Button>
      )}
    </div>
  )
}
