
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import ReviewCard from '@/components/reviews/ReviewCard';

interface Review {
  id: string;
  client_id: string;
  therapist_id: string;
  rating: number;
  comment: string;
  created_at: string;
  client_name: string;
}

const TherapistReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            id,
            client_id,
            therapist_id,
            rating,
            comment,
            created_at
          `)
          .eq('therapist_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get client names for reviews
        const reviewsWithClientNames = await Promise.all(
          (data || []).map(async (review) => {
            const { data: clientData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', review.client_id)
              .single();
            
            return {
              ...review,
              client_name: clientData?.full_name || 'Anonymous Client'
            };
          })
        );

        setReviews(reviewsWithClientNames);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast({
          title: 'Error',
          description: 'Failed to load reviews',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [user, toast]);

  // Function to render stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
        />
      );
    }
    return stars;
  };

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading reviews...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Reviews</h1>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-medium">{averageRating.toFixed(1)}</span>
          <div className="flex">{renderStars(Math.round(averageRating))}</div>
          <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-lg text-muted-foreground">You haven't received any reviews yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              id={review.id}
              clientName={review.client_name}
              rating={review.rating}
              comment={review.comment}
              date={new Date(review.created_at).toLocaleDateString()}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TherapistReviews;
