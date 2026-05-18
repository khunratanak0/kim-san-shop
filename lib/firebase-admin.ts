import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let _adminDb: Firestore | null = null;
let _app: App | null = null;

function getAdminApp(): App {
  // Return cached instance when available
  if (_app) return _app;

  // Reuse existing instance from getApps() (handles hot-reload in dev)
  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0];
    return _app;
  }

  // Validate required env vars
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
    || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin SDK initialization failed: Missing environment variables.\n' +
      'Add FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY to your .env.local.\n' +
      'Get them from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key'
    );
  }

  // Vercel stores newlines as literal \n, so replace them
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  _app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedKey,
    }),
    projectId,
  });

  return _app;
}

export function getAdminDb(): Firestore {
  if (!_adminDb) {
    _adminDb = getFirestore(getAdminApp());
  }
  return _adminDb;
}

export default getAdminDb;