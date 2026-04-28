import { useState } from 'react';
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

// Railway PostgreSQL-এ থাকা Organisation-এর ID বসাও
const ORGANISATION_ID = 'ef59bd9b-807d-4776-80e1-abc123def456'; // <-- এটা তোমার সঠিক ID দিয়ে বদলাও

export default function AddResidentDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [age, setAge] = useState('');
  const [gait, setGait] = useState('');
  const createResident = useCreateResident();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createResident.mutateAsync({
      name,
      room: room || null,
      age: age ? parseInt(age) : null,
      gait: gait || null,
      orgId: ORGANISATION_ID,
    });
    setOpen(false);
    setName('');
    setRoom('');
    setAge('');
    setGait('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Resident</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Resident</DialogTitle>
          <DialogDescription>Enter the resident details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="room">Room</Label>
            <Input id="room" value={room} onChange={(e) => setRoom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="gait">Gait</Label>
            <Input id="gait" value={gait} onChange={(e) => setGait(e.target.value)} />
          </div>
          <Button type="submit" disabled={createResident.isPending} className="w-full">
            {createResident.isPending ? 'Saving...' : 'Save Resident'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}