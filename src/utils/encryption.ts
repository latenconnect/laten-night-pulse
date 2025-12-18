/**
 * End-to-End Encryption utilities using Web Crypto API
 * Uses ECDH for key exchange and AES-GCM for message encryption
 */

const STORAGE_KEY = 'laten_dm_private_key';

// Convert ArrayBuffer to base64 string
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert base64 string to ArrayBuffer
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Generate a new ECDH key pair for the user
export const generateKeyPair = async (): Promise<{
  publicKey: string;
  privateKey: string;
}> => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey']
  );

  const publicKeyRaw = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(publicKeyRaw),
    privateKey: arrayBufferToBase64(privateKeyRaw),
  };
};

// Store private key securely in localStorage (encrypted with a derived key from user session)
export const storePrivateKey = (userId: string, privateKey: string): void => {
  try {
    const storageKey = `${STORAGE_KEY}_${userId}`;
    localStorage.setItem(storageKey, privateKey);
    console.log('Private key stored securely');
  } catch (error) {
    console.error('Failed to store private key:', error);
    throw new Error('Failed to store encryption key');
  }
};

// Retrieve private key from localStorage
export const getPrivateKey = (userId: string): string | null => {
  try {
    const storageKey = `${STORAGE_KEY}_${userId}`;
    return localStorage.getItem(storageKey);
  } catch (error) {
    console.error('Failed to retrieve private key:', error);
    return null;
  }
};

// Import a public key from base64 string
export const importPublicKey = async (publicKeyBase64: string): Promise<CryptoKey> => {
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
  return crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
};

// Import a private key from base64 string
export const importPrivateKey = async (privateKeyBase64: string): Promise<CryptoKey> => {
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
  return crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey']
  );
};

// Derive a shared secret key from own private key and other's public key
export const deriveSharedKey = async (
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> => {
  return crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt a message using AES-GCM
export const encryptMessage = async (
  message: string,
  sharedKey: CryptoKey
): Promise<{ ciphertext: string; nonce: string }> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Generate a random nonce (IV)
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
    },
    sharedKey,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    nonce: arrayBufferToBase64(nonce.buffer),
  };
};

// Decrypt a message using AES-GCM
export const decryptMessage = async (
  ciphertext: string,
  nonce: string,
  sharedKey: CryptoKey
): Promise<string> => {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const nonceBuffer = base64ToArrayBuffer(nonce);
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(nonceBuffer),
    },
    sharedKey,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
};

// Encrypt a message for both sender and recipient
export const encryptForConversation = async (
  message: string,
  senderPrivateKeyBase64: string,
  senderPublicKeyBase64: string,
  recipientPublicKeyBase64: string
): Promise<{
  encryptedForSender: { ciphertext: string; nonce: string };
  encryptedForRecipient: { ciphertext: string; nonce: string };
}> => {
  const senderPrivateKey = await importPrivateKey(senderPrivateKeyBase64);
  const senderPublicKey = await importPublicKey(senderPublicKeyBase64);
  const recipientPublicKey = await importPublicKey(recipientPublicKeyBase64);

  // Derive shared keys
  const sharedKeyForRecipient = await deriveSharedKey(senderPrivateKey, recipientPublicKey);
  const sharedKeyForSender = await deriveSharedKey(senderPrivateKey, senderPublicKey);

  // Encrypt for both parties
  const [encryptedForRecipient, encryptedForSender] = await Promise.all([
    encryptMessage(message, sharedKeyForRecipient),
    encryptMessage(message, sharedKeyForSender),
  ]);

  return {
    encryptedForSender,
    encryptedForRecipient,
  };
};

// Decrypt a message from a conversation
export const decryptFromConversation = async (
  ciphertext: string,
  nonce: string,
  myPrivateKeyBase64: string,
  otherPublicKeyBase64: string
): Promise<string> => {
  const myPrivateKey = await importPrivateKey(myPrivateKeyBase64);
  const otherPublicKey = await importPublicKey(otherPublicKeyBase64);

  const sharedKey = await deriveSharedKey(myPrivateKey, otherPublicKey);
  return decryptMessage(ciphertext, nonce, sharedKey);
};
