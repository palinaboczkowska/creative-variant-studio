import { Firestore } from "@google-cloud/firestore";
import type { Job } from "./types";

// On Cloud Run the project is detected automatically and jobs are stored in
// Firestore. Locally, without GCP credentials, an in-memory map is used.
const useFirestore = Boolean(process.env.GOOGLE_CLOUD_PROJECT || process.env.K_SERVICE);

let db: Firestore | null = null;
// Kept on globalThis so jobs survive hot reloads in development.
const globalStore = globalThis as unknown as { __jobs?: Map<string, Job>; __images?: Map<string, string> };
const memory = (globalStore.__jobs ??= new Map<string, Job>());

function firestore() {
  db ??= new Firestore({ ignoreUndefinedProperties: true });
  return db;
}

function collection() {
  return firestore().collection("jobs");
}

export const storageName = useFirestore ? "Firestore" : "in-memory";

export async function saveJob(job: Job): Promise<void> {
  if (useFirestore) await collection().doc(job.id).set(job);
  else memory.set(job.id, job);
}

export async function getJob(id: string): Promise<Job | null> {
  if (!useFirestore) return memory.get(id) ?? null;
  const snap = await collection().doc(id).get();
  return snap.exists ? (snap.data() as Job) : null;
}

export async function listJobs(limit = 10): Promise<Job[]> {
  if (!useFirestore) return [...memory.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  const snap = await collection().orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => d.data() as Job);
}

// Images are stored as data URLs in their own documents, one per image,
// so a job document stays small. Firestore allows up to 1 MB per document.
const images = (globalStore.__images ??= new Map<string, string>());

export async function saveImage(id: string, dataUrl: string): Promise<void> {
  if (useFirestore) await firestore().collection("images").doc(id).set({ dataUrl, createdAt: new Date().toISOString() });
  else images.set(id, dataUrl);
}

export async function getImage(id: string): Promise<string | null> {
  if (!useFirestore) return images.get(id) ?? null;
  const snap = await firestore().collection("images").doc(id).get();
  return snap.exists ? (snap.data()!.dataUrl as string) : null;
}
