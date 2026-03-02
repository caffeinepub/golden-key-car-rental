import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAddReview } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Props {
  carId: string;
  hasCompletedBooking: boolean;
}

export default function ReviewForm({ carId, hasCompletedBooking }: Props) {
  const { t } = useLanguage();
  const { identity } = useInternetIdentity();
  const addReviewMutation = useAddReview();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!identity) {
    return (
      <p className="text-sm text-muted-foreground text-center py-3 border border-border rounded-lg">
        {t.reviews.loginToReview}
      </p>
    );
  }

  if (!hasCompletedBooking) {
    return (
      <p className="text-sm text-muted-foreground text-center py-3 border border-border rounded-lg">
        {t.reviews.mustComplete}
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !comment.trim()) return;
    try {
      await addReviewMutation.mutateAsync({
        id: `review_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        carId,
        userId: identity.getPrincipal(),
        rating: BigInt(rating),
        reviewText: comment,
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
      });
      toast.success('Review submitted!');
      setRating(0);
      setComment('');
    } catch {
      toast.error(t.general.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-charcoal border border-border rounded-lg p-4 space-y-3">
      <h4 className="font-medium text-foreground text-sm">{t.reviews.writeReview}</h4>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(i)}
          >
            <Star className={`w-6 h-6 transition-colors ${i <= (hoverRating || rating) ? 'text-gold fill-gold' : 'text-muted-foreground'}`} />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t.reviews.commentPlaceholder}
        className="bg-charcoal-mid border-border text-foreground placeholder:text-muted-foreground resize-none"
        rows={3}
      />
      <Button
        type="submit"
        disabled={!rating || !comment.trim() || addReviewMutation.isPending}
        className="bg-gold text-deep-black hover:bg-gold-light font-semibold"
        size="sm"
      >
        {addReviewMutation.isPending ? t.reviews.submitting : t.reviews.submit}
      </Button>
    </form>
  );
}
