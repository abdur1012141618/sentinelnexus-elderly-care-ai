import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// --- Organisation Helper ---
async function getDefaultOrgId() {
  let org = await prisma.organisation.findFirst();
  if (!org) {
    org = await prisma.organisation.create({
      data: { name: 'Default Organisation' },
    });
  }
  return org.id;
}

// --- Residents Endpoints ---
app.get('/api/residents', async (_, res) => {
  try {
    const residents = await prisma.resident.findMany();
    res.json(residents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

app.post('/api/residents', async (req, res) => {
  const { name, room, age, gait, notes, orgId } = req.body;
  try {
    let finalOrgId = orgId;
    if (!finalOrgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalOrgId)) {
      finalOrgId = await getDefaultOrgId();
    } else {
      const orgExists = await prisma.organisation.findUnique({ where: { id: finalOrgId } });
      if (!orgExists) {
        finalOrgId = await getDefaultOrgId();
      }
    }

    const resident = await prisma.resident.create({
      data: {
        name,
        room: room || null,
        age: age ? parseInt(age) : null,
        gait: gait || null,
        notes: notes || null,
        orgId: finalOrgId,
      },
    });
    res.status(201).json(resident);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create resident' });
  }
});

// --- Vitals Endpoints ---
// সব ভাইটালস রেকর্ড
app.get('/api/vitals', async (req, res) => {
  try {
    const vitals = await prisma.vital.findMany({
      include: { resident: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(vitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch vitals' });
  }
});

// নির্দিষ্ট রেসিডেন্টের ভাইটালস
app.get('/api/vitals/:residentId', async (req, res) => {
  const { residentId } = req.params;
  try {
    const vitals = await prisma.vital.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(vitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch resident vitals' });
  }
});

// নতুন ভাইটাল তৈরি
app.post('/api/vitals', async (req, res) => {
  const { residentId, heartRate, temperature, systolic, diastolic, spo2, notes } = req.body;
  if (!residentId) {
    return res.status(400).json({ error: 'residentId is required' });
  }
  try {
    const vital = await prisma.vital.create({
      data: {
        residentId,
        heartRate: heartRate || null,
        temperature: temperature || null,
        systolic: systolic || null,
        diastolic: diastolic || null,
        spo2: spo2 || null,
        notes: notes || null,
      },
    });
    res.status(201).json(vital);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create vital record' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));