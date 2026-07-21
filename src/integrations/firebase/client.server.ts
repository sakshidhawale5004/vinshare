import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let credential;
if (serviceAccountStr) {
  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    credential = cert(serviceAccount);
  } catch (e) {
    console.warn("Could not parse FIREBASE_SERVICE_ACCOUNT_KEY");
  }
}

export const firebaseAdminApp = !getApps().length 
  ? initializeApp({
      ...(credential ? { credential } : {}),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID
    }) 
  : getApp();

export const firebaseAdminDb = getFirestore(firebaseAdminApp);
