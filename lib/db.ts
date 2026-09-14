// For production deployments on platforms like Render or Vercel, 
// replace this in-memory store with a real database like Redis or PostgreSQL.
// In-memory state will be lost when the server restarts or scales across multiple instances.

const globalForDb = globalThis as unknown as { whisperDb: Map<string, any> };
export const db = globalForDb.whisperDb || new Map();
if (process.env.NODE_ENV !== 'production') {
  globalForDb.whisperDb = db;
}
