// utils/encryption.ts

// 🔒 암호화 함수
export const encryptMessage = async (message: string, secretKey: string): Promise<string> => {
  if (!secretKey) return message;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(secretKey), 'PBKDF2', false, ['deriveKey']);
  
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, 
    keyMaterial, 
    { name: 'AES-GCM', length: 256 }, 
    false, 
    ['encrypt', 'decrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return 'ENC:' + btoa(binary);
};

// 🔓 복호화 함수
export const decryptMessage = async (encryptedData: string, secretKey: string): Promise<string | null> => {
  if (!secretKey || !encryptedData.startsWith('ENC:')) return encryptedData;

  try {
    const base64 = encryptedData.slice(4);
    const binaryStr = atob(base64);
    const combined = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      combined[i] = binaryStr.charCodeAt(i);
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(secretKey), 'PBKDF2', false, ['deriveKey']);
    
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, 
      keyMaterial, 
      { name: 'AES-GCM', length: 256 }, 
      false, 
      ['encrypt', 'decrypt']
    );

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    return null; 
  }
};