// Google Drive backup for per-user farm data.
// Uses the OAuth `provider_token` returned by Supabase Google sign-in,
// stores backups inside the user's hidden `appDataFolder` so the data
// stays private to this app.

import type { FarmData } from '@/types/farm';

const TOKEN_KEY = 'google_drive_token';
const TOKEN_EXPIRY_KEY = 'google_drive_token_expiry';
const BACKUP_FILE_NAME = 'smart-poultry-backup.json';

export const GOOGLE_DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.appdata';

export interface BackupPayload {
  version: number;
  updatedAt: string;
  data: FarmData;
  poultrySystem?: any;
  farmName?: string;
}

export function saveDriveToken(token: string, expiresInSec = 3500) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(
    TOKEN_EXPIRY_KEY,
    String(Date.now() + expiresInSec * 1000),
  );
}

// Eagerly capture Google Drive provider token if present in URL hash on boot
if (typeof window !== 'undefined' && window.location?.hash?.includes('provider_token')) {
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const pToken = params.get('provider_token');
    const exp = Number(params.get('expires_in') || '3500');
    if (pToken) {
      saveDriveToken(pToken, exp);
    }
  } catch (e) {
    console.error('Error eagerly saving drive token from URL:', e);
  }
}

export function clearDriveToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function getDriveToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) || '0');
  if (!token) return null;
  if (expiry && Date.now() > expiry) {
    clearDriveToken();
    return null;
  }
  return token;
}

export function isDriveConnected(): boolean {
  return !!getDriveToken();
}

async function driveFetch(url: string, init: RequestInit = {}) {
  const token = getDriveToken();
  if (!token) throw new Error('drive_not_connected');
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401 || res.status === 403) {
    clearDriveToken();
    throw new Error('drive_token_expired');
  }
  if (!res.ok) {
    throw new Error(`drive_error_${res.status}`);
  }
  return res;
}

async function findBackupFileId(): Promise<string | null> {
  const url =
    'https://www.googleapis.com/drive/v3/files?' +
    new URLSearchParams({
      spaces: 'appDataFolder',
      q: `name = '${BACKUP_FILE_NAME}' and trashed = false`,
      fields: 'files(id,name,modifiedTime)',
      pageSize: '1',
    }).toString();
  const res = await driveFetch(url);
  const json = await res.json();
  return json.files?.[0]?.id ?? null;
}

export async function uploadBackup(data?: FarmData): Promise<void> {
  let resolvedFarmData = data;
  if (!resolvedFarmData) {
    const raw = localStorage.getItem('poultryFarmData');
    if (raw) {
      try { resolvedFarmData = JSON.parse(raw); } catch {}
    }
  }
  if (!resolvedFarmData) return;

  let poultrySystem = null;
  const sysRaw = localStorage.getItem('smartPoultrySystem');
  if (sysRaw) {
    try { poultrySystem = JSON.parse(sysRaw); } catch {}
  }

  const farmName = localStorage.getItem('smart_poultry_farm_name') || resolvedFarmData.farmName;

  const payload: BackupPayload = {
    version: 2,
    updatedAt: new Date().toISOString(),
    data: resolvedFarmData,
    poultrySystem,
    farmName,
  };
  const body = JSON.stringify(payload);

  const existingId = await findBackupFileId();

  if (existingId) {
    // Update existing file content (media upload)
    await driveFetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      },
    );
    return;
  }

  // Create new file in appDataFolder (multipart)
  const boundary = '-------smart-poultry-' + Date.now();
  const metadata = {
    name: BACKUP_FILE_NAME,
    parents: ['appDataFolder'],
    mimeType: 'application/json',
  };
  const multipartBody =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    body +
    `\r\n--${boundary}--`;

  await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    },
  );
}

export async function downloadBackup(): Promise<BackupPayload | null> {
  const id = await findBackupFileId();
  if (!id) return null;
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
  );
  return (await res.json()) as BackupPayload;
}

export async function getBackupInfo(): Promise<{
  exists: boolean;
  modifiedTime?: string;
}> {
  const url =
    'https://www.googleapis.com/drive/v3/files?' +
    new URLSearchParams({
      spaces: 'appDataFolder',
      q: `name = '${BACKUP_FILE_NAME}' and trashed = false`,
      fields: 'files(id,modifiedTime)',
      pageSize: '1',
    }).toString();
  const res = await driveFetch(url);
  const json = await res.json();
  const file = json.files?.[0];
  return file
    ? { exists: true, modifiedTime: file.modifiedTime }
    : { exists: false };
}
