const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

// Deriva una CryptoKey a partir de un string (tu secreto compartido)
async function deriveKey(secret) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("couple-app-salt-v1"),
            iterations: 100_000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ["encrypt", "decrypt"]
    );
}

// Cachea la clave en memoria para no derivarla en cada mensaje
let cachedKey = null;

async function getKey() {
    if (cachedKey) return cachedKey;

    // Lee la clave de encriptación desde la variable de entorno de Vite
    const secret = import.meta.env.VITE_ENCRYPTION_KEY;
    if (!secret) throw new Error("VITE_ENCRYPTION_KEY no definida");

    cachedKey = await deriveKey(secret);
    return cachedKey;
}

// Encripta un string → devuelve string Base64 (iv + ciphertext)
export async function encryptMessage(plaintext) {
    const key = await getKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits, recomendado para AES-GCM

    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encoder.encode(plaintext)
    );

    // Combina iv + ciphertext en un solo buffer y lo convierte a Base64
    const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.byteLength);

    return btoa(String.fromCharCode(...combined));
}

// Desencripta un string Base64 → devuelve el texto plano
export async function decryptMessage(base64) {
    try {
        const key = await getKey();
        const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const plaintext = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(plaintext);
    } catch (err) {
        return base64;
    }
}