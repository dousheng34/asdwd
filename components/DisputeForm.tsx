'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

/**
 * DisputeForm Component
 * Collects dispute information from buyers including:
 * - Buyer and seller details
 * - Item information
 * - Problem description
 * - Chat logs and evidence
 */
interface DisputeFormProps {
  onSubmit: (data: any) => void
}

export default function DisputeForm({ onSubmit }: DisputeFormProps) {
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerEmail: '',
    sellerName: '',
    itemName: '',
    itemValue: '',
    problemDescription: '',
    chatLog: '',
    evidenceScreenshots: [] as string[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Validate form data before submission
   * Ensures all required fields are filled
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.buyerName.trim()) newErrors.buyerName = 'Buyer name is required'
    if (!formData.buyerEmail.trim()) newErrors.buyerEmail = 'Email is required'
    if (!formData.sellerName.trim()) newErrors.sellerName = 'Seller name is required'
    if (!formData.itemName.trim()) newErrors.itemName = 'Item name is required'
    if (!formData.itemValue.trim()) newErrors.itemValue = 'Item value is required'
    if (!formData.problemDescription.trim()) newErrors.problemDescription = 'Problem description is required'
    if (!formData.chatLog.trim()) newErrors.chatLog = 'Chat log is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission
   * Validates data and calls parent onSubmit callback
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500))
      onSubmit(formData)
      // Reset form after successful submission
      setFormData({
        buyerName: '',
        buyerEmail: '',
        sellerName: '',
        itemName: '',
        itemValue: '',
        problemDescription: '',
        chatLog: '',
        evidenceScreenshots: []
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle input changes
   * Updates form state as user types
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Buyer Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Buyer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="buyerName">Your Name</Label>
            <Input
              id="buyerName"
              name="buyerName"
              value={formData.buyerName}
              onChange={handleInputChange}
              placeholder="Enter your name"
              className={errors.buyerName ? 'border-red-500' : ''}
            />
            {errors.buyerName && (
              <p className="text-sm text-red-500 mt-1">{errors.buyerName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="buyerEmail">Your Email</Label>
            <Input
              id="buyerEmail"
              name="buyerEmail"
              type="email"
              value={formData.buyerEmail}
              onChange={handleInputChange}
              placeholder="your@email.com"
              className={errors.buyerEmail ? 'border-red-500' : ''}
            />
            {errors.buyerEmail && (
              <p className="text-sm text-red-500 mt-1">{errors.buyerEmail}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seller Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Seller Information</h3>
        <div>
          <Label htmlFor="sellerName">Seller Name</Label>
          <Input
            id="sellerName"
            name="sellerName"
            value={formData.sellerName}
            onChange={handleInputChange}
            placeholder="Enter seller's name"
            className={errors.sellerName ? 'border-red-500' : ''}
          />
          {errors.sellerName && (
            <p className="text-sm text-red-500 mt-1">{errors.sellerName}</p>
          )}
        </div>
      </div>

      {/* Item Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Item Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              name="itemName"
              value={formData.itemName}
              onChange={handleInputChange}
              placeholder="e.g., Legendary Sword"
              className={errors.itemName ? 'border-red-500' : ''}
            />
            {errors.itemName && (
              <p className="text-sm text-red-500 mt-1">{errors.itemName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="itemValue">Item Value (USD)</Label>
            <Input
              id="itemValue"
              name="itemValue"
              type="number"
              value={formData.itemValue}
              onChange={handleInputChange}
              placeholder="0.00"
              className={errors.itemValue ? 'border-red-500' : ''}
            />
            {errors.itemValue && (
              <p className="text-sm text-red-500 mt-1">{errors.itemValue}</p>
            )}
          </div>
        </div>
      </div>

      {/* Problem Description Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Dispute Details</h3>
        <div>
          <Label htmlFor="problemDescription">What is the problem?</Label>
          <Textarea
            id="problemDescription"
            name="problemDescription"
            value={formData.problemDescription}
            onChange={handleInputChange}
            placeholder="Describe the issue with the transaction (e.g., seller didn't deliver the item, item was different from description, etc.)"
            rows={4}
            className={errors.problemDescription ? 'border-red-500' : ''}
          />
          {errors.problemDescription && (
            <p className="text-sm text-red-500 mt-1">{errors.problemDescription}</p>
          )}
        </div>
      </div>

      {/* Chat Log Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Evidence</h3>
        <div>
          <Label htmlFor="chatLog">Chat Log (Full Conversation)</Label>
          <Textarea
            id="chatLog"
            name="chatLog"
            value={formData.chatLog}
            onChange={handleInputChange}
            placeholder="Paste the complete chat conversation between you and the seller here..."
            rows={6}
            className={errors.chatLog ? 'border-red-500' : ''}
          />
          {errors.chatLog && (
            <p className="text-sm text-red-500 mt-1">{errors.chatLog}</p>
          )}
          <p className="text-xs text-slate-500 mt-2">
            Include timestamps and all relevant messages
          </p>
        </div>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">How Arbitration Works</p>
              <p>
                Our system analyzes the chat logs and evidence to determine if the seller fulfilled their obligations. 
                We'll issue a verdict of either <strong>PAYOUT</strong> (seller fulfilled) or <strong>REFUND</strong> (seller didn't fulfill).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Dispute for Arbitration'}
      </Button>
    </form>
  )
}
