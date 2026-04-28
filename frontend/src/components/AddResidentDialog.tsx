import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateResident } from '@/hooks/useResidents';
import { useToast } from '@/hooks/use-toast'; // shadcn toast

export default function AddResidentDialog() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [age, setAge] = useState('');
  const [gait, setGait] = useState('');
  const createResident = useCreateResident();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createResident.mutateAsync({
        name,
        room: room || null,
        age: age ? parseInt(age) : null,
        gait: gait || null,
      });
      toast({
        title: 'Resident added',
        description: `${name} has been added successfully.`,
      });
      setOpen(false);
      setName(''); setRoom(''); setAge(''); setGait('');
    } catch (error: any) {
      const message = error?.response?.data?.error || error.message || 'An error occurred';
      toast({
        title: 'Failed to add resident',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t('residents.addResident')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('residents.dialogTitle')}</DialogTitle>
          <DialogDescription>{t('residents.dialogDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="name">{t('residents.name')}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="room">{t('residents.room')}</Label>
            <Input id="room" value={room} onChange={(e) => setRoom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="age">{t('residents.age')}</Label>
            <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="gait">{t('residents.gait')}</Label>
            <Input id="gait" value={gait} onChange={(e) => setGait(e.target.value)} />
          </div>
          <Button type="submit" disabled={createResident.isPending} className="w-full">
            {createResident.isPending ? t('residents.saving') : t('residents.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}