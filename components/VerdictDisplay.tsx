'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, FileText, Download, Share2 } from 'lucide-react'

/**
 * VerdictDisplay Component
 * Shows the final arbitration verdict and detailed reasoning
 * 
 * Displays:
 * - Final verdict (PAYOUT or REFUND)
 * - Confidence level
 * - Detailed reasoning
 * - Evidence summary
 * - Action items for both parties
 */
interface VerdictDisplayProps {
  verdict: any
  dispute: any
}

export default function VerdictDisplay({ verdict, dispute }: VerdictDisplayProps) {
  /**
   * Generate action items based on verdict
   * Tells each party what they need to do next
   */
  const getActionItems = () => {
    if (verdict.verdict === 'PAYOUT') {
      return {
        seller: [
          'Verdict is in your favor',
          'Buyer must complete payment',
          'Transaction is considered fulfilled'
        ],
        buyer: [
          'You must pay the seller',
          'Payment should be processed within 24 hours',
          'Confirm payment completion'
        ]
      }
    } else {
      return {
        seller: [
          'Verdict is against you',
          'You must refund the buyer',
          'Refund should be processed within 24 hours'
        ],
        buyer: [
          'Verdict is in your favor',
          'You will receive a refund',
          'Refund will be processed within 24 hours'
        ]
      }
    }
  }

  const actions = getActionItems()

  /**
   * Generate verdict report as text
   * Can be downloaded or shared
   */
  const generateReport = () => {
    const report = `
GAME EXCHANGE ARBITRATION VERDICT
==================================

Date: ${new Date(verdict.timestamp).toLocaleDateString()}
Dispute ID: ${dispute.id}

PARTIES:
--------
Buyer: ${dispute.buyerName}
Seller: ${dispute.sellerName}

ITEM DETAILS:
-------------
Item: ${dispute.itemName}
Value: $${dispute.itemValue}

VERDICT: ${verdict.verdict}
Confidence: ${verdict.confidence}%

REASONING:
----------
${verdict.reasoning}

EVIDENCE ANALYSIS:
------------------
Fulfillment Indicators:
${Object.entries(verdict.payoutIndicators)
  .map(([key, value]) => `  ${value ? '✓' : '✗'} ${key}`)
  .join('\n')}

Non-Fulfillment Indicators:
${Object.entries(verdict.refundIndicators)
  .map(([key, value]) => `  ${value ? '✓' : '✗'} ${key}`)
  .join('\n')}

ACTION ITEMS:
-------------
For Seller:
${actions.seller.map((item, i) => `  ${i + 1}. ${item}`).join('\n')}

For Buyer:
${actions.buyer.map((item, i) => `  ${i + 1}. ${item}`).join('\n')}

This verdict is binding and final.
    `.trim()

    return report
  }

  /**
   * Download verdict as text file
   */
  const downloadVerdict = () => {
    const report = generateReport()
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report))
    element.setAttribute('download', `verdict-${dispute.id}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  /**
   * Copy verdict to clipboard
   */
  const copyToClipboard = () => {
    const report = generateReport()
    navigator.clipboard.writeText(report)
    alert('Verdict copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Main Verdict Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">Arbitration Verdict</CardTitle>
              <CardDescription>Final binding decision</CardDescription>
            </div>
            <Badge
              className={`text-2xl px-6 py-3 ${
                verdict.verdict === 'PAYOUT'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-red-100 text-red-800 border-red-300'
              }`}
            >
              {verdict.verdict === 'PAYOUT' ? (
                <CheckCircle className="w-6 h-6 mr-2" />
              ) : (
                <XCircle className="w-6 h-6 mr-2" />
              )}
              {verdict.verdict}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confidence Meter */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-slate-700">Analysis Confidence</p>
              <p className="text-2xl font-bold text-slate-900">{verdict.confidence}%</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  verdict.verdict === 'PAYOUT' ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${verdict.confidence}%` }}
              />
            </div>
          </div>

          {/* Reasoning Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Reasoning</h3>
            <p className="text-blue-800 text-sm leading-relaxed">{verdict.reasoning}</p>
          </div>

          {/* Dispute Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Buyer</p>
              <p className="text-lg font-semibold text-slate-900">{dispute.buyerName}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Seller</p>
              <p className="text-lg font-semibold text-slate-900">{dispute.sellerName}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Item</p>
              <p className="text-lg font-semibold text-slate-900">{dispute.itemName}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Value</p>
              <p className="text-lg font-semibold text-slate-900">${dispute.itemValue}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Analysis</CardTitle>
          <CardDescription>Factors that influenced the verdict</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fulfillment Evidence */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Fulfillment Evidence
              </h3>
              <div className="space-y-2">
                {Object.entries(verdict.payoutIndicators).map(([key, value]) => (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      value
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        value ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                    >
                      {value ? '✓' : '✗'}
                    </div>
                    <span className={value ? 'text-green-900 font-medium' : 'text-slate-600'}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Fulfillment Evidence */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Non-Fulfillment Evidence
              </h3>
              <div className="space-y-2">
                {Object.entries(verdict.refundIndicators).map(([key, value]) => (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      value
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        value ? 'bg-red-500' : 'bg-slate-300'
                      }`}
                    >
                      {value ? '✓' : '✗'}
                    </div>
                    <span className={value ? 'text-red-900 font-medium' : 'text-slate-600'}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seller Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">For the Seller</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {actions.seller.map((action, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-slate-700">{action}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Buyer Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">For the Buyer</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {actions.buyer.map((action, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-slate-700">{action}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Verdict</CardTitle>
          <CardDescription>Download or share this verdict</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            onClick={downloadVerdict}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download as Text
          </Button>
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
        </CardContent>
      </Card>

      {/* Final Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-900">
            <strong>Important:</strong> This verdict is binding and final. Both parties must comply with the decision within 24 hours. 
            Failure to comply may result in account suspension or legal action.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
