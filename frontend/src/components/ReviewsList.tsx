import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useGetReviewsForCar, useDeleteReview, useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Review } from '../backend';

interface Props {
  carId: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-gold fill-gold' : 'text-muted-foreground'}`} />
      ))}
    </div>
  );
}

export default function ReviewsList({ carId }: Props) {
  const { t } = useLanguage();
  const { data: reviews = [], isLoading } = useGetReviewsForCar(carId);
  const { data: isAdmin } = useIsCallerAdmin();
  const deleteMutation = useDeleteReview();

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
    : 0;

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteMutation.mutateAsync({ reviewId, carId });
      toast.success('Review deleted');
    } catch {
      toast.error(t.general.error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-20 bg-charcoal-mid" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-charcoal border border-border rounded-lg">
          <div className="text-center">
            <p className="text-3xl font-bold text-gold">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} />
            <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">{t.reviews.noReviews}</p>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="bg-charcoal border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StarRating rating={Number(review.rating)} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(Number(review.createdAt) / 1_000_000).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{review.reviewText}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {review.userId.toString().slice(0, 12)}...
                </p>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 h-7 w-7"
                  onClick={() => handleDelete(review.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
