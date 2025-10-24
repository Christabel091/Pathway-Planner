// src/utility/crypto.js
// Browser-safe RSA-OAEP (SHA-256) helpers for encrypting sensitive JSON payloads

// Convert a PEM public key to CryptoKey
export async function importRsaPublicKey(pem) {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pem
    .trim()
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s+/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) =>
    c.charCodeAt(0)
  ).buffer;

  return crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

// Encrypt a UTF-8 string with RSA-OAEP-256 and return base64

export async function rsaEncryptToBase64(publicKey, plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    data
  );

  return arrayBufferToBase64(ciphertext);
}

// Utils
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
