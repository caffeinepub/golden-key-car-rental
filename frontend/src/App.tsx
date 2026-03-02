import React from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  Link,
} from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ProfileSetupModal from './components/ProfileSetupModal';
import HomePage from './pages/HomePage';
import CarListingsPage from './pages/CarListingsPage';
import CarDetailPage from './pages/CarDetailPage';
import BookingFlowPage from './pages/BookingFlowPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BlogListingPage from './pages/BlogListingPage';
import BlogDetailPage from './pages/BlogDetailPage';

function AppLayout() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <ProfileSetupModal open={showProfileSetup} onComplete={() => {}} />
      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: AppLayout,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="font-serif text-4xl font-bold text-gold">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Link to="/" className="text-gold hover:text-gold-light underline">Go Home</Link>
      </div>
    </div>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const carsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cars', component: CarListingsPage });
const carDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cars/$carId', component: CarDetailPage });
const bookingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/booking', component: BookingFlowPage });
const paymentSuccessRoute = createRoute({ getParentRoute: () => rootRoute, path: '/payment-success', component: PaymentSuccessPage });
const paymentFailureRoute = createRoute({ getParentRoute: () => rootRoute, path: '/payment-failure', component: PaymentFailurePage });
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: UserDashboardPage });
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminDashboardPage });
const blogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/blog', component: BlogListingPage });
const blogDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/blog/$postId', component: BlogDetailPage });

const routeTree = rootRoute.addChildren([
  indexRoute,
  carsRoute,
  carDetailRoute,
  bookingRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
  dashboardRoute,
  adminRoute,
  blogRoute,
  blogDetailRoute,
]);

const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
