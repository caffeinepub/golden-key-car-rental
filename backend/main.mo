import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import Stripe "stripe/stripe";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";

actor {
  public type Car = {
    id : Text;
    make : Text;
    model : Text;
    year : Nat;
    category : Text;
    dailyRate : Float;
    isAvailable : Bool;
    location : Text;
    images : [Storage.ExternalBlob];
    description : Text;
    fuelType : Text;
    transmission : Text;
    seatCount : Nat;
    featureTags : [Text];
  };

  public type Booking = {
    id : Text;
    carId : Text;
    userId : Principal;
    startDate : Time.Time;
    endDate : Time.Time;
    addOns : [Text];
    promoCode : ?Text;
    totalPrice : Float;
    currency : Text;
    paymentStatus : Text;
    bookingStatus : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
    preferredLanguage : Text;
    preferredCurrency : Text;
  };

  public type Review = {
    id : Text;
    carId : Text;
    userId : Principal;
    rating : Nat;
    reviewText : Text;
    createdAt : Time.Time;
  };

  public type PromoCode = {
    code : Text;
    discountType : Text;
    discountValue : Float;
    expiryDate : Time.Time;
    usageLimit : ?Nat;
    isActive : Bool;
  };

  public type Notification = {
    id : Text;
    userId : Principal;
    message : Text;
    notificationType : Text;
    createdAt : Time.Time;
    isRead : Bool;
  };

  public type BlogPost = {
    id : Text;
    title : Text;
    content : Text;
    coverImage : ?Storage.ExternalBlob;
    publishDate : Time.Time;
    isPublished : Bool;
  };

  public type Subscriber = {
    name : Text;
    email : Text;
    subscribedAt : Time.Time;
  };

  include MixinStorage();

  let cars = Map.empty<Text, Car>();
  let bookings = Map.empty<Text, Booking>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let reviews = Map.empty<Text, Review>();
  let promoCodes = Map.empty<Text, PromoCode>();
  let notifications = Map.empty<Principal, [Notification]>();
  let blogPosts = Map.empty<Text, BlogPost>();
  let subscribers = Map.empty<Text, Subscriber>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // ── User Profile ──────────────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can save their profile");
    };
    userProfiles.add(caller, profile);
  };

  // ── Cars (public reads, admin writes) ────────────────────────────────────

  /// Public: anyone can browse the car catalogue.
  public query func getCars() : async [Car] {
    cars.values().toArray();
  };

  /// Public: anyone can view a single car.
  public query func getCar(id : Text) : async Car {
    switch (cars.get(id)) {
      case (?car) { car };
      case (null) { Runtime.trap("Car not found") };
    };
  };

  /// Admin only: create a car record.
  public shared ({ caller }) func addCar(car : Car) : async () {
    requireAdmin(caller);
    cars.add(car.id, car);
  };

  /// Admin only: update a car record.
  public shared ({ caller }) func updateCar(id : Text, updatedCar : Car) : async () {
    requireAdmin(caller);
    switch (cars.get(id)) {
      case (?_) { cars.add(id, updatedCar) };
      case (null) { Runtime.trap("Car not found") };
    };
  };

  /// Admin only: delete a car record.
  public shared ({ caller }) func deleteCar(id : Text) : async () {
    requireAdmin(caller);
    switch (cars.get(id)) {
      case (?_) { cars.remove(id) };
      case (null) { Runtime.trap("Car not found") };
    };
  };

  // ── Bookings ──────────────────────────────────────────────────────────────

  /// Admin only: view all bookings.
  public query ({ caller }) func getBookings() : async [Booking] {
    requireAdmin(caller);
    bookings.values().toArray();
  };

  /// Authenticated user: view own bookings; admin: view any user's bookings.
  public query ({ caller }) func getUserBookings(userId : Principal) : async [Booking] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own bookings");
    };
    bookings.values().toArray().filter(func(booking : Booking) : Bool { booking.userId == userId });
  };

  /// Authenticated users only: create a booking.
  /// The booking's userId must match the caller.
  public shared ({ caller }) func addBooking(booking : Booking) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create bookings");
    };
    if (booking.userId != caller) {
      Runtime.trap("Unauthorized: Booking userId must match the caller");
    };

    bookings.add(booking.id, booking);

    let newNotification : Notification = {
      id = booking.id;
      userId = booking.userId;
      message = "Booking created successfully!";
      notificationType = "booking_created";
      createdAt = Time.now();
      isRead = false;
    };
    appendNotification(booking.userId, newNotification);
  };

  /// Admin only: update booking status and notify the user.
  public shared ({ caller }) func updateBookingStatus(bookingId : Text, newStatus : Text) : async () {
    requireAdmin(caller);
    switch (bookings.get(bookingId)) {
      case (?booking) {
        let updated : Booking = {
          booking with
          bookingStatus = newStatus;
          updatedAt = Time.now();
        };
        bookings.add(bookingId, updated);

        let msg = "Your booking status has been updated to: " # newStatus;
        let notif : Notification = {
          id = bookingId # "_status_" # Time.now().toText();
          userId = booking.userId;
          message = msg;
          notificationType = "booking_status";
          createdAt = Time.now();
          isRead = false;
        };
        appendNotification(booking.userId, notif);
      };
      case (null) { Runtime.trap("Booking not found") };
    };
  };

  // ── Reviews ───────────────────────────────────────────────────────────────

  /// Public: anyone can read reviews for a car.
  public query func getReviewsForCar(carId : Text) : async [Review] {
    reviews.values().toArray().filter(func(review : Review) : Bool { review.carId == carId });
  };

  /// Authenticated users only: submit a review.
  /// The review's userId must match the caller.
  public shared ({ caller }) func addReview(review : Review) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can submit reviews");
    };
    if (review.userId != caller) {
      Runtime.trap("Unauthorized: Review userId must match the caller");
    };
    reviews.add(review.id, review);
  };

  /// Admin only: delete an inappropriate review.
  public shared ({ caller }) func deleteReview(reviewId : Text) : async () {
    requireAdmin(caller);
    switch (reviews.get(reviewId)) {
      case (?_) { reviews.remove(reviewId) };
      case (null) { Runtime.trap("Review not found") };
    };
  };

  // ── Promo Codes ───────────────────────────────────────────────────────────

  /// Admin only: create a promo code.
  public shared ({ caller }) func addPromoCode(promoCode : PromoCode) : async () {
    requireAdmin(caller);
    promoCodes.add(promoCode.code, promoCode);
  };

  /// Admin only: update a promo code.
  public shared ({ caller }) func updatePromoCode(code : Text, updated : PromoCode) : async () {
    requireAdmin(caller);
    switch (promoCodes.get(code)) {
      case (?_) { promoCodes.add(code, updated) };
      case (null) { Runtime.trap("Promo code not found") };
    };
  };

  /// Admin only: list all promo codes.
  public query ({ caller }) func getPromoCodes() : async [PromoCode] {
    requireAdmin(caller);
    promoCodes.values().toArray();
  };

  /// Authenticated users: validate and retrieve a promo code at checkout.
  public query ({ caller }) func validatePromoCode(code : Text) : async PromoCode {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can validate promo codes");
    };
    switch (promoCodes.get(code)) {
      case (?promo) {
        if (not promo.isActive) { Runtime.trap("Promo code is not active") };
        if (promo.expiryDate < Time.now()) { Runtime.trap("Promo code has expired") };
        promo;
      };
      case (null) { Runtime.trap("Promo code not found") };
    };
  };

  // ── Notifications ─────────────────────────────────────────────────────────

  /// Authenticated user: view own notifications; admin: view any user's notifications.
  public query ({ caller }) func getNotifications(userId : Principal) : async [Notification] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own notifications");
    };
    switch (notifications.get(userId)) {
      case (?notifs) { notifs };
      case (null) { [] };
    };
  };

  /// Authenticated user: mark own notification as read; admin: mark any.
  public shared ({ caller }) func markNotificationAsRead(userId : Principal, notificationId : Text) : async () {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own notifications");
    };
    switch (notifications.get(userId)) {
      case (?notifs) {
        let updated = notifs.map(
          func(notif : Notification) : Notification {
            if (notif.id == notificationId) {
              { notif with isRead = true };
            } else {
              notif;
            };
          }
        );
        notifications.add(userId, updated);
      };
      case (null) { Runtime.trap("Notifications for user not found") };
    };
  };

  // ── Blog / CMS ────────────────────────────────────────────────────────────

  /// Public: list all published blog posts.
  public query func getBlogPosts() : async [BlogPost] {
    blogPosts.values().toArray().filter(func(post : BlogPost) : Bool { post.isPublished });
  };

  /// Public: get a single blog post (published); admin can also see drafts.
  public query ({ caller }) func getBlogPost(id : Text) : async BlogPost {
    switch (blogPosts.get(id)) {
      case (?post) {
        if (not post.isPublished and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Post is not published");
        };
        post;
      };
      case (null) { Runtime.trap("Blog post not found") };
    };
  };

  /// Admin only: create a blog post.
  public shared ({ caller }) func addBlogPost(post : BlogPost) : async () {
    requireAdmin(caller);
    blogPosts.add(post.id, post);
  };

  /// Admin only: update a blog post.
  public shared ({ caller }) func updateBlogPost(id : Text, updated : BlogPost) : async () {
    requireAdmin(caller);
    switch (blogPosts.get(id)) {
      case (?_) { blogPosts.add(id, updated) };
      case (null) { Runtime.trap("Blog post not found") };
    };
  };

  /// Admin only: delete a blog post.
  public shared ({ caller }) func deleteBlogPost(id : Text) : async () {
    requireAdmin(caller);
    switch (blogPosts.get(id)) {
      case (?_) { blogPosts.remove(id) };
      case (null) { Runtime.trap("Blog post not found") };
    };
  };

  // ── Newsletter ────────────────────────────────────────────────────────────

  /// Public: anyone can subscribe to the newsletter.
  public shared func subscribeToNewsletter(subscriber : Subscriber) : async () {
    subscribers.add(subscriber.email, subscriber);
  };

  /// Admin only: view all newsletter subscribers.
  public query ({ caller }) func getSubscribers() : async [Subscriber] {
    requireAdmin(caller);
    subscribers.values().toArray();
  };

  // ── Stripe Integration ────────────────────────────────────────────────────

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    requireAdmin(caller);
    stripeConfig := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ── Admin: User Management ────────────────────────────────────────────────

  /// Admin only: list all user profiles.
  public query ({ caller }) func getAllUserProfiles() : async [(Principal, UserProfile)] {
    requireAdmin(caller);
    userProfiles.entries().toArray();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  func requireAdmin(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  func appendNotification(userId : Principal, notif : Notification) {
    switch (notifications.get(userId)) {
      case (?existing) {
        notifications.add(userId, existing.concat([notif]));
      };
      case (null) {
        notifications.add(userId, [notif]);
      };
    };
  };
};
