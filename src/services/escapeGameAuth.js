import crypto from 'crypto';
import { env } from '../config/environment.js';

const TOKEN_VERSION = 'v1';
const DEFAULT_TTL_SECONDS = 60 * 60 * 2; // 2 hours

function requireSecret() {
  if (!env.ESCAPE_GAME_SECRET) {
    throw new Error('ESCAPE_GAME_SECRET is not configured.');
  }

  return env.ESCAPE_GAME_SECRET;
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_');
}

function base64UrlDecode(value) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padding = normalized.length % 4;
  const padded = padding === 0
    ? normalized
    : normalized + '='.repeat(4 - padding);

  return Buffer.from(padded, 'base64').toString('utf8');
}

function sign(encodedPayload) {
  return base64UrlEncode(
    crypto
      .createHmac('sha256', requireSecret())
      .update(encodedPayload)
      .digest()
  );
}

function safeEqual(a, b) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function createEscapeGameToken({
  sessionId,
  discordUserId,
  ttlSeconds = DEFAULT_TTL_SECONDS,
}) {
  if (!sessionId) {
    throw new Error('sessionId is required.');
  }

  if (!discordUserId) {
    throw new Error('discordUserId is required.');
  }

  const ttl = Number(ttlSeconds);

  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new Error('ttlSeconds must be a positive number.');
  }

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    v: TOKEN_VERSION,
    sid: String(sessionId),
    uid: String(discordUserId),
    iat: now,
    exp: now + Math.floor(ttl),
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyEscapeGameToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    return {
      valid: false,
      reason: 'missing_token',
    };
  }

  const parts = token.split('.');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      valid: false,
      reason: 'malformed_token',
    };
  }

  const [encodedPayload, providedSignature] = parts;

  try {
    const expectedSignature = sign(encodedPayload);

    if (!safeEqual(providedSignature, expectedSignature)) {
      return {
        valid: false,
        reason: 'invalid_signature',
      };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    if (payload?.v !== TOKEN_VERSION) {
      return {
        valid: false,
        reason: 'unsupported_token_version',
      };
    }

    if (!payload?.sid || !payload?.uid || !payload?.exp) {
      return {
        valid: false,
        reason: 'invalid_payload',
      };
    }

    const now = Math.floor(Date.now() / 1000);

    if (now >= Number(payload.exp)) {
      return {
        valid: false,
        reason: 'expired_token',
      };
    }

    return {
      valid: true,
      sessionId: String(payload.sid),
      discordUserId: String(payload.uid),
      issuedAt: Number(payload.iat),
      expiresAt: Number(payload.exp),
    };
  } catch {
    return {
      valid: false,
      reason: 'invalid_token',
    };
  }
}

export function buildEscapeGameUrl({
  sessionId,
  discordUserId,
  ttlSeconds = DEFAULT_TTL_SECONDS,
}) {
  const token = createEscapeGameToken({
    sessionId,
    discordUserId,
    ttlSeconds,
  });

  const baseUrl = String(env.ESCAPE_GAME_BASE_URL || '').replace(/\/$/, '');

  if (!baseUrl) {
    throw new Error('ESCAPE_GAME_BASE_URL is not configured.');
  }

  return `${baseUrl}/play/${encodeURIComponent(String(sessionId))}#token=${encodeURIComponent(token)}`;
}
