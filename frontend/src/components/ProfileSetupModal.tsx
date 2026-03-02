import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '../contexts/LanguageContext';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Key } from 'lucide-react';

interface Props {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({ open, onComplete }: Props) {
  const { t } = useLanguage();
  const saveMutation = useSaveCallerUserProfile();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferredLanguage: 'en',
    preferredCurrency: 'USD',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await saveMutation.mutateAsync(form);
      toast.success(t.profile.saved);
      onComplete();
    } catch {
      toast.error(t.general.error);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="bg-charcoal border-gold/30 text-foreground max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-gold" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl text-foreground">{t.profileSetup.title}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">{t.profileSetup.subtitle}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-foreground">{t.profileSetup.name} *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={t.booking.namePlaceholder}
              required
              className="bg-charcoal-mid border-border mt-1"
            />
          </div>
          <div>
            <Label className="text-foreground">{t.profileSetup.email}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder={t.booking.emailPlaceholder}
              className="bg-charcoal-mid border-border mt-1"
            />
          </div>
          <div>
            <Label className="text-foreground">{t.profileSetup.phone}</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder={t.booking.phonePlaceholder}
              className="bg-charcoal-mid border-border mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground">{t.profileSetup.language}</Label>
              <Select value={form.preferredLanguage} onValueChange={(v) => setForm(f => ({ ...f, preferredLanguage: v }))}>
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
              <Label className="text-foreground">{t.profileSetup.currency}</Label>
              <Select value={form.preferredCurrency} onValueChange={(v) => setForm(f => ({ ...f, preferredCurrency: v }))}>
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
          <Button
            type="submit"
            disabled={saveMutation.isPending || !form.name.trim()}
            className="w-full bg-gold text-deep-black hover:bg-gold-light font-semibold"
          >
            {saveMutation.isPending ? t.profileSetup.saving : t.profileSetup.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
