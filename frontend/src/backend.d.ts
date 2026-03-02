import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Review {
    id: string;
    carId: string;
    userId: Principal;
    createdAt: Time;
    reviewText: string;
    rating: bigint;
}
export interface Car {
    id: string;
    featureTags: Array<string>;
    model: string;
    dailyRate: number;
    make: string;
    year: bigint;
    seatCount: bigint;
    isAvailable: boolean;
    description: string;
    transmission: string;
    fuelType: string;
    category: string;
    location: string;
    images: Array<ExternalBlob>;
}
export interface BlogPost {
    id: string;
    title: string;
    content: string;
    isPublished: boolean;
    publishDate: Time;
    coverImage?: ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface PromoCode {
    discountValue: number;
    expiryDate: Time;
    code: string;
    discountType: string;
    isActive: boolean;
    usageLimit?: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Notification {
    id: string;
    userId: Principal;
    notificationType: string;
    createdAt: Time;
    isRead: boolean;
    message: string;
}
export interface Subscriber {
    subscribedAt: Time;
    name: string;
    email: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface Booking {
    id: string;
    paymentStatus: string;
    endDate: Time;
    carId: string;
    userId: Principal;
    createdAt: Time;
    promoCode?: string;
    updatedAt: Time;
    bookingStatus: string;
    currency: string;
    addOns: Array<string>;
    totalPrice: number;
    startDate: Time;
}
export interface UserProfile {
    preferredLanguage: string;
    preferredCurrency: string;
    name: string;
    email: string;
    phone: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Admin only: create a blog post.
     */
    addBlogPost(post: BlogPost): Promise<void>;
    /**
     * / Authenticated users only: create a booking.
     * / The booking's userId must match the caller.
     */
    addBooking(booking: Booking): Promise<void>;
    /**
     * / Admin only: create a car record.
     */
    addCar(car: Car): Promise<void>;
    /**
     * / Admin only: create a promo code.
     */
    addPromoCode(promoCode: PromoCode): Promise<void>;
    /**
     * / Authenticated users only: submit a review.
     * / The review's userId must match the caller.
     */
    addReview(review: Review): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    /**
     * / Admin only: delete a blog post.
     */
    deleteBlogPost(id: string): Promise<void>;
    /**
     * / Admin only: delete a car record.
     */
    deleteCar(id: string): Promise<void>;
    /**
     * / Admin only: delete an inappropriate review.
     */
    deleteReview(reviewId: string): Promise<void>;
    /**
     * / Admin only: list all user profiles.
     */
    getAllUserProfiles(): Promise<Array<[Principal, UserProfile]>>;
    /**
     * / Public: get a single blog post (published); admin can also see drafts.
     */
    getBlogPost(id: string): Promise<BlogPost>;
    /**
     * / Public: list all published blog posts.
     */
    getBlogPosts(): Promise<Array<BlogPost>>;
    /**
     * / Admin only: view all bookings.
     */
    getBookings(): Promise<Array<Booking>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Public: anyone can view a single car.
     */
    getCar(id: string): Promise<Car>;
    /**
     * / Public: anyone can browse the car catalogue.
     */
    getCars(): Promise<Array<Car>>;
    /**
     * / Authenticated user: view own notifications; admin: view any user's notifications.
     */
    getNotifications(userId: Principal): Promise<Array<Notification>>;
    /**
     * / Admin only: list all promo codes.
     */
    getPromoCodes(): Promise<Array<PromoCode>>;
    /**
     * / Public: anyone can read reviews for a car.
     */
    getReviewsForCar(carId: string): Promise<Array<Review>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    /**
     * / Admin only: view all newsletter subscribers.
     */
    getSubscribers(): Promise<Array<Subscriber>>;
    /**
     * / Authenticated user: view own bookings; admin: view any user's bookings.
     */
    getUserBookings(userId: Principal): Promise<Array<Booking>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    /**
     * / Authenticated user: mark own notification as read; admin: mark any.
     */
    markNotificationAsRead(userId: Principal, notificationId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    /**
     * / Public: anyone can subscribe to the newsletter.
     */
    subscribeToNewsletter(subscriber: Subscriber): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    /**
     * / Admin only: update a blog post.
     */
    updateBlogPost(id: string, updated: BlogPost): Promise<void>;
    /**
     * / Admin only: update booking status and notify the user.
     */
    updateBookingStatus(bookingId: string, newStatus: string): Promise<void>;
    /**
     * / Admin only: update a car record.
     */
    updateCar(id: string, updatedCar: Car): Promise<void>;
    /**
     * / Admin only: update a promo code.
     */
    updatePromoCode(code: string, updated: PromoCode): Promise<void>;
    /**
     * / Authenticated users: validate and retrieve a promo code at checkout.
     */
    validatePromoCode(code: string): Promise<PromoCode>;
}
