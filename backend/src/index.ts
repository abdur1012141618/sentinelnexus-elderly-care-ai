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

app.get('/api/residents', async (_, res) => {
  const residents = await prisma.resident.findMany();
  res.json(residents);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

// Create a new resident
app.post('/api/residents', async (req, res) => {
  const { name, room, age, gait, notes, orgId } = req.body;
  try {
    const resident = await prisma.resident.create({
      data: {
        name,
        room: room || null,
        age: age ? parseInt(age) : null,
        gait: gait || null,
        notes: notes || null,
        orgId,
      },
    });
    res.status(201).json(resident);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create resident' });
  }
});