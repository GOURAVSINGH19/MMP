import QRCode from 'qrcode';

/** Canonical scan payload: userId:bibNumber */
export function buildQrPayload(userId, bibNumber) {
  return `${userId}:${String(bibNumber).trim()}`;
}

export function parseQrPayload(qrData) {
  if (!qrData || typeof qrData !== 'string') return null;
  const raw = qrData.trim();
  if (raw.startsWith('data:image')) return null;

  if (raw.startsWith('MMP-')) {
    const segments = raw.split('-');
    const bibNumber = segments[segments.length - 1];
    const eventId = segments.length >= 3 ? segments[1] : null;
    return { legacyMmp: true, eventId, bibNumber, userId: null };
  }

  const parts = raw.split(':');
  if (parts.length === 2) {
    return { userId: parts[0], bibNumber: parts[1], eventId: null };
  }
  if (parts.length === 3) {
    return { eventId: parts[0], userId: parts[1], bibNumber: parts[2] };
  }
  return null;
}

export async function toQrDataUrl(payload) {
  return QRCode.toDataURL(payload, { margin: 1, width: 280 });
}

export async function resolveBibQrDisplay(storedValue, userId, bibNumber) {
  if (!storedValue && userId && bibNumber) {
    return toQrDataUrl(buildQrPayload(userId, bibNumber));
  }
  if (storedValue?.startsWith('data:image')) {
    return storedValue;
  }
  const payload = storedValue?.includes(':') ? storedValue : buildQrPayload(userId, bibNumber);
  return toQrDataUrl(payload);
}
