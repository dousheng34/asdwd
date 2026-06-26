'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileImage, Loader2, ShieldCheck, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/lib/i18n'

interface PaymentUploadFormProps {
  orderId: string;
  onPaymentSubmitted?: (receiptUrl: string) => void;
}

export default function PaymentUploadForm({ orderId, onPaymentSubmitted }: PaymentUploadFormProps) {
  const supabase = createClient()
  const { t } = useTranslation()
  const pt = t('payment')

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, JPEG).')
        setFile(null)
        return
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be under 5MB.')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handlePaymentConfirm = async () => {
    if (!file) {
      setError('Please select a receipt screenshot first.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Upload screenshot to Supabase Storage bucket 'receipts'
      const fileExt = file.name.split('.').pop()
      const fileName = `${orderId}_${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`

      // Create receipts bucket if it doesn't exist
      try {
        await supabase.storage.createBucket('receipts', { public: true })
      } catch (bucketErr) {
        // Safe to ignore
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw new Error(`Failed to upload file to Supabase: ${uploadError.message}`)
      }

      // 2. Retrieve public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Could not get public URL for receipt.')
      }

      const receiptImageUrl = urlData.publicUrl

      // 3. Update transactions table (delivery_proof = JSON, status = 'escrow')
      const deliveryProofJson = JSON.stringify({
        receipt_image_url: receiptImageUrl
      })

      const { error: dbError } = await supabase
        .from('transactions')
        .update({
          delivery_proof: deliveryProofJson,
          status: 'escrow'
        })
        .eq('id', orderId)

      if (dbError) {
        throw new Error(`Failed to update transaction in database: ${dbError.message}`)
      }

      setPublicUrl(receiptImageUrl)
      setSuccess(true)
      if (onPaymentSubmitted) {
        onPaymentSubmitted(receiptImageUrl)
      }
    } catch (err: any) {
      console.error('Payment upload error:', err)
      setError(err.message || 'An error occurred while uploading payment verification.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900/40 border-white/5 shadow-xl overflow-hidden">
      <CardHeader className="p-5 border-b border-white/5 bg-zinc-900/20">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          {pt.title}
        </CardTitle>
        <CardDescription className="text-[11px] text-zinc-500">
          {pt.desc}
        </CardDescription>
      </CardHeader>

      {success ? (
        <CardContent className="p-6 text-center space-y-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="text-xs font-semibold text-zinc-200">{t('common').success}</h3>
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
            {pt.success}
          </p>
          {publicUrl && (
            <div className="mt-2 text-[10px]">
              <a 
                href={publicUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-primary hover:underline font-mono"
              >
                View uploaded receipt
              </a>
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-300">{pt.uploadLabel}</Label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-white/10 hover:border-primary/40 rounded-lg cursor-pointer bg-zinc-950/20 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <FileImage className="h-7 w-7 text-primary mb-2" />
                      <p className="text-xs font-medium text-zinc-300 truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-1">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-7 w-7 text-zinc-500 mb-2" />
                      <p className="text-xs text-zinc-400 font-semibold">{pt.chooseFile}</p>
                      <p className="text-[9px] text-zinc-500 mt-1">PNG, JPG or JPEG (max. 5MB)</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        </CardContent>
      )}

      {!success && (
        <CardFooter className="p-5 pt-0 border-t border-white/5 mt-4 flex justify-end">
          <Button
            onClick={handlePaymentConfirm}
            disabled={loading || !file}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-10 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {pt.submitting}
              </>
            ) : (
              pt.submitBtn
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
