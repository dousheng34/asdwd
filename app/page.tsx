'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, XCircle, FileText, MessageSquare, Image as ImageIcon } from 'lucide-react'
import DisputeForm from '@/components/DisputeForm'
import ArbitrationAnalyzer from '@/components/ArbitrationAnalyzer'
import VerdictDisplay from '@/components/VerdictDisplay'

/**
 * Main arbitration system page
 * Provides interface for submitting disputes and viewing arbitration verdicts
 */
export default function Home() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [selectedDispute, setSelectedDispute] = useState<any>(null)
  const [verdict, setVerdict] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('submit')

  /**
   * Handle new dispute submission
   * Stores dispute data and switches to analysis tab
   */
  const handleDisputeSubmit = (disputeData: any) => {
    const newDispute = {
      id: Date.now(),
      ...disputeData,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    }
    setDisputes([newDispute, ...disputes])
    setSelectedDispute(newDispute)
    setVerdict(null)
    setActiveTab('analyze')
  }

  /**
   * Handle arbitration verdict
   * Updates dispute status and displays verdict
   */
  const handleVerdictGenerated = (verdictData: any) => {
    setVerdict(verdictData)
    if (selectedDispute) {
      setSelectedDispute({
        ...selectedDispute,
        status: 'resolved',
        verdict: verdictData
      })
    }
    setActiveTab('verdict')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Game Exchange Arbitration System
          </h1>
          <p className="text-lg text-slate-600">
            Independent dispute resolution for game item trades
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Disputes</p>
                  <p className="text-3xl font-bold text-slate-900">{disputes.length}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Resolved</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {disputes.filter(d => d.status === 'resolved').length}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {disputes.filter(d => d.status === 'pending').length}
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="submit">Submit Dispute</TabsTrigger>
            <TabsTrigger value="analyze" disabled={!selectedDispute}>
              Analyze Evidence
            </TabsTrigger>
            <TabsTrigger value="verdict" disabled={!verdict}>
              View Verdict
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Submit Dispute */}
          <TabsContent value="submit">
            <Card>
              <CardHeader>
                <CardTitle>Submit a New Dispute</CardTitle>
                <CardDescription>
                  Provide details about your dispute with the seller
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DisputeForm onSubmit={handleDisputeSubmit} />
              </CardContent>
            </Card>

            {/* Recent Disputes List */}
            {disputes.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Recent Disputes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {disputes.map((dispute) => (
                      <div
                        key={dispute.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition"
                        onClick={() => {
                          setSelectedDispute(dispute)
                          setActiveTab('analyze')
                        }}
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{dispute.buyerName}</p>
                          <p className="text-sm text-slate-600">{dispute.itemName}</p>
                        </div>
                        <Badge
                          variant={dispute.status === 'resolved' ? 'default' : 'secondary'}
                        >
                          {dispute.status === 'resolved' ? 'Resolved' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Analyze Evidence */}
          <TabsContent value="analyze">
            {selectedDispute && (
              <ArbitrationAnalyzer
                dispute={selectedDispute}
                onVerdictGenerated={handleVerdictGenerated}
              />
            )}
          </TabsContent>

          {/* Tab 3: View Verdict */}
          <TabsContent value="verdict">
            {verdict && <VerdictDisplay verdict={verdict} dispute={selectedDispute} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
