// generateKeys.js
import fs from "fs";
import crypto from "crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

fs.writeFileSync("rsa_private.pem", privateKey);
fs.writeFileSync("rsa_public.pem", publicKey);

console.log("✅ RSA keys generated!");
console.log("- Private key: rsa_private.pem");
console.log("- Public key: rsa_public.pem");
