import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  Car, Booking, UserProfile, Review, PromoCode,
  BlogPost, Subscriber, StripeConfiguration, ShoppingItem
} from '../backend';
import type { Principal } from '@dfinity/principal';

// ── User Profile ──────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetAllUserProfiles() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[Principal, UserProfile][]>({
    queryKey: ['allUserProfiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserProfiles() as unknown as [Principal, UserProfile][];
    },
    enabled: !!actor && !actorFetching,
  });
}

// ── Admin Check ───────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

// ── Cars ──────────────────────────────────────────────────────────────────

export function useGetCars() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Car[]>({
    queryKey: ['cars'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCars();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCar(carId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Car>({
    queryKey: ['car', carId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCar(carId);
    },
    enabled: !!actor && !actorFetching && !!carId,
  });
}

export function useAddCar() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (car: Car) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addCar(car);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
}

export function useUpdateCar() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, car }: { id: string; car: Car }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateCar(id, car);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
}

export function useDeleteCar() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (carId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteCar(carId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
}

// ── Bookings ──────────────────────────────────────────────────────────────

export function useGetAllBookings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Booking[]>({
    queryKey: ['allBookings'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBookings();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetUserBookings(userId?: Principal) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Booking[]>({
    queryKey: ['userBookings', userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getUserBookings(userId);
    },
    enabled: !!actor && !actorFetching && !!userId,
  });
}

export function useAddBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: Booking) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addBooking(booking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateBookingStatus(bookingId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ── Reviews ───────────────────────────────────────────────────────────────

export function useGetReviewsForCar(carId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Review[]>({
    queryKey: ['reviews', carId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReviewsForCar(carId);
    },
    enabled: !!actor && !actorFetching && !!carId,
  });
}

export function useAddReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: Review) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addReview(review);
    },
    onSuccess: (_, review) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', review.carId] });
    },
  });
}

export function useDeleteReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, carId }: { reviewId: string; carId: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteReview(reviewId);
    },
    onSuccess: (_, { carId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', carId] });
    },
  });
}

// ── Promo Codes ───────────────────────────────────────────────────────────

export function useGetPromoCodes() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PromoCode[]>({
    queryKey: ['promoCodes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPromoCodes();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddPromoCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promoCode: PromoCode) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addPromoCode(promoCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
    },
  });
}

export function useUpdatePromoCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, promoCode }: { code: string; promoCode: PromoCode }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updatePromoCode(code, promoCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
    },
  });
}

export function useValidatePromoCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (code: string): Promise<PromoCode> => {
      if (!actor) throw new Error('Actor not available');
      return actor.validatePromoCode(code);
    },
  });
}

// ── Blog Posts ────────────────────────────────────────────────────────────

export function useGetBlogPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<BlogPost[]>({
    queryKey: ['blogPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBlogPosts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetBlogPost(postId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<BlogPost>({
    queryKey: ['blogPost', postId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBlogPost(postId);
    },
    enabled: !!actor && !actorFetching && !!postId,
  });
}

export function useAddBlogPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: BlogPost) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addBlogPost(post);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });
}

export function useUpdateBlogPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, post }: { id: string; post: BlogPost }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateBlogPost(id, post);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blogPost', id] });
    },
  });
}

export function useDeleteBlogPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteBlogPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });
}

// ── Newsletter ────────────────────────────────────────────────────────────

export function useSubscribeToNewsletter() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (subscriber: Subscriber) => {
      if (!actor) throw new Error('Actor not available');
      await actor.subscribeToNewsletter(subscriber);
    },
  });
}

export function useGetSubscribers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Subscriber[]>({
    queryKey: ['subscribers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSubscribers();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ── Stripe ────────────────────────────────────────────────────────────────

export function useIsStripeConfigured() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ items, successUrl, cancelUrl }: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCheckoutSession(items, successUrl, cancelUrl);
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) throw new Error('Stripe session missing url');
      return session;
    },
  });
}
