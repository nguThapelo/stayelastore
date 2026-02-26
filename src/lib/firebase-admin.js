import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function firebaseConfigFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

export function getFirebaseAdmin() {
  const credentials = firebaseConfigFromEnv();

  if (!credentials) {
    return {
      configured: false,
      auth: null,
      db: null,
    };
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(credentials),
      projectId: credentials.projectId,
    });
  }

  return {
    configured: true,
    auth: getAuth(),
    db: getFirestore(),
  };
}