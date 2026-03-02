import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Car, Calendar, Users, Tag, BarChart2, FileText,
  CreditCard, MessageCircle, Mail, Plus, Edit, Trash2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter as ADF, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '../contexts/LanguageContext';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useIsCallerAdmin, useGetCars, useAddCar, useUpdateCar, useDeleteCar,
  useGetAllBookings, useUpdateBookingStatus, useGetAllUserProfiles,
  useGetPromoCodes, useAddPromoCode, useUpdatePromoCode,
  useGetBlogPosts, useAddBlogPost, useUpdateBlogPost, useDeleteBlogPost,
  useGetSubscribers, useIsStripeConfigured, useSetStripeConfiguration,
} from '../hooks/useQueries';
import AccessDeniedScreen from '../components/AccessDeniedScreen';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import type { Car as CarType, PromoCode, BlogPost } from '../backend';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

type AdminTab = 'cars' | 'bookings' | 'users' | 'promotions' | 'analytics' | 'blog' | 'stripe' | 'whatsapp' | 'subscribers';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  confirmed: 'bg-success/20 text-success border-success/30',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
  completed: 'bg-gold/20 text-gold border-gold/30',
};

const CHART_COLORS = ['#C9A84C', '#4CAF50', '#F44336', '#2196F3', '#9C27B0'];

function emptyCarForm() {
  return {
    id: '', make: '', model: '', year: BigInt(2024), category: 'Sedan',
    dailyRate: 100, isAvailable: true, location: '', description: '',
    fuelType: 'Petrol', transmission: 'Automatic', seatCount: BigInt(5),
    featureTags: [] as string[], images: [] as string[],
  };
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('cars');

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: cars = [], isLoading: carsLoading } = useGetCars();
  const { data: allBookings = [], isLoading: bookingsLoading } = useGetAllBookings();
  const { data: userProfiles = [] } = useGetAllUserProfiles();
  const { data: promoCodes = [] } = useGetPromoCodes();
  const { data: blogPosts = [] } = useGetBlogPosts();
  const { data: subscribers = [] } = useGetSubscribers();
  const { data: stripeConfigured } = useIsStripeConfigured();

  const addCarMutation = useAddCar();
  const updateCarMutation = useUpdateCar();
  const deleteCarMutation = useDeleteCar();
  const updateBookingMutation = useUpdateBookingStatus();
  const addPromoMutation = useAddPromoCode();
  const updatePromoMutation = useUpdatePromoCode();
  const addBlogMutation = useAddBlogPost();
  const updateBlogMutation = useUpdateBlogPost();
  const deleteBlogMutation = useDeleteBlogPost();
  const setStripeMutation = useSetStripeConfiguration();

  // Car form state
  const [carDialogOpen, setCarDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [carForm, setCarForm] = useState(emptyCarForm());
  const [carImageFile, setCarImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [featureTagInput, setFeatureTagInput] = useState('');

  // Promo form state
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [promoForm, setPromoForm] = useState<PromoCode>({
    code: '', discountType: 'percentage', discountValue: 10,
    expiryDate: BigInt(Date.now() + 30 * 24 * 60 * 60 * 1000) * BigInt(1_000_000),
    usageLimit: undefined, isActive: true,
  });

  // Blog form state
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [blogForm, setBlogForm] = useState({
    id: '', title: '', content: '', isPublished: false,
    publishDate: BigInt(Date.now()) * BigInt(1_000_000),
    coverImageFile: null as File | null,
  });

  // Stripe form
  const [stripeForm, setStripeForm] = useState({ secretKey: '', allowedCountries: 'US,AE,GB,DE,FR' });

  // WhatsApp
  const [whatsappNumber, setWhatsappNumber] = useState('971000000000');

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please login to access the admin panel.</p>
          <Button onClick={() => navigate({ to: '/' })} className="bg-gold text-deep-black">Go Home</Button>
        </div>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) return <AccessDeniedScreen />;

  // Analytics
  const totalRevenue = allBookings
    .filter(b => b.bookingStatus === 'completed')
    .reduce((s, b) => s + b.totalPrice, 0);

  const bookingsByStatus = ['pending', 'confirmed', 'cancelled', 'completed'].map(status => ({
    name: status,
    value: allBookings.filter(b => b.bookingStatus === status).length,
  })).filter(d => d.value > 0);

  const revenueByMonth: Record<string, number> = {};
  allBookings.forEach(b => {
    const month = new Date(Number(b.createdAt) / 1_000_000)
      .toLocaleString('default', { month: 'short', year: '2-digit' });
    revenueByMonth[month] = (revenueByMonth[month] || 0) + b.totalPrice;
  });
  const revenueChartData = Object.entries(revenueByMonth)
    .map(([month, revenue]) => ({ month, revenue }));

  const carBookingCounts: Record<string, number> = {};
  allBookings.forEach(b => {
    carBookingCounts[b.carId] = (carBookingCounts[b.carId] || 0) + 1;
  });
  const topCars = Object.entries(carBookingCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([carId, count]) => {
      const car = cars.find(c => c.id === carId);
      return { name: car ? `${car.make} ${car.model}` : carId, count };
    });

  const openCarDialog = (car?: CarType) => {
    if (car) {
      setEditingCar(car);
      setCarForm({
        ...car,
        images: car.images.map(img => img.getDirectURL()),
        year: car.year,
        seatCount: car.seatCount,
      });
    } else {
      setEditingCar(null);
      setCarForm(emptyCarForm());
    }
    setCarImageFile(null);
    setUploadProgress(0);
    setFeatureTagInput('');
    setCarDialogOpen(true);
  };

  const handleSaveCar = async () => {
    try {
      let images = editingCar?.images ?? [];
      if (carImageFile) {
        const bytes = new Uint8Array(await carImageFile.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(p => setUploadProgress(p));
        images = [...images, blob];
      }
      const carData: CarType = {
        id: carForm.id || `car_${Date.now()}`,
        make: carForm.make,
        model: carForm.model,
        year: BigInt(carForm.year),
        category: carForm.category,
        dailyRate: Number(carForm.dailyRate),
        isAvailable: carForm.isAvailable,
        location: carForm.location,
        description: carForm.description,
        fuelType: carForm.fuelType,
        transmission: carForm.transmission,
        seatCount: BigInt(carForm.seatCount),
        featureTags: carForm.featureTags,
        images,
      };
      if (editingCar) {
        await updateCarMutation.mutateAsync({ id: editingCar.id, car: carData });
        toast.success('Car updated!');
      } else {
        await addCarMutation.mutateAsync(carData);
        toast.success('Car added!');
      }
      setCarDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || t.general.error);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    try {
      await deleteCarMutation.mutateAsync(carId);
      toast.success('Car deleted!');
    } catch {
      toast.error(t.general.error);
    }
  };

  const handleSavePromo = async () => {
    try {
      if (editingPromo) {
        await updatePromoMutation.mutateAsync({ code: editingPromo.code, promoCode: promoForm });
        toast.success('Promo code updated!');
      } else {
        await addPromoMutation.mutateAsync(promoForm);
        toast.success('Promo code created!');
      }
      setPromoDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || t.general.error);
    }
  };

  const handleSaveBlog = async () => {
    try {
      let coverImage: ExternalBlob | undefined;
      if (blogForm.coverImageFile) {
        const bytes = new Uint8Array(await blogForm.coverImageFile.arrayBuffer());
        coverImage = ExternalBlob.fromBytes(bytes);
      } else if (editingBlog?.coverImage) {
        coverImage = editingBlog.coverImage;
      }
      const postData: BlogPost = {
        id: blogForm.id || `post_${Date.now()}`,
        title: blogForm.title,
        content: blogForm.content,
        isPublished: blogForm.isPublished,
        publishDate: blogForm.publishDate,
        coverImage,
      };
      if (editingBlog) {
        await updateBlogMutation.mutateAsync({ id: editingBlog.id, post: postData });
        toast.success('Post updated!');
      } else {
        await addBlogMutation.mutateAsync(postData);
        toast.success('Post created!');
      }
      setBlogDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || t.general.error);
    }
  };

  const handleStripeSetup = async () => {
    try {
      await setStripeMutation.mutateAsync({
        secretKey: stripeForm.secretKey,
        allowedCountries: stripeForm.allowedCountries.split(',').map(s => s.trim()),
      });
      toast.success('Stripe configured!');
    } catch (err: any) {
      toast.error(err?.message || t.general.error);
    }
  };

  const exportSubscribersCSV = () => {
    const csv = [
      'Name,Email,Date',
      ...subscribers.map(s =>
        `"${s.name}","${s.email}","${new Date(Number(s.subscribedAt) / 1_000_000).toLocaleDateString()}"`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'cars', label: t.admin.cars, icon: Car },
    { id: 'bookings', label: t.admin.bookings, icon: Calendar },
    { id: 'users', label: t.admin.users, icon: Users },
    { id: 'promotions', label: t.admin.promotions, icon: Tag },
    { id: 'analytics', label: t.admin.analytics, icon: BarChart2 },
    { id: 'blog', label: t.admin.blog, icon: FileText },
    { id: 'stripe', label: t.admin.stripe, icon: CreditCard },
    { id: 'whatsapp', label: t.admin.whatsapp, icon: MessageCircle },
    { id: 'subscribers', label: t.admin.subscribers, icon: Mail },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">{t.admin.title}</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <nav className="bg-charcoal border border-border rounded-lg overflow-hidden">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-border last:border-0 ${
                    activeTab === id
                      ? 'bg-gold/10 text-gold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-charcoal-mid'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ── Cars Management ── */}
            {activeTab === 'cars' && (
              <div className="bg-charcoal border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-semibold text-foreground">{t.admin.cars}</h2>
                  <Button onClick={() => openCarDialog()} className="bg-gold text-deep-black hover:bg-gold-light" size="sm">
                    <Plus className="w-4 h-4 me-1" />{t.admin.addCar}
                  </Button>
                </div>
                {carsLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 bg-charcoal-mid" />)}</div>
                ) : cars.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t.general.noData}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Vehicle</TableHead>
                          <TableHead className="text-muted-foreground">Category</TableHead>
                          <TableHead className="text-muted-foreground">Rate/Day</TableHead>
                          <TableHead className="text-muted-foreground">Location</TableHead>
                          <TableHead className="text-muted-foreground">Status</TableHead>
                          <TableHead className="text-muted-foreground">{t.admin.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cars.map(car => (
                          <TableRow key={car.id} className="border-border hover:bg-charcoal-mid">
                            <TableCell className="text-foreground font-medium">
                              {car.year.toString()} {car.make} {car.model}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{car.category}</TableCell>
                            <TableCell className="text-gold">${car.dailyRate}</TableCell>
                            <TableCell className="text-muted-foreground">{car.location}</TableCell>
                            <TableCell>
                              <Badge className={car.isAvailable
                                ? 'bg-success/20 text-success border-success/30'
                                : 'bg-destructive/20 text-destructive border-destructive/30'
                              }>
                                {car.isAvailable ? t.admin.active : t.admin.inactive}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="icon" variant="ghost"
                                  onClick={() => openCarDialog(car)}
                                  className="h-7 w-7 text-muted-foreground hover:text-gold"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-charcoal border-border">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-foreground">{t.admin.confirmDelete}</AlertDialogTitle>
                                      <AlertDialogDescription className="text-muted-foreground">{t.admin.confirmDeleteDesc}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <ADF>
                                      <AlertDialogCancel className="border-border text-foreground">{t.admin.cancel}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteCar(car.id)}
                                        className="bg-destructive text-destructive-foreground"
                                      >
                                        {t.admin.delete}
                                      </AlertDialogAction>
                                    </ADF>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* ── Bookings Management ── */}
            {activeTab === 'bookings' && (
              <div className="bg-charcoal border border-border rounded-lg p-6">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{t.admin.bookings}</h2>
                {bookingsLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 bg-charcoal-mid" />)}</div>
                ) : allBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t.general.noData}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Booking ID</TableHead>
                          <TableHead className="text-muted-foreground">Dates</TableHead>
                          <TableHead className="text-muted-foreground">Total</TableHead>
                          <TableHead className="text-muted-foreground">Status</TableHead>
                          <TableHead className="text-muted-foreground">Update</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allBookings.map(booking => (
                          <TableRow key={booking.id} className="border-border hover:bg-charcoal-mid">
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {booking.id.slice(0, 16)}...
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(Number(booking.startDate) / 1_000_000).toLocaleDateString()} →{' '}
                              {new Date(Number(booking.endDate) / 1_000_000).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-gold">
                              {booking.currency} {booking.totalPrice.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs border ${STATUS_COLORS[booking.bookingStatus] || ''}`}>
                                {booking.bookingStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={booking.bookingStatus}
                                onValueChange={async (v) => {
                                  try {
                                    await updateBookingMutation.mutateAsync({ bookingId: booking.id, status: v });
                                    toast.success('Status updated');
                                  } catch {
                                    toast.error(t.general.error);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs bg-charcoal-mid border-border w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-charcoal border-border">
                                  {['pending', 'confirmed', 'cancelled', 'completed'].map(s => (
                                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* ── Users Management ── */}
            {activeTab === 'users' && (
              <div className="bg-charcoal border border-border rounded-lg p-6">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{t.admin.users}</h2>
                {userProfiles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t.general.noData}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Principal</TableHead>
                          <TableHead className="text-muted-foreground">Name</TableHead>
                          <TableHead className="text-muted-foreground">Email</TableHead>
                          <TableHead className="text-muted-foreground">Phone</TableHead>
                          <TableHead className="text-muted-foreground">Language</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userProfiles.map(([principal, profile]) => (
                          <TableRow key={principal.toString()} className="border-border hover:bg-charcoal-mid">
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {principal.toString().slice(0, 12)}...
                            </TableCell>
                            <TableCell className="text-foreground">{profile.name}</TableCell>
                            <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                            <TableCell className="text-muted-foreground">{profile.phone}</TableCell>
                            <TableCell className="text-muted-foreground">{profile.preferredLanguage}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* ── Promotions ── */}
            {activeTab === 'promotions' && (
              <div className="bg-charcoal border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-semibold text-foreground">{t.admin.promotions}</h2>
                  <Button
                    onClick={() => {
                      setEditingPromo(null);
                      setPromoForm({
                        code: '', discountType: 'percentage', discountValue: 10,
                        expiryDate: BigInt(Date.now() + 30 * 24 * 60 * 60 * 1000) * BigInt(1_000_000),
                        usageLimit: undefined, isActive: true,
                      });
                      setPromoDialogOpen(true);
                    }}
                    className="bg-gold text-deep-black hover:bg-gold-light"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 me-1" />Create Code
                  </Button>
                </div>
                {promoCodes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t.general.noData}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Code</TableHead>
                          <TableHead className="text-muted-foreground">Type</TableHead>
                          <TableHead className="text-muted-foreground">Value</TableHead>
                          <TableHead className="text-muted-foreground">Expiry</TableHead>
                          <TableHead className="text-muted-foreground">Active</TableHead>
                          <TableHead className="text-muted-foreground">{t.admin.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {promoCodes.map(promo => (
                          <TableRow key={promo.code} className="border-border hover:bg-charcoal-mid">
                            <TableCell className="font-mono font-bold text-gold">{promo.code}</TableCell>
                            <TableCell className="text-muted-foreground capitalize">{promo.discountType}</TableCell>
                            <TableCell className="text-foreground">
                              {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(Number(promo.expiryDate) / 1_000_000).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={promo.isActive}
                                onCheckedChange={async (v) => {
                                  try {
                                    await updatePromoMutation.mutateAsync({
                                      code: promo.code,
                                      promoCode: { ...promo, isActive: v },
                                    });
                                    toast.success('Updated');
                                  } catch {
                                    toast.error(t.general.error);
                                  }
                                }}
                                className="data-[state=checked]:bg-gold"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon" variant="ghost"
                                onClick={() => {
                                  setEditingPromo(promo);
                                  setPromoForm(promo);
                                  setPromoDialogOpen(true);
                                }}
                                className="h-7 w-7 text-muted-foreground hover:text-gold"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* ── Analytics ── */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: t.analytics.totalRevenue, value: `$${totalRevenue.toFixed(0)}`, color: 'text-gold' },
                    { label: t.analytics.totalBookings, value: allBookings.length.toString(), color: 'text-foreground' },
                    { label: t.analytics.activeUsers, value: userProfiles.length.toString(), color: 'text-foreground' },
                    { label: t.analytics.subscribers, value: subscribers.length.toString(), color: 'text-foreground' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-charcoal border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className={`text-2xl font-bold font-serif ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue by Month */}
                  <div className="bg-charcoal border border-border rounded-lg p-4">
                    <h3 className="font-serif font-semibold text-foreground mb-4">{t.analytics.revenueByMonth}</h3>
                    {revenueChartData.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">{t.general.noData}</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={revenueChartData}>
                          <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                          <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 6 }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="revenue" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Bookings by Status */}
                  <div className="bg-charcoal border border-border rounded-lg p-4">
                    <h3 className="font-serif font-semibold text-foreground mb-4">{t.analytics.bookingsByStatus}</h3>
                    {bookingsByStatus.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">{t.general.noData}</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={bookingsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                            {bookingsByStatus.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
                          <Tooltip
                            contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 6 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Top Cars */}
                {topCars.length > 0 && (
                  <div className="bg-charcoal border border-border rounded-lg p-4">
                    <h3 className="font-serif font-semibold text-foreground mb-4">{t.analytics.topCars}</h3>
                    <div className="space-y-2">
                      {topCars.map(({ name, count }, i) => (
                        <div key={name} className="flex items-center gap-3">
                          <span className="text-xs text-gold font-bold w-5">{i + 1}.</span>
                          <div className="flex-1 bg-charcoal-mid rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gold rounded-full"
                              style={{ width: `${(count / (topCars[0]?.count || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-foreground w-40 truncate">{name}</span>
                          <span className="text-xs text-muted-foreground w-12 text-end">{count} bookings</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Blog Management ── */}
            {activeTab === 'blog' && (
              <div className="bg-charcoal border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-semibold text-foreground">{t.admin.blog}</h2>
                  <Button
                    onClick={() => {
                      setEditingBlog(null);
                      setBlogForm({
                        id: '', title: '', content: '', isPublished: false,
                        publishDate: BigInt(Date.now()) * BigInt(1_000_000),
                        coverImageFile: null,
                      });
                      setBlogDialogOpen(true);
                    }}
                    className="bg-gold text-deep-black hover:bg-gold-light"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 me-1" />{t.blog.createPost}
                  </Button>
                </div>
                {blogPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t.general.noData}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Title</TableHead>
                          <TableHead className="text-muted-foreground">Date</TableHead>
                          <TableHead className="text-muted-foreground">Status</TableHead>
                          <TableHead className="text-muted-foreground">{t.admin.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blogPosts.map(post => (
                          <TableRow key={post.id} className="border-border hover:bg-charcoal-mid">
                            <TableCell className="text-foreground font-medium">{post.title}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(Number(post.publishDate) / 1_000_000).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={post.isPublished
                                ? 'bg-success/20 text-success border-success/30'
                                : 'bg-muted/20 text-muted-foreground border-border'
                              }>
                                {post.isPublished ? t.blog.published : t.blog.draft}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="icon" variant="ghost"
                                  onClick={() => {
                                    setEditingBlog(post);
                                    setBlogForm({
                                      id: post.id, title: post.title, content: post.content,
                                      isPublished: post.isPublished, publishDate: post.publishDate,
                                      coverImageFile: null,
                                    });
                                    setBlogDialogOpen(true);
                                  }}
                                  className="h-7 w-7 text-muted-foreground hover:text-gold"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-charcoal border-border">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-foreground">{t.admin.confirmDelete}</AlertDialogTitle>
                                      <AlertDialogDescription className="text-muted-foreground">{t.admin.confirmDeleteDesc}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <ADF>
                                      <AlertDialogCancel className="border-border text-foreground">{t.admin.cancel}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={async () => {
                                          try {
                                            await deleteBlogMutation.mutateAsync(post.id);
                                            toast.success('Post deleted');
                                          } catch { toast.error(t.general.error); }
                                        }}
                                        className="bg-destructive text-destructive-foreground"
                                      >
                                        {t.admin.delete}
                                      </AlertDialogAction>
                                    </ADF>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* ── Stripe Settings ── */}
            {activeTab === 'stripe' && (
              <div className="bg-charcoal border border-border rounded-lg p-6 max-w-lg">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-2">{t.admin.stripe}</h2>
                <div className="mb-4">
                  <Badge className={stripeConfigured
                    ? 'bg-success/20 text-success border-success/30'
                    : 'bg-warning/20 text-warning border-warning/30'
                  }>
                    {stripeConfigured ? 'Configured' : 'Not Configured'}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Stripe Secret Key</Label>
                    <Input
                      type="password"
                      value={stripeForm.secretKey}
                      onChange={e => setStripeForm(f => ({ ...f, secretKey: e.target.value }))}
                      placeholder="sk_live_..."
                      className="bg-charcoal-mid border-border mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Allowed Countries (comma-separated)</Label>
                    <Input
                      value={stripeForm.allowedCountries}
                      onChange={e => setStripeForm(f => ({ ...f, allowedCountries: e.target.value }))}
                      placeholder="US,AE,GB"
                      className="bg-charcoal-mid border-border mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleStripeSetup}
                    disabled={setStripeMutation.isPending || !stripeForm.secretKey}
                    className="bg-gold text-deep-black hover:bg-gold-light font-semibold"
                  >
                    {setStripeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                    Save Configuration
                  </Button>
                </div>
              </div>
            )}

            {/* ── WhatsApp Settings ── */}
            {activeTab === 'whatsapp' && (
              <div className="bg-charcoal border border-border rounded-lg p-6 max-w-lg">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{t.admin.whatsapp}</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">WhatsApp Number (with country code, no +)</Label>
                    <Input
                      value={whatsappNumber}
                      onChange={e => setWhatsappNumber(e.target.value)}
                      placeholder="971000000000"
                      className="bg-charcoal-mid border-border mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Example: 971501234567 for UAE +971 50 123 4567</p>
                  </div>
                  <Button
                    onClick={() => toast.success('WhatsApp number saved (stored locally)')}
                    className="bg-gold text-deep-black hover:bg-gold-light font-semibold"
                  >
                    Save Number
                  </Button>
                </div>
              </div>
            )}

            {/* ── Subscribers ── */}
            {activeTab === 'subscribers' && (
              <div className="bg-charcoal border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-foreground">{t.admin.subscribers}</h2>
                    <p className="text-sm text-muted-foreground mt-1">Total: {subscribers.length}</p>
                  </div>
                  <Button
                    onClick={exportSubscribersCSV}
                    variant="outline"
                    size="sm"
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    {t.general.exportCsv}
                  </Button>
                </div>
                {subscribers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t.general.noData}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Name</TableHead>
                          <TableHead className="text-muted-foreground">Email</TableHead>
                          <TableHead className="text-muted-foreground">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscribers.map(sub => (
                          <TableRow key={sub.email} className="border-border hover:bg-charcoal-mid">
                            <TableCell className="text-foreground">{sub.name || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{sub.email}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(Number(sub.subscribedAt) / 1_000_000).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Car Dialog ── */}
      <Dialog open={carDialogOpen} onOpenChange={setCarDialogOpen}>
        <DialogContent className="bg-charcoal border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-foreground">
              {editingCar ? t.admin.editCar : t.admin.addCar}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {[
              { key: 'make', label: 'Make', type: 'text' },
              { key: 'model', label: 'Model', type: 'text' },
              { key: 'year', label: 'Year', type: 'number' },
              { key: 'dailyRate', label: 'Daily Rate ($)', type: 'number' },
              { key: 'location', label: 'Location', type: 'text' },
              { key: 'seatCount', label: 'Seat Count', type: 'number' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <Label className="text-muted-foreground text-xs">{label}</Label>
                <Input
                  type={type}
                  value={String((carForm as any)[key])}
                  onChange={e => setCarForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="bg-charcoal-mid border-border mt-1"
                />
              </div>
            ))}
            <div>
              <Label className="text-muted-foreground text-xs">Category</Label>
              <Select value={carForm.category} onValueChange={v => setCarForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-charcoal-mid border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-charcoal border-border">
                  {['Sedan', 'SUV', 'Sports', 'Luxury', 'Electric', 'Van'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Transmission</Label>
              <Select value={carForm.transmission} onValueChange={v => setCarForm(f => ({ ...f, transmission: v }))}>
                <SelectTrigger className="bg-charcoal-mid border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-charcoal border-border">
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Fuel Type</Label>
              <Select value={carForm.fuelType} onValueChange={v => setCarForm(f => ({ ...f, fuelType: v }))}>
                <SelectTrigger className="bg-charcoal-mid border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-charcoal border-border">
                  {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Switch
                checked={carForm.isAvailable}
                onCheckedChange={v => setCarForm(f => ({ ...f, isAvailable: v }))}
                className="data-[state=checked]:bg-gold"
              />
              <Label className="text-foreground text-sm">Available</Label>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Description</Label>
            <textarea
              value={carForm.description}
              onChange={e => setCarForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full mt-1 bg-charcoal-mid border border-border rounded-md p-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Feature Tags (press Enter to add)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={featureTagInput}
                onChange={e => setFeatureTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && featureTagInput.trim()) {
                    e.preventDefault();
                    setCarForm(f => ({ ...f, featureTags: [...f.featureTags, featureTagInput.trim()] }));
                    setFeatureTagInput('');
                  }
                }}
                placeholder="e.g. GPS, Sunroof"
                className="bg-charcoal-mid border-border"
              />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {carForm.featureTags.map(tag => (
                <Badge
                  key={tag}
                  className="bg-gold/10 text-gold border-gold/30 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setCarForm(f => ({ ...f, featureTags: f.featureTags.filter(t => t !== tag) }))}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Car Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={e => setCarImageFile(e.target.files?.[0] ?? null)}
              className="bg-charcoal-mid border-border mt-1"
            />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2 bg-charcoal-mid rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gold transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCarDialogOpen(false)} className="border-border text-foreground">
              {t.admin.cancel}
            </Button>
            <Button
              onClick={handleSaveCar}
              disabled={addCarMutation.isPending || updateCarMutation.isPending}
              className="bg-gold text-deep-black hover:bg-gold-light font-semibold"
            >
              {(addCarMutation.isPending || updateCarMutation.isPending)
                ? <Loader2 className="w-4 h-4 animate-spin me-2" />
                : null
              }
              {t.admin.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Promo Dialog ── */}
      <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
        <DialogContent className="bg-charcoal border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-foreground">
              {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-muted-foreground text-xs">Code</Label>
              <Input
                value={promoForm.code}
                onChange={e => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20"
                disabled={!!editingPromo}
                className="bg-charcoal-mid border-border mt-1 uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-xs">Discount Type</Label>
                <Select value={promoForm.discountType} onValueChange={v => setPromoForm(f => ({ ...f, discountType: v }))}>
                  <SelectTrigger className="bg-charcoal-mid border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal border-border">
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Value</Label>
                <Input
                  type="number"
                  value={promoForm.discountValue}
                  onChange={e => setPromoForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                  className="bg-charcoal-mid border-border mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Expiry Date</Label>
              <Input
                type="date"
                value={new Date(Number(promoForm.expiryDate) / 1_000_000).toISOString().split('T')[0]}
                onChange={e => setPromoForm(f => ({
                  ...f,
                  expiryDate: BigInt(new Date(e.target.value).getTime()) * BigInt(1_000_000),
                }))}
                className="bg-charcoal-mid border-border mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={promoForm.isActive}
                onCheckedChange={v => setPromoForm(f => ({ ...f, isActive: v }))}
                className="data-[state=checked]:bg-gold"
              />
              <Label className="text-foreground text-sm">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialogOpen(false)} className="border-border text-foreground">
              {t.admin.cancel}
            </Button>
            <Button
              onClick={handleSavePromo}
              disabled={addPromoMutation.isPending || updatePromoMutation.isPending}
              className="bg-gold text-deep-black hover:bg-gold-light font-semibold"
            >
              {t.admin.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Blog Dialog ── */}
      <Dialog open={blogDialogOpen} onOpenChange={setBlogDialogOpen}>
        <DialogContent className="bg-charcoal border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-foreground">
              {editingBlog ? t.blog.editPost : t.blog.createPost}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-muted-foreground text-xs">{t.blog.postTitle}</Label>
              <Input
                value={blogForm.title}
                onChange={e => setBlogForm(f => ({ ...f, title: e.target.value }))}
                className="bg-charcoal-mid border-border mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">{t.blog.postContent}</Label>
              <textarea
                value={blogForm.content}
                onChange={e => setBlogForm(f => ({ ...f, content: e.target.value }))}
                rows={8}
                className="w-full mt-1 bg-charcoal-mid border border-border rounded-md p-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">{t.blog.coverImage}</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={e => setBlogForm(f => ({ ...f, coverImageFile: e.target.files?.[0] ?? null }))}
                className="bg-charcoal-mid border-border mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={blogForm.isPublished}
                onCheckedChange={v => setBlogForm(f => ({ ...f, isPublished: v }))}
                className="data-[state=checked]:bg-gold"
              />
              <Label className="text-foreground text-sm">Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlogDialogOpen(false)} className="border-border text-foreground">
              {t.admin.cancel}
            </Button>
            <Button
              onClick={handleSaveBlog}
              disabled={addBlogMutation.isPending || updateBlogMutation.isPending}
              className="bg-gold text-deep-black hover:bg-gold-light font-semibold"
            >
              {(addBlogMutation.isPending || updateBlogMutation.isPending)
                ? <Loader2 className="w-4 h-4 animate-spin me-2" />
                : null
              }
              {t.admin.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
