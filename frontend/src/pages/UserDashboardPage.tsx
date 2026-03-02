import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { User, Calendar, FileText, XCircle, Bell } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetUserBookings, useSaveCallerUserProfile, useUpdateBookingStatus } from '../hooks/useQueries';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Booking } from '../backend';

type Tab = 'profile' | 'bookings' | 'invoices' | 'cancellations' | 'notifications';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  confirmed: 'bg-success/20 text-success border-success/30',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
  completed: 'bg-gold/20 text-gold border-gold/30',
};

function InvoiceView({ booking }: { booking: Booking }) {
  const { t } = useLanguage();
  const days = Math.max(1, Math.ceil((Number(booking.endDate) - Number(booking.startDate)) / (1_000_000 * 1000 * 60 * 60 * 24)));

  return (
    <div className="bg-charcoal border border-border rounded-lg p-6 print:bg-white print:text-black">
      <div className="flex items-center justify-between mb-6">
        <img src="/assets/generated/golden-key-logo.dim_400x120.png" alt="Golden Key" className="h-10 object-contain" />
        <div className="text-end">
          <h2 className="font-serif text-2xl font-bold text-gold print:text-yellow-600">{t.invoice.title}</h2>
          <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <Separator className="bg-gold/30 mb-4" />
      <div className="space-y-2 text-sm mb-6">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.invoice.bookingRef}:</span>
          <span className="font-mono text-foreground">{booking.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.invoice.rentalPeriod}:</span>
          <span className="text-foreground">
            {new Date(Number(booking.startDate) / 1_000_000).toLocaleDateString()} →{' '}
            {new Date(Number(booking.endDate) / 1_000_000).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.invoice.days}:</span>
          <span className="text-foreground">{days}</span>
        </div>
        {booking.addOns.length > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.invoice.addOns}:</span>
            <span className="text-foreground">{booking.addOns.join(', ')}</span>
          </div>
        )}
        {booking.promoCode && (
          <div className="flex justify-between text-success">
            <span>{t.invoice.promoDiscount}:</span>
            <span>{booking.promoCode}</span>
          </div>
        )}
        <Separator className="bg-border" />
        <div className="flex justify-between font-bold text-lg">
          <span className="text-foreground">{t.invoice.total}:</span>
          <span className="text-gold">{booking.currency} {booking.totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.invoice.paymentStatus}:</span>
          <span className="text-foreground capitalize">{booking.paymentStatus}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-6">{t.invoice.thankYou}</p>
      <div className="flex gap-3 mt-4 no-print">
        <Button onClick={() => window.print()} variant="outline" size="sm" className="border-border text-foreground hover:bg-charcoal-mid">
          {t.invoice.print}
        </Button>
      </div>
    </div>
  );
}

export default function UserDashboardPage() {
  const { t } = useLanguage();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [editingProfile, setEditingProfile] = useState(false);

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: bookings = [], isLoading: bookingsLoading } = useGetUserBookings(identity?.getPrincipal());
  const saveMutation = useSaveCallerUserProfile();
  const updateStatusMutation = useUpdateBookingStatus();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const [profileForm, setProfileForm] = useState({
    name: '', email: '', phone: '', preferredLanguage: 'en', preferredCurrency: 'USD',
  });

  React.useEffect(() => {
    if (userProfile) {
      setProfileForm({
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        preferredLanguage: userProfile.preferredLanguage,
        preferredCurrency: userProfile.preferredCurrency,
      });
    }
  }, [userProfile]);

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please login to access your dashboard.</p>
          <Button onClick={() => navigate({ to: '/' })} className="bg-gold text-deep-black">Go Home</Button>
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'upcoming') return b.bookingStatus === 'pending' || b.bookingStatus === 'confirmed';
    if (bookingFilter === 'past') return b.bookingStatus === 'completed';
    if (bookingFilter === 'cancelled') return b.bookingStatus === 'cancelled';
    return true;
  });

  const cancellableBookings = bookings.filter(b => b.bookingStatus === 'pending' || b.bookingStatus === 'confirmed');
  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  const handleSaveProfile = async () => {
    try {
      await saveMutation.mutateAsync(profileForm);
      toast.success(t.profile.saved);
      setEditingProfile(false);
    } catch {
      toast.error(t.general.error);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ bookingId, status: 'cancelled' });
      toast.success(t.cancellation.cancelled);
    } catch {
      toast.error(t.general.error);
    }
  };

  const navItems: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'profile', label: t.dashboard.profile, icon: User },
    { id: 'bookings', label: t.dashboard.bookings, icon: Calendar },
    { id: 'invoices', label: t.dashboard.invoices, icon: FileText },
    { id: 'cancellations', label: t.dashboard.cancellations, icon: XCircle },
    { id: 'notifications', label: t.dashboard.notifications, icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">{t.dashboard.title}</h1>
          {userProfile && (
            <p className="text-muted-foreground mt-1">{t.dashboard.welcome}, {userProfile.name}</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Nav */}
          <aside className="md:w-56 shrink-0">
            <nav className="bg-charcoal border border-border rounded-lg overflow-hidden">
              {navItems.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-border last:border-0 ${
                    activeTab === id ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:text-foreground hover:bg-charcoal-mid'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge !== undefined && badge > 0 && (
                    <Badge className="ms-auto h-5 w-5 p-0 flex items-center justify-center bg-gold text-deep-black text-xs">
                      {badge}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-charcoal border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-semibold text-foreground">{t.profile.title}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    {editingProfile ? t.general.cancel : t.profile.edit}
                  </Button>
                </div>
                {profileLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 bg-charcoal-mid" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { key: 'name', label: t.profile.name, type: 'text' },
                      { key: 'email', label: t.profile.email, type: 'email' },
                      { key: 'phone', label: t.profile.phone, type: 'tel' },
                    ].map(({ key, label, type }) => (
                      <div key={key}>
                        <Label className="text-muted-foreground text-xs">{label}</Label>
                        {editingProfile ? (
                          <Input
                            type={type}
                            value={(profileForm as any)[key]}
                            onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                            className="bg-charcoal-mid border-border mt-1"
                          />
                        ) : (
                          <p className="text-foreground mt-1">{(profileForm as any)[key] || '—'}</p>
                        )}
                      </div>
                    ))}
                    {editingProfile && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-muted-foreground text-xs">{t.profile.language}</Label>
                          <Select value={profileForm.preferredLanguage} onValueChange={v => setProfileForm(f => ({ ...f, preferredLanguage: v }))}>
                            <SelectTrigger className="bg-charcoal-mid border-border mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-charcoal border-border">
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="ar">العربية</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">{t.profile.currency}</Label>
                          <Select value={profileForm.preferredCurrency} onValueChange={v => setProfileForm(f => ({ ...f, preferredCurrency: v }))}>
                            <SelectTrigger className="bg-charcoal-mid border-border mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-charcoal border-border">
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="AED">AED</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    {editingProfile && (
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saveMutation.isPending}
                        className="bg-gold text-deep-black hover:bg-gold-light font-semibold"
                      >
                        {saveMutation.isPending ? t.general.loading : t.profile.save}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-charcoal border border-border rounded-lg p-6">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{t.bookings.title}</h2>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {['all', 'upcoming', 'past', 'cancelled'].map(f => (
                    <Button
                      key={f}
                      variant={bookingFilter === f ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBookingFilter(f)}
                      className={bookingFilter === f ? 'bg-gold text-deep-black' : 'border-border text-muted-foreground hover:text-foreground'}
                    >
                      {(t.bookings as any)[f]}
                    </Button>
                  ))}
                </div>
                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 bg-charcoal-mid" />)}
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <img src="/assets/generated/empty-state-icon.dim_256x256.png" alt="" className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground">{t.bookings.noBookings}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t.bookings.noBookingsDesc}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.map(booking => (
                      <div key={booking.id} className="bg-charcoal-mid border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-muted-foreground truncate">{booking.id}</p>
                            <p className="text-sm text-foreground mt-1">
                              {new Date(Number(booking.startDate) / 1_000_000).toLocaleDateString()} →{' '}
                              {new Date(Number(booking.endDate) / 1_000_000).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`text-xs border ${STATUS_COLORS[booking.bookingStatus] || ''}`}>
                              {(t.bookings as any)[booking.bookingStatus] || booking.bookingStatus}
                            </Badge>
                            <span className="font-bold text-gold text-sm">{booking.currency} {booking.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setSelectedBookingId(booking.id); setActiveTab('invoices'); }}
                            className="border-border text-muted-foreground hover:text-foreground text-xs h-7"
                          >
                            {t.bookings.viewInvoice}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="space-y-4">
                {!selectedBooking ? (
                  <div className="bg-charcoal border border-border rounded-lg p-6">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{t.dashboard.invoices}</h2>
                    {bookings.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">{t.bookings.noBookings}</p>
                    ) : (
                      <div className="space-y-2">
                        {bookings.map(b => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBookingId(b.id)}
                            className="w-full flex items-center justify-between p-3 bg-charcoal-mid rounded-lg hover:border-gold/30 border border-border transition-colors text-start"
                          >
                            <span className="font-mono text-xs text-muted-foreground truncate">{b.id}</span>
                            <span className="text-gold font-semibold text-sm shrink-0 ms-2">{b.currency} {b.totalPrice.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBookingId(null)}
                      className="mb-4 text-muted-foreground hover:text-gold"
                    >
                      ← Back to Invoices
                    </Button>
                    <InvoiceView booking={selectedBooking} />
                  </div>
                )}
              </div>
            )}

            {/* Cancellations Tab */}
            {activeTab === 'cancellations' && (
              <div className="bg-charcoal border border-border rounded-lg p-6">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-2">{t.cancellation.title}</h2>
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-warning">{t.cancellation.policy}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.cancellation.policyDesc}</p>
                </div>
                {cancellableBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t.cancellation.noCancellable}</p>
                ) : (
                  <div className="space-y-3">
                    {cancellableBookings.map(booking => (
                      <div key={booking.id} className="bg-charcoal-mid border border-border rounded-lg p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{booking.id}</p>
                          <p className="text-sm text-foreground mt-1">
                            {new Date(Number(booking.startDate) / 1_000_000).toLocaleDateString()} →{' '}
                            {new Date(Number(booking.endDate) / 1_000_000).toLocaleDateString()}
                          </p>
                          <Badge className={`text-xs border mt-1 ${STATUS_COLORS[booking.bookingStatus] || ''}`}>
                            {(t.bookings as any)[booking.bookingStatus] || booking.bookingStatus}
                          </Badge>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="shrink-0">
                              {t.cancellation.cancel}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-charcoal border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">{t.cancellation.confirm}</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">{t.cancellation.confirmDesc}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border text-foreground hover:bg-charcoal-mid">{t.cancellation.keep}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelBooking(booking.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t.cancellation.cancel}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-charcoal border border-border rounded-lg p-6">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{t.notifications.title}</h2>
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t.notifications.noNotifications}</p>
                ) : (
                  <div className="space-y-3">
                    {[...notifications].reverse().map(notif => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-lg border transition-colors ${notif.isRead ? 'bg-charcoal-mid border-border' : 'bg-gold/5 border-gold/30'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {!notif.isRead && (
                              <span className="inline-block w-2 h-2 rounded-full bg-gold me-2 align-middle" />
                            )}
                            <span className="text-sm text-foreground">{notif.message}</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(Number(notif.createdAt) / 1_000_000).toLocaleString()}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs text-muted-foreground hover:text-gold h-7 shrink-0"
                            >
                              {t.notifications.markRead}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
