/**
 * Genuine End-to-End Encryption (E2EE) Module
 * 
 * Cryptographic Architecture:
 * - Public Key Exchange: ECDH (Elliptic Curve Diffie-Hellman) on NIST P-256.
 * - Authenticated Symmetric Encryption: AES-256-GCM (96-bit unique random nonce).
 * - Key Agreement: Both parties derive the identical AES-256-GCM key directly using Web Crypto API.
 * - Local Key Persistence: Browser IndexedDB (isolated from localStorage).
 * - Zero Knowledge: The Spring Boot backend and MongoDB Atlas only relay and store ciphertext.
 */

const DB_NAME = 'chat_e2ee_db';
const STORE_NAME = 'user_keypairs';
const DB_VERSION = 1;

/**
 * Open or initialize IndexedDB for local cryptographic key storage.
 */
function openKeyDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this browser environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save user's exported keypair into IndexedDB.
 */
export async function storeKeypairInDb(userId, keypairJwk) {
  const db = await openKeyDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(keypairJwk, `key_${userId}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve user's keypair from IndexedDB.
 */
export async function getKeypairFromDb(userId) {
  const db = await openKeyDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(`key_${userId}`);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * ArrayBuffer <-> Base64 helpers
 */
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * In-memory cache for derived AES-256-GCM conversation keys:
 * Map<`${currentUserId}_${peerUserId}`, CryptoKey>
 */
const conversationKeyCache = new Map();

/**
 * Get or generate ECDH P-256 keypair for the active user.
 * Private key is retained locally in IndexedDB and NEVER sent to the server.
 */
export async function getOrGenerateUserKeypair(userId) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not available. Please use a secure origin (HTTPS or localhost).');
  }

  const existingJwk = await getKeypairFromDb(userId);
  if (existingJwk) {
    const publicKey = await window.crypto.subtle.importKey(
      'jwk',
      existingJwk.publicKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );
    const privateKey = await window.crypto.subtle.importKey(
      'jwk',
      existingJwk.privateKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
    return { publicKey, privateKey };
  }

  // Generate new NIST P-256 ECDH Keypair
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const pubJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  await storeKeypairInDb(userId, { publicKey: pubJwk, privateKey: privJwk });

  return keyPair;
}

/**
 * Save an existing ECDH keypair into IndexedDB under a specific user ID.
 */
export async function saveUserKeypair(userId, keyPair) {
  const pubJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
  await storeKeypairInDb(userId, { publicKey: pubJwk, privateKey: privJwk });
}

/**
 * Export public key to Base64 SPKI format for transmission to Spring Boot backend.
 */
export async function exportPublicKeySpki(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return bufferToBase64(exported);
}

/**
 * Import a peer's Base64 SPKI public key into a Web Crypto ECDH CryptoKey.
 */
export async function importPeerPublicKeySpki(spkiBase64) {
  const buffer = base64ToBuffer(spkiBase64);
  return await window.crypto.subtle.importKey(
    'spki',
    buffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

/**
 * Derive 256-bit AES-GCM conversation key using ECDH agreement.
 */
export async function getConversationKey(currentUserId, myPrivateKey, peerUserId, peerPublicKeySpki) {
  if (!peerPublicKeySpki) {
    throw new Error('Recipient does not have an active E2EE public key registered.');
  }

  const cacheKey = `${currentUserId}_${peerUserId}_${peerPublicKeySpki}`;
  if (conversationKeyCache.has(cacheKey)) {
    return conversationKeyCache.get(cacheKey);
  }

  const peerPublicKey = await importPeerPublicKeySpki(peerPublicKeySpki);

  // Derive AES-GCM 256-bit symmetric key directly from ECDH shared secret
  const aesGcmKey = await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: peerPublicKey,
    },
    myPrivateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // Non-extractable for memory defense
    ['encrypt', 'decrypt']
  );

  conversationKeyCache.set(cacheKey, aesGcmKey);
  return aesGcmKey;
}

/**
 * Clear conversation key cache (e.g., on logout).
 */
export function clearKeyCache() {
  conversationKeyCache.clear();
}

/**
 * Encrypt message locally using AES-256-GCM with a unique 96-bit (12-byte) IV/nonce.
 * Output: { ciphertext: Base64, nonce: Base64, algorithm: "AES-256-GCM", encryptionVersion: 1 }
 */
export async function encryptMessage(plaintext, aesKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate cryptographically secure random 12-byte IV (96-bit, recommended for GCM)
  const nonce = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',   // Web Crypto API uses 'AES-GCM'; bit length (256) is set at key derivation time
      iv: nonce,
    },
    aesKey,
    data
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    nonce: bufferToBase64(nonce),
    algorithm: 'AES-256-GCM',
    encryptionVersion: 1,
  };
}

/**
 * Decrypt message locally using AES-256-GCM.
 * Validates authentication tag automatically; throws error if ciphertext is altered.
 */
export async function decryptMessage(ciphertextBase64, nonceBase64, aesKey) {
  try {
    const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
    const nonceBuffer = base64ToBuffer(nonceBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',   // Web Crypto API uses 'AES-GCM'; bit length is set at key derivation time
        iv: new Uint8Array(nonceBuffer),
      },
      aesKey,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (_err) {
    throw new Error('Authentication tag mismatch or invalid decryption key.');
  }
}
