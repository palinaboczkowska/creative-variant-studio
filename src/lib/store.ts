import { Firestore } from "@google-cloud/firestore";
import type { Job } from "./types";

// On Cloud Run the project is detected automatically and jobs are stored in
// Firestore. Locally, without GCP credentials, an in-memory map is used.
const useFirestore = Boolean(process.env.GOOGLE_CLOUD_PROJECT || process.env.K_SERVICE);

let db: Firestore | null = null;
// Kept on globalThis so jobs survive hot reloads in development.
const globalStore = globalThis as unknown as { __jobs?: Map<string, Job> };
const memory = (globalStore.__jobs ??= new Map<string, Job>());

function collection() {
  db ??= new Firestore({ ignoreUndefinedProperties: true });
  return db.collection("jobs");
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
