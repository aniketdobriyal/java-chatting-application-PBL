/**
 * Frontend E2EE Crypto Tests
 *
 * These tests verify the browser-side encryption module using Web Crypto API.
 * Run with: node --experimental-vm-modules node_modules/.bin/vitest run src/utils/crypto.test.js
 *
 * NOTE: Since Vite + Web Crypto API is browser-native, these tests are written
 * as self-contained verification scripts using the Node.js WebCrypto polyfill.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  bufferToBase64,
  base64ToBuffer,
  exportPublicKeySpki,
  importPeerPublicKeySpki,
  getConversationKey,
  encryptMessage,
  decryptMessage,
} from './crypto.js';

// Use the Web Crypto API (available in Node 19+ / jsdom / happy-dom)
const subtle = globalThis.crypto?.subtle;

describe('Buffer / Base64 utilities', () => {
  it('round-trips ArrayBuffer to Base64 and back correctly', () => {
    const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const base64 = bufferToBase64(original.buffer);
    const recovered = new Uint8Array(base64ToBuffer(base64));
    expect(recovered).toEqual(original);
  });

  it('produces valid Base64 output (no invalid chars)', () => {
    const data = new Uint8Array([1, 2, 3, 255, 128, 64]);
    const b64 = bufferToBase64(data.buffer);
    expect(b64).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe('ECDH key generation and export / import', () => {
  let aliceKeyPair;

  beforeAll(async () => {
    aliceKeyPair = await subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
  });

  it('exports Alice public key as non-empty Base64 SPKI', async () => {
    const spki = await exportPublicKeySpki(aliceKeyPair.publicKey);
    expect(typeof spki).toBe('string');
    expect(spki.length).toBeGreaterThan(32);
  });

  it('round-trips public key through SPKI export + import', async () => {
    const spki = await exportPublicKeySpki(aliceKeyPair.publicKey);
    const imported = await importPeerPublicKeySpki(spki);
    // Re-export and compare
    const spki2 = await exportPublicKeySpki(imported);
    expect(spki2).toBe(spki);
  });
});

describe('AES-256-GCM encrypt / decrypt', () => {
  let aliceKeyPair;
  let bobKeyPair;
  let aliceAesKey;
  let bobAesKey;

  beforeAll(async () => {
    // Generate two ECDH keypairs simulating Alice and Bob
    aliceKeyPair = await subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
    bobKeyPair = await subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    // Alice derives a key using her private key and Bob's public key
    aliceAesKey = await subtle.deriveKey(
      { name: 'ECDH', public: bobKeyPair.publicKey },
      aliceKeyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Bob derives key using his private key and Alice's public key
    bobAesKey = await subtle.deriveKey(
      { name: 'ECDH', public: aliceKeyPair.publicKey },
      bobKeyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  });

  it('encrypts plaintext so ciphertext differs from original', async () => {
    const plaintext = 'Hello Bob, this is a secret message!';
    const { ciphertext } = await encryptMessage(plaintext, aliceAesKey);
    expect(ciphertext).not.toBe(plaintext);
    expect(ciphertext.length).toBeGreaterThan(0);
  });

  it('Bob decrypts Alice ciphertext and recovers original plaintext (E2EE round-trip)', async () => {
    const plaintext = 'End-to-end encrypted message from Alice to Bob';
    const { ciphertext, nonce } = await encryptMessage(plaintext, aliceAesKey);

    // Bob decrypts using his derived key (which equals Alice's derived key via ECDH)
    const recovered = await decryptMessage(ciphertext, nonce, bobAesKey);
    expect(recovered).toBe(plaintext);
  });

  it('decryption fails with wrong key (authentication tag mismatch)', async () => {
    // Generate a completely unrelated AES key
    const wrongKey = await subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const plaintext = 'Secret';
    const { ciphertext, nonce } = await encryptMessage(plaintext, aliceAesKey);

    await expect(decryptMessage(ciphertext, nonce, wrongKey))
      .rejects
      .toThrow('Authentication tag mismatch or invalid decryption key.');
  });

  it('decryption fails with modified ciphertext (tamper detection)', async () => {
    const plaintext = 'Tamper test';
    const { ciphertext, nonce } = await encryptMessage(plaintext, aliceAesKey);

    // Flip first character to simulate tampering
    const tampered = (ciphertext.charAt(0) === 'A' ? 'B' : 'A') + ciphertext.slice(1);

    await expect(decryptMessage(tampered, nonce, aliceAesKey))
      .rejects
      .toThrow('Authentication tag mismatch or invalid decryption key.');
  });

  it('two encryptions of the same plaintext produce different ciphertexts (nonce uniqueness)', async () => {
    const plaintext = 'Same message encrypted twice';
    const result1 = await encryptMessage(plaintext, aliceAesKey);
    const result2 = await encryptMessage(plaintext, aliceAesKey);

    expect(result1.ciphertext).not.toBe(result2.ciphertext);
    expect(result1.nonce).not.toBe(result2.nonce);
  });

  it('encrypted payload fields have correct schema', async () => {
    const { ciphertext, nonce, algorithm, encryptionVersion } = await encryptMessage('test', aliceAesKey);
    expect(typeof ciphertext).toBe('string');
    expect(typeof nonce).toBe('string');
    expect(algorithm).toBe('AES-256-GCM');
    expect(encryptionVersion).toBe(1);
  });

  it('Alice and Bob derive matching conversation keys via getConversationKey and exchange messages', async () => {
    const aliceSpki = await exportPublicKeySpki(aliceKeyPair.publicKey);
    const bobSpki = await exportPublicKeySpki(bobKeyPair.publicKey);

    // Alice derives key for Bob using Bob's SPKI public key string
    const keyAliceForBob = await getConversationKey('user_alice', aliceKeyPair.privateKey, 'user_bob', bobSpki);

    // Bob derives key for Alice using Alice's SPKI public key string
    const keyBobForAlice = await getConversationKey('user_bob', bobKeyPair.privateKey, 'user_alice', aliceSpki);

    // Alice encrypts for Bob
    const secretMsg = 'SafeRoute Chat end-to-end encryption works perfectly!';
    const encrypted = await encryptMessage(secretMsg, keyAliceForBob);

    // Bob decrypts Alice message
    const decryptedByBob = await decryptMessage(encrypted.ciphertext, encrypted.nonce, keyBobForAlice);
    expect(decryptedByBob).toBe(secretMsg);

    // Bob encrypts reply for Alice
    const replyMsg = 'Received and verified, Alice!';
    const replyEncrypted = await encryptMessage(replyMsg, keyBobForAlice);

    // Alice decrypts Bob reply
    const decryptedByAlice = await decryptMessage(replyEncrypted.ciphertext, replyEncrypted.nonce, keyAliceForBob);
    expect(decryptedByAlice).toBe(replyMsg);
  });
});
