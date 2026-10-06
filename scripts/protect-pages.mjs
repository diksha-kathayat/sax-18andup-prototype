#!/usr/bin/env node
/**
 * Encrypts the live prototype so GitHub Pages never ships username/password
 * in page source. Credentials come from env only (GitHub Actions secrets).
 */
import { webcrypto } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const crypto = webcrypto;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "prototype");
const outDir = join(root, "pages-dist");
const ITERATIONS = 210000;

const user = process.env.PROTOTYPE_USER || "";
const pass = process.env.PROTOTYPE_PASS || "";

if (!user || !pass) {
  console.error("PROTOTYPE_USER and PROTOTYPE_PASS must be set.");
  process.exit(1);
}

function bytesToB64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

async function encryptHtml(html) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${user}:${pass}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(html)
  );
  return {
    v: 1,
    iter: ITERATIONS,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    data: bytesToB64(new Uint8Array(cipher)),
  };
}

function gateHtml(payload) {
  const payloadJson = JSON.stringify(payload);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>18 and Up prototype</title>
    <link rel="icon" href="./icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600&display=swap" rel="stylesheet" />
    <style>
      :root {
        --navy: #0C2340;
        --muted: #475569;
        --gray-200: #e7e5e4;
        --gray-500: #78716c;
        --white: #ffffff;
        --danger: #dc2626;
        --danger-bg: #fee2e2;
        --font-body: Inter, system-ui, sans-serif;
        --font-heading: Poppins, Inter, sans-serif;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        min-height: 100%;
        font-family: var(--font-body);
        color: var(--navy);
        background: #d5dde6;
        -webkit-font-smoothing: antialiased;
      }
      body {
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
      }
      .card {
        width: 100%;
        max-width: 400px;
        background: var(--white);
        border-radius: 16px;
        padding: 28px 24px 24px;
        box-shadow: 0 10px 30px rgba(12, 35, 64, 0.12);
      }
      .logo {
        width: 72px;
        height: auto;
        display: block;
        margin: 0 auto 16px;
      }
      h1 {
        font-family: var(--font-heading);
        font-size: 1.35rem;
        font-weight: 600;
        text-align: center;
        margin: 0 0 6px;
      }
      .lead {
        text-align: center;
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.45;
        margin: 0 0 1.25rem;
      }
      label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--gray-500);
        margin-bottom: 0.25rem;
      }
      .field {
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 0.65rem 0.85rem 0.75rem;
        margin: 0 0 0.85rem;
        background: var(--white);
      }
      input {
        width: 100%;
        border: 0;
        outline: none;
        font: inherit;
        font-size: 1rem;
        color: var(--navy);
        background: transparent;
        padding: 0;
      }
      .error {
        display: none;
        background: var(--danger-bg);
        color: var(--danger);
        border-radius: 8px;
        padding: 0.65rem 0.75rem;
        font-size: 0.85rem;
        margin: 0 0 0.85rem;
      }
      .error.show { display: block; }
      button {
        width: 100%;
        border: 0;
        border-radius: 999px;
        background: var(--navy);
        color: var(--white);
        font-family: var(--font-heading);
        font-size: 1rem;
        font-weight: 600;
        padding: 0.85rem 1rem;
        cursor: pointer;
      }
      button:disabled { opacity: 0.6; cursor: wait; }
    </style>
  </head>
  <body>
    <form class="card" id="gate" autocomplete="on">
      <img class="logo" src="./logo-18andup.png" alt="18 and Up" />
      <h1>Protected prototype</h1>
      <p class="lead">Enter the access details you were given to continue.</p>
      <div class="error" id="err" role="alert">Those details did not match. Try again.</div>
      <div class="field">
        <label for="user">Username</label>
        <input id="user" name="username" type="text" autocomplete="username" required />
      </div>
      <div class="field">
        <label for="pass">Password</label>
        <input id="pass" name="password" type="password" autocomplete="current-password" required />
      </div>
      <button type="submit" id="go">Continue</button>
    </form>
    <script>
      const PAYLOAD = ${payloadJson};
      const CACHE_KEY = "sax_proto_session_v1";

      function b64ToBytes(b64) {
        const bin = atob(b64);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
      }

      function showUnlocked(html) {
        document.open();
        document.write(html);
        document.close();
      }

      async function deriveKey(username, password, salt, iterations) {
        const material = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(username + ":" + password),
          "PBKDF2",
          false,
          ["deriveKey"]
        );
        return crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
          material,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
      }

      async function unlock(username, password) {
        const salt = b64ToBytes(PAYLOAD.salt);
        const iv = b64ToBytes(PAYLOAD.iv);
        const data = b64ToBytes(PAYLOAD.data);
        const key = await deriveKey(username, password, salt, PAYLOAD.iter);
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);
        return new TextDecoder().decode(plain);
      }

      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        showUnlocked(cached);
      } else {
        const form = document.getElementById("gate");
        const err = document.getElementById("err");
        const go = document.getElementById("go");
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          err.classList.remove("show");
          go.disabled = true;
          try {
            const html = await unlock(
              document.getElementById("user").value,
              document.getElementById("pass").value
            );
            sessionStorage.setItem(CACHE_KEY, html);
            showUnlocked(html);
          } catch (e) {
            err.classList.add("show");
            document.getElementById("pass").value = "";
            go.disabled = false;
          }
        });
      }
    </script>
  </body>
</html>
`;
}

mkdirSync(outDir, { recursive: true });
cpSync(srcDir, outDir, {
  recursive: true,
  filter: (src) => {
    if (src.includes(`${sep}figma-ref`)) return false;
    if (src.endsWith("build_sax_patch.py")) return false;
    return true;
  },
});

const sourceHtml = readFileSync(join(srcDir, "index.html"), "utf8");
const payload = await encryptHtml(sourceHtml);
writeFileSync(join(outDir, "index.html"), gateHtml(payload));

const deployed = readFileSync(join(outDir, "index.html"), "utf8");
const gateWithoutPayload = deployed.replace(/const PAYLOAD = \{[\s\S]*?\};/, "const PAYLOAD = {};");
if (gateWithoutPayload.includes(user) || gateWithoutPayload.includes(pass)) {
  console.error("Refusing to deploy: credentials leaked into the gate page.");
  process.exit(1);
}
const uniqueMarkers = ['data-screen="journey"', "settingsJoinProgram", "Introduction to 18 and Up"];
if (uniqueMarkers.some((marker) => deployed.includes(marker))) {
  console.error("Refusing to deploy: plaintext prototype leaked into the gate page.");
  process.exit(1);
}

console.log("Protected Pages bundle written to pages-dist/");
