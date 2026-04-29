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

// --- Residents ---
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

// --- Vitals ---
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

    res.status(201).json(vital);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create vital record' });
  }
});

// --- Alerts ---
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

// --- Fall Checks (Rule-based) ---
app.post('/api/fall-checks', async (req, res) => {
  const { residentId, age, gait, history } = req.body;
  if (!residentId || !age || !gait) {
    return res.status(400).json({ error: 'residentId, age, and gait are required' });
  }

  let score = 0;
  const ageNum = parseInt(age);
  if (ageNum >= 80) score += 0.3;
  else if (ageNum >= 70) score += 0.2;
  else if (ageNum >= 60) score += 0.1;

  const gaitLower = gait.toLowerCase();
  if (gaitLower === 'unsteady') score += 0.3;
  else if (gaitLower === 'shuffling') score += 0.25;
  else if (gaitLower === 'slow') score += 0.1;

  if (history && history.toLowerCase().includes('fall')) score += 0.2;

  const isFall = score >= 0.5;

  try {
    const fallCheck = await prisma.fallCheck.create({
      data: {
        residentId,
        age: ageNum,
        confidence: parseFloat(score.toFixed(2)),
        gait,
        history: history || null,
        isFall,
      },
    });
    res.status(201).json(fallCheck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create fall check' });
  }
});

app.get('/api/fall-checks/:residentId', async (req, res) => {
  const { residentId } = req.params;
  try {
    const checks = await prisma.fallCheck.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json(checks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch fall checks' });
  }
});

// ✨ AI-Powered Fall Check (Ollama)
app.post('/api/ai-fall-check', async (req, res) => {
  const { residentId, age, gait, history } = req.body;
  if (!residentId || !age || !gait) {
    return res.status(400).json({ error: 'residentId, age, and gait are required' });
  }

  const prompt = `You are a medical AI assistant specialized in fall risk assessment for elderly patients.
Based on the following data, provide a numeric risk score (between 0 and 1, where 0 is no risk and 1 is extreme risk), a verdict (HIGH or LOW), and a brief explanation (one sentence).
Respond ONLY with a valid JSON object with keys "score", "verdict", "explanation".

Data:
- Age: ${age}
- Gait: ${gait}
- Medical History: ${history || 'None'}

Example output: {"score":0.65,"verdict":"HIGH","explanation":"High risk due to advanced age and unsteady gait."}`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        prompt: prompt,
        stream: false,
        format: 'json',
      }),
    });

    const result = await response.json();
    const parsed = JSON.parse(result.response);

    const fallCheck = await prisma.fallCheck.create({
      data: {
        residentId,
        age: parseInt(age),
        confidence: parsed.score,
        gait,
        history: history || null,
        isFall: parsed.verdict === 'HIGH',
      },
    });

    res.status(201).json({
      ...fallCheck,
      aiExplanation: parsed.explanation,
    });
  } catch (error) {
    console.error('AI Fall Check failed:', error);
    res.status(500).json({ error: 'AI assessment failed. Ensure Ollama is running locally.' });
  }
});

// --- Health Prediction Endpoints ---
app.post('/api/predict-health/:residentId', async (req, res) => {
  const { residentId } = req.params;
  
  try {
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      include: {
        vitals: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        fallChecks: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!resident) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    let baseRisk = 0;
    
    if (resident.age) {
      if (resident.age >= 85) baseRisk += 0.3;
      else if (resident.age >= 75) baseRisk += 0.2;
      else if (resident.age >= 65) baseRisk += 0.1;
    }
    
    const recentVitals = resident.vitals || [];
    if (recentVitals.length >= 2) {
      const latest = recentVitals[0];
      const previous = recentVitals[1];
      
      if (latest.heartRate && previous.heartRate) {
        const hrTrend = latest.heartRate - previous.heartRate;
        if (Math.abs(hrTrend) > 15) baseRisk += 0.15;
      }
      
      if (latest.systolic && previous.systolic) {
        const bpTrend = latest.systolic - previous.systolic;
        if (Math.abs(bpTrend) > 20) baseRisk += 0.2;
      }
      
      if (latest.spo2 && previous.spo2) {
        const spo2Trend = latest.spo2 - previous.spo2;
        if (spo2Trend < -3) baseRisk += 0.25;
      }
    }
    
    const fallHistory = resident.fallChecks || [];
    const recentFalls = fallHistory.filter(f => f.isFall).length;
    if (recentFalls >= 3) baseRisk += 0.3;
    else if (recentFalls >= 1) baseRisk += 0.15;
    
    const riskScore = Math.min(baseRisk, 1);
    
    const predictions = [];
    const today = new Date();
    const latest = recentVitals[0] || {};
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dayFactor = 1 + (i * 0.01);
      
      predictions.push({
        day: i + 1,
        date: date.toISOString().split('T')[0],
        predictedHeartRate: latest.heartRate ? Math.round(latest.heartRate * dayFactor) : null,
        predictedTemperature: latest.temperature ? parseFloat((latest.temperature * dayFactor).toFixed(1)) : null,
        predictedSystolic: latest.systolic ? Math.round(latest.systolic * dayFactor) : null,
        predictedDiastolic: latest.diastolic ? Math.round(latest.diastolic * dayFactor) : null,
        predictedSpo2: latest.spo2 ? Math.max(85, Math.round(latest.spo2 / dayFactor)) : null,
        riskLevel: parseFloat((riskScore * dayFactor).toFixed(2)),
      });
    }

    const saved = await prisma.healthPrediction.create({
      data: {
        residentId,
        riskScore,
        heartRate: recentVitals[0]?.heartRate || null,
        temperature: recentVitals[0]?.temperature || null,
        systolic: recentVitals[0]?.systolic || null,
        diastolic: recentVitals[0]?.diastolic || null,
        spo2: recentVitals[0]?.spo2 || null,
        fallRisk: riskScore,
        summary: JSON.stringify(predictions.slice(0, 7)),
      },
    });

    res.json({
      prediction: saved,
      timeline: predictions,
      resident: {
        id: resident.id,
        name: resident.name,
        age: resident.age,
        room: resident.room,
      },
    });
  } catch (error) {
    console.error('Health prediction failed:', error);
    res.status(500).json({ error: 'Failed to generate health prediction' });
  }
});

app.get('/api/predict-health/:residentId', async (req, res) => {
  const { residentId } = req.params;
  try {
    const predictions = await prisma.healthPrediction.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    res.json(predictions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));