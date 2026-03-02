# Specification

## Summary
**Goal:** Build the initial full-stack Golden Key Car Rental booking platform with a premium luxury theme, bilingual (EN/AR) support, car listings, booking flow with Stripe, user and admin dashboards, reviews, blog/CMS, promotions, notifications, and newsletter.

**Planned changes:**

### Visual Theme & Internationalization
- Apply deep charcoal/black + gold (#C9A84C) + white typography luxury theme across all pages and components
- Implement English/Arabic bilingual support with RTL layout switching via a header language toggle

### Backend Data Models & Logic (single Motoko actor)
- Car inventory model: make, model, year, category, daily rate, availability, location, images, bilingual description, fuel type, transmission, seat count, feature tags; full admin CRUD
- Booking model: booking ID, car ID, user ID, dates, add-ons, promo code, total price, currency, payment status, booking status, timestamps; user and admin query functions
- User profile model linked to Internet Identity principal: name, email, phone, preferred language, preferred currency
- Promo code model: code string, discount type (percentage/fixed), discount value, expiry date, usage limit, active status; validation at checkout
- Reviews model: star rating (1–5), text review, linked to completed bookings; per-car display and admin delete
- Blog/CMS model: bilingual title and body, cover image URL, publish date, published/draft status; admin CRUD
- Newsletter subscriber model: name, email, timestamp; duplicate rejection; admin view
- Notification log per user: event type, date, booking reference; triggered on booking created/confirmed/cancelled
- WhatsApp number configurable setting stored in backend
- In-app notification system (polling-based, no WebSockets)

### Frontend Pages & Components
- Public homepage with hero banner, fleet showcase, and CTA
- Car listings page: responsive grid cards (image, name, daily rate, key specs), search bar, filters (category, price range, transmission, seat count, location, availability dates)
- Car detail page: full info, real-time availability calendar (blocks booked dates), dynamic pricing calculator (dates, add-ons: child seat/additional driver/unlimited KM, promo code, multi-currency: USD/AED/EUR, early payment discount), reviews section
- Single-page booking flow with step indicators: personal details → add-ons confirmation → Stripe payment; confirmation screen with booking reference
- Internet Identity authentication; redirect unauthenticated users from protected routes
- User dashboard (sidebar/tab nav): Profile, Booking History, Invoice (printable/downloadable), Cancellation
- Admin dashboard (protected by principal): Car Management CRUD, Booking Management (status update, refunds), User Management, Promotions (promo codes), Analytics (revenue totals, booking counts, top cars charts)
- Blog listing page (published posts as cards) and blog post detail page (bilingual content)
- Footer newsletter signup form (name + email)
- Floating WhatsApp deep-link button (wa.me) on all public pages with pre-filled greeting

**User-visible outcome:** Visitors can browse and filter luxury rental cars, view detailed pages with live availability and pricing, complete a Stripe-powered booking, and manage bookings from a personal dashboard. Admins can manage cars, bookings, users, promotions, blog content, and analytics from a protected dashboard. The entire UI is available in English and Arabic (RTL).
