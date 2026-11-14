import 'server-only';

import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export const INQUIRY_SESSION_COOKIE = 'inquiry_access_session';

export async function getInquiryIdentity() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  if (!user) {
    return { user: null, isAdmin: false, displayName: '익명' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_admin, full_name, username')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  return {
    user,
    isAdmin: profile?.role === 'admin' || profile?.is_admin === true,
    displayName: profile?.full_name || profile?.username || user.email?.split('@')[0] || '회원',
  };
}

export async function getInquirySessionToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(INQUIRY_SESSION_COOKIE)?.value;
  return token && verifyInquirySessionToken(token) ? token : null;
}

export function createInquirySessionToken() {
  const sessionId = randomBytes(32).toString('base64url');
  const issuedAt = Date.now().toString(36);
  const payload = `${sessionId}.${issuedAt}`;
  return `${payload}.${signInquirySessionId(payload)}`;
}

function getInquirySessionSecret() {
  const secret = process.env.INQUIRY_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('INQUIRY_SESSION_SECRET 또는 SUPABASE_SERVICE_ROLE_KEY 설정이 필요합니다.');
  return secret;
}

function signInquirySessionId(sessionId: string) {
  return createHmac('sha256', getInquirySessionSecret()).update(sessionId).digest('base64url');
}

function verifyInquirySessionToken(token: string) {
  const [sessionId, issuedAt, signature, extra] = token.split('.');
  const issuedAtMs = Number.parseInt(issuedAt || '', 36);
  if (
    !sessionId
    || !issuedAt
    || !signature
    || extra !== undefined
    || !/^[A-Za-z0-9_-]{43}$/.test(sessionId)
    || !/^[A-Za-z0-9_-]{43}$/.test(signature)
    || !Number.isSafeInteger(issuedAtMs)
    || issuedAtMs > Date.now() + 60_000
    || Date.now() - issuedAtMs > 24 * 60 * 60 * 1000
  ) {
    return false;
  }

  const supplied = Buffer.from(signature, 'base64url');
  const expected = Buffer.from(signInquirySessionId(`${sessionId}.${issuedAt}`), 'base64url');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function hashInquirySessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashInquiryPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = await derivePassword(password, salt);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export async function verifyInquiryPassword(password: string, storedHash: string) {
  const [algorithm, salt, encodedHash] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !encodedHash || !/^[a-f0-9]{128}$/i.test(encodedHash)) {
    return false;
  }

  const expected = Buffer.from(encodedHash, 'hex');
  const actual = await derivePassword(password, salt);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
