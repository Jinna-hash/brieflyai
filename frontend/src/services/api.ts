import type {Briefing, Meeting} from '../types';
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
export async function health(){const r=await fetch(`${BASE}/api/health`); if(!r.ok) throw new Error('API unavailable'); return r.json();}
export async function createBriefing(meeting:Meeting):Promise<Briefing>{const r=await fetch(`${BASE}/api/briefings`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(meeting)});const data=await r.json();if(!r.ok)throw new Error(data.detail||'Could not create briefing');return data;}
export async function getHistory(){const r=await fetch(`${BASE}/api/briefings`);if(!r.ok)throw new Error('Could not load history');return r.json();}
export async function getBriefing(id:string):Promise<Briefing>{const r=await fetch(`${BASE}/api/briefings/${id}`);if(!r.ok)throw new Error('Briefing not found');return r.json();}
