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

    // ---- স্বয়ংক্রিয় অ্যালার্ট চেক ----
    const alerts: Array<{ type: string; severity: string; message: string }> = [];
    if (heartRate && (heartRate < 50 || heartRate > 120)) {
      alerts.push({ type: 'heart_rate', severity: 'warning', message: `Heart rate: ${heartRate} bpm (normal 50-120)` });
    }
    if (temperature && (temperature < 36.1 || temperature > 37.8)) {
      alerts.push({ type: 'temperature', severity: 'warning', message: `Temperature: ${temperature}°C (normal 36.1-37.8)` });
    }
    if (systolic && diastolic) {
      if (systolic > 180 || diastolic > 110) {
        alerts.push({ type: 'blood_pressure', severity: 'critical', message: `BP: ${systolic}/${diastolic} mmHg (critical)` });
      } else if (systolic > 140 || diastolic > 90) {
        alerts.push({ type: 'blood_pressure', severity: 'warning', message: `BP: ${systolic}/${diastolic} mmHg (high)` });
      }
    }
    if (spo2 && spo2 < 90) {
      alerts.push({ type: 'spo2', severity: 'critical', message: `SpO₂: ${spo2}% (below 90%)` });
    } else if (spo2 && spo2 < 95) {
      alerts.push({ type: 'spo2', severity: 'warning', message: `SpO₂: ${spo2}% (below 95%)` });
    }

    // প্রতিটি Alert তৈরি ও সংরক্ষণ
    if (alerts.length > 0) {
      const orgId = await getDefaultOrgId();
      await Promise.all(alerts.map(alert =>
        prisma.alert.create({
          data: {
            orgId,
            residentId,
            type: alert.type,
            severity: alert.severity,
            metadata: { message: alert.message },
          },
        })
      ));
    }
    // -------------------------------
    res.status(201).json(vital);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create vital record' });
  }
});

// --- Alerts Endpoints ---
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      include: { resident: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      where: { isOpen: true },
      take: 50,
    });
    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.patch('/api/alerts/:id/acknowledge', async (req, res) => {
  const { id } = req.params;
  try {
    const alert = await prisma.alert.update({
      where: { id },
      data: { isOpen: false },
    });
    res.json(alert);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));