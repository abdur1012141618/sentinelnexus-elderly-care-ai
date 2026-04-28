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
  // খুঁজে বের করো প্রথম organisation
  let org = await prisma.organisation.findFirst();
  if (!org) {
    // না থাকলে তৈরি করে দাও
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
    // orgId দেওয়া থাকলে এবং তা বৈধ ইউআইডি হলে ব্যবহার করো, নাহলে ডিফল্ট নাও
    let finalOrgId = orgId;
    if (!finalOrgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalOrgId)) {
      finalOrgId = await getDefaultOrgId();
    } else {
      // নিশ্চিত করো যে এই orgId-র organisation সত্যি আছে
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));