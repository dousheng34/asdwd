'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ThumbsUp, ThumbsDown, Loader2, Star, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'

interface ReviewFormProps {
  transactionId: string;
  sellerId: string;
  buyerId: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ transactionId, sellerId, buyerId, onReviewSubmitted }: ReviewFormProps) {
  const supabase = createClient()
  const { t } = useTranslation()
  const rt = t('reviews')

  const [rating, setRating] = useState<number | null>(null) // 5 = positive, 1 = negative
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === null) {
      setError('Please select a recommendation (Thumbs Up or Thumbs Down).')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Insert review into reviews table
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          transaction_id: transactionId,
          seller_id: sellerId,
          buyer_id: buyerId,
          rating: rating,
          comment: comment.trim() || null
        })

      if (reviewError) throw reviewError

      // 2. Fetch all reviews for this seller to calculate the new average rating
      const { data: allReviews, error: fetchError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', sellerId)

      if (!fetchError && allReviews && allReviews.length > 0) {
        const sum = allReviews.reduce((acc, r) => acc + r.rating, 0)
        const newAverage = sum / allReviews.length

        // 3. Update profiles table with the new average rating
        await supabase
          .from('profiles')
          .update({ rating: newAverage })
          .eq('id', sellerId)
      }

      // 4. Send a system notification in the transaction chat
      const ratingText = rating === 5 ? '👍 Positive / Оң / Положительный' : '👎 Negative / Теріс / Отрицательный'
      const commentString = comment.trim() ? ` - "${comment.trim()}"` : ''
      await supabase.from('messages').insert({
        transaction_id: transactionId,
        sender_id: buyerId,
        recipient_id: sellerId,
        content: `[System Notification: Buyer left a review: ${ratingText}${commentString}]`
      })

      setSuccess(true)
      if (onReviewSubmitted) {
        onReviewSubmitted()
      }
    } catch (err: any) {
      console.error('Submit review error:', err)
      setError(err.message || 'Failed to submit review.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="bg-zinc-900/40 border-white/5 p-6 text-center space-y-3">
        <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
        </div>
        <h3 className="text-xs font-semibold text-zinc-200">{rt.reviewSuccess}</h3>
        <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
          Feedback saved and seller rating updated.
        </p>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900/40 border-white/5 shadow-lg overflow-hidden">
      <CardHeader className="p-5 border-b border-white/5 bg-zinc-900/30">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Star className="h-4 w-4 text-primary" /> {rt.writeReviewTitle}
        </CardTitle>
        <CardDescription className="text-[10px] text-zinc-500">
          {rt.writeReviewDesc}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmitReview}>
        <CardContent className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
              {error}
            </div>
          )}

          {/* Rating Choice (Thumbs Up/Down like Playerok) */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{rt.ratingLabel}</Label>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setRating(5)}
                className={`flex-1 py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  rating === 5
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.08)]'
                    : 'bg-zinc-950/20 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                }`}
              >
                <ThumbsUp className="h-4 w-4" /> {rt.ratingPositive}
              </button>
              <button
                type="button"
                onClick={() => setRating(1)}
                className={`flex-1 py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  rating === 1
                    ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.08)]'
                    : 'bg-zinc-950/20 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                }`}
              >
                <ThumbsDown className="h-4 w-4" /> {rt.ratingNegative}
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{rt.commentLabel}</Label>
            <textarea
              id="comment"
              placeholder={rt.commentPlaceholder}
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-zinc-950/60 text-zinc-200 placeholder-zinc-500 border border-white/5 rounded-md p-2.5 text-xs focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0 border-t border-white/5 mt-4 flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/95 text-white font-semibold text-xs h-9 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {rt.submitting}
              </>
            ) : (
              rt.submitBtn
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
