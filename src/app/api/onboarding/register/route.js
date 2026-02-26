import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { encryptField } from '@/lib/encryption';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';
import { captureServerError } from '@/lib/sentry';
import crypto from 'crypto';

const localAgents = globalThis.__localAgents || [];
if (!globalThis.__localAgents) {
  globalThis.__localAgents = localAgents;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashEmail(email) {
  return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

function toPublicProfile(agent) {
  return {
    id: agent.id,
    name: agent.name,
    storeName: agent.storeName,
    gautengLocation: agent.gautengLocation,
    email: agent.email,
    weeklyTarget: agent.weeklyTarget,
    cashFlow: Number(agent.cashFlow || 0),
    creditScore: Number(agent.creditScore || 300),
    latestCalculation: agent.latestCalculation || null,
    latestCalculationAt: agent.latestCalculationAt || null,
    dailyEntries: agent.dailyEntries || [],
    updatedAt: agent.updatedAt,
  };
}

export async function GET(request) {
  const ip = getClientIp(request);
  const limit = enforceRateLimit(`onboard-read:${ip}`, 300, 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded (300 req/min).' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = normalizeEmail(searchParams.get('email'));

    if (!email) {
      return NextResponse.json({ success: false, error: 'email is required' }, { status: 400 });
    }

    const emailHash = hashEmail(email);
    const firebase = getFirebaseAdmin();

    if (firebase.configured) {
      const snapshot = await firebase.db.collection('agents').where('emailHash', '==', emailHash).limit(1).get();
      if (snapshot.empty) {
        return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      return NextResponse.json({
        success: true,
        data: toPublicProfile({
          id: doc.id,
          ...data,
        }),
      });
    }

    const agent = localAgents.find((item) => item.emailHash === emailHash);
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: toPublicProfile(agent) });
  } catch (error) {
    captureServerError(error, { route: '/api/onboarding/register', method: 'GET' });
    return NextResponse.json({ success: false, error: 'Unable to load profile' }, { status: 500 });
  }
}

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = enforceRateLimit(`onboard:${ip}`, 300, 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded (300 req/min).' }, { status: 429 });
  }

  try {
    const payload = await request.json();
    const email = normalizeEmail(payload.email);
    const emailHash = hashEmail(email);
    const required = [
      'name',
      'storeName',
      'gautengLocation',
      'phone',
      'email',
      'bankAccount',
      'weeklyTarget',
      'initialCreditHistory',
    ];

    for (const field of required) {
      if (!payload[field]) {
        return NextResponse.json({ success: false, error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    const profile = {
      id: `agent_${Date.now()}`,
      name: String(payload.name).trim(),
      storeName: String(payload.storeName).trim(),
      gautengLocation: String(payload.gautengLocation).trim(),
      phoneEncrypted: encryptField(payload.phone),
      emailEncrypted: encryptField(email),
      email,
      emailHash,
      bankAccountEncrypted: encryptField(payload.bankAccount),
      weeklyTarget: Number(payload.weeklyTarget),
      initialCreditHistory: String(payload.initialCreditHistory).trim(),
      cashFlow: 0,
      creditScore: 300,
      dailyEntries: [],
      latestCalculation: null,
      latestCalculationAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const firebase = getFirebaseAdmin();

    if (firebase.configured) {
      const existing = await firebase.db.collection('agents').where('emailHash', '==', emailHash).limit(1).get();

      if (!existing.empty) {
        const existingDoc = existing.docs[0];
        const current = existingDoc.data();

        const updated = {
          name: profile.name,
          storeName: profile.storeName,
          gautengLocation: profile.gautengLocation,
          phoneEncrypted: profile.phoneEncrypted,
          bankAccountEncrypted: profile.bankAccountEncrypted,
          weeklyTarget: Math.max(Number(current.weeklyTarget || 500), profile.weeklyTarget),
          initialCreditHistory: profile.initialCreditHistory,
          updatedAt: new Date().toISOString(),
        };

        await firebase.db.collection('agents').doc(existingDoc.id).set(updated, { merge: true });

        return NextResponse.json({
          success: true,
          data: toPublicProfile({
            id: existingDoc.id,
            ...current,
            ...updated,
          }),
        });
      }

      try {
        await firebase.auth.createUser({
          uid: profile.id,
          email,
          displayName: profile.name,
          phoneNumber: payload.phone.startsWith('+27') ? payload.phone : undefined,
          disabled: false,
        });
      } catch {
        const userByEmail = await firebase.auth.getUserByEmail(email);
        await firebase.auth.updateUser(userByEmail.uid, { displayName: profile.name });
        profile.id = userByEmail.uid;
      }

      await firebase.db.collection('agents').doc(profile.id).set(profile);
    } else {
      const existing = localAgents.find((item) => item.emailHash === emailHash);
      if (existing) {
        existing.name = profile.name;
        existing.storeName = profile.storeName;
        existing.gautengLocation = profile.gautengLocation;
        existing.phoneEncrypted = profile.phoneEncrypted;
        existing.bankAccountEncrypted = profile.bankAccountEncrypted;
        existing.initialCreditHistory = profile.initialCreditHistory;
        existing.weeklyTarget = Math.max(Number(existing.weeklyTarget || 500), profile.weeklyTarget);
        existing.updatedAt = new Date().toISOString();
        return NextResponse.json({ success: true, data: toPublicProfile(existing) });
      }

      localAgents.push(profile);
    }

    return NextResponse.json({
      success: true,
      data: toPublicProfile(profile),
    });
  } catch (error) {
    captureServerError(error, { route: '/api/onboarding/register' });
    return NextResponse.json({ success: false, error: 'Onboarding failed' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const ip = getClientIp(request);
  const limit = enforceRateLimit(`onboard-update:${ip}`, 300, 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded (300 req/min).' }, { status: 429 });
  }

  try {
    const payload = await request.json();
    const email = normalizeEmail(payload.email);
    const requestedTarget = Number(payload.weeklyTarget);

    if (!email || !requestedTarget) {
      return NextResponse.json({ success: false, error: 'email and weeklyTarget are required' }, { status: 400 });
    }

    const emailHash = hashEmail(email);
    const firebase = getFirebaseAdmin();

    if (firebase.configured) {
      const snapshot = await firebase.db.collection('agents').where('emailHash', '==', emailHash).limit(1).get();

      if (snapshot.empty) {
        return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
      }

      const doc = snapshot.docs[0];
      const current = doc.data();
      const currentTarget = Number(current.weeklyTarget || 500);

      if (requestedTarget < currentTarget) {
        return NextResponse.json(
          { success: false, error: `Weekly target can only increase from ${currentTarget}` },
          { status: 400 }
        );
      }

      const updatedAt = new Date().toISOString();
      await firebase.db.collection('agents').doc(doc.id).set({ weeklyTarget: requestedTarget, updatedAt }, { merge: true });

      return NextResponse.json({
        success: true,
        data: toPublicProfile({ id: doc.id, ...current, weeklyTarget: requestedTarget, updatedAt }),
      });
    }

    const agent = localAgents.find((item) => item.emailHash === emailHash);
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    if (requestedTarget < Number(agent.weeklyTarget || 500)) {
      return NextResponse.json(
        { success: false, error: `Weekly target can only increase from ${agent.weeklyTarget}` },
        { status: 400 }
      );
    }

    agent.weeklyTarget = requestedTarget;
    agent.updatedAt = new Date().toISOString();

    return NextResponse.json({ success: true, data: toPublicProfile(agent) });
  } catch (error) {
    captureServerError(error, { route: '/api/onboarding/register', method: 'PATCH' });
    return NextResponse.json({ success: false, error: 'Unable to update weekly target' }, { status: 500 });
  }
}