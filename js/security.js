const Security = {

    escaparHTML(texto) {
        const div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    },

    validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    validarSenha(senha) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(senha);
    },

    async hashSenha(senha) {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));

        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(senha),
            "PBKDF2",
            false,
            ["deriveBits"]
        );

        const hashBuffer = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            256
        );

        const saltB64 = btoa(String.fromCharCode(...salt));
        const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

        return saltB64 + ":" + hashB64;
    },

    async verificarSenha(senha, hashArmazenado) {
        if (!hashArmazenado || !hashArmazenado.includes(":")) {
            return false;
        }

        const [saltB64, hashB64] = hashArmazenado.split(":");
        const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
        const encoder = new TextEncoder();

        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(senha),
            "PBKDF2",
            false,
            ["deriveBits"]
        );

        const hashBuffer = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            256
        );

        const novoHash = btoa(
            String.fromCharCode(...new Uint8Array(hashBuffer))
        );

        return novoHash === hashB64;
    },

    async criarJWT(payload) {
        const header = { alg: "HS256", typ: "JWT" };
        const exp = Math.floor(Date.now() / 1000) + (CONFIG.JWT_EXPIRY_HOURS * 3600);
        const dados = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

        const headerB64 = btoa(JSON.stringify(header))
            .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const payloadB64 = btoa(JSON.stringify(dados))
            .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

        const assinatura = await this._assinar(headerB64 + "." + payloadB64);

        return headerB64 + "." + payloadB64 + "." + assinatura;
    },

    async verificarJWT(token) {
        if (!token) return null;

        const partes = token.split(".");
        if (partes.length !== 3) return null;

        const [headerB64, payloadB64, assinatura] = partes;
        const assinaturaEsperada = await this._assinar(headerB64 + "." + payloadB64);

        if (assinatura !== assinaturaEsperada) return null;

        const payload = JSON.parse(
            atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
        );

        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    },

    async _assinar(dados) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(CONFIG.JWT_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const assinatura = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(dados)
        );

        return btoa(String.fromCharCode(...new Uint8Array(assinatura)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    },

    gerarTokenRecuperacao() {
        const token = crypto.getRandomValues(new Uint8Array(32));
        return Array.from(token, b => b.toString(16).padStart(2, "0")).join("");
    },

    aplicarCSP() {
        if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            return;
        }

        const meta = document.createElement("meta");
        meta.httpEquiv = "Content-Security-Policy";
        meta.content = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://accounts.google.com https://apis.google.com",
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "connect-src 'self' https://api.rss2json.com https://api.emailjs.com https://accounts.google.com",
            "frame-src https://www.youtube.com https://www.youtube-nocookie.com"
        ].join("; ");

        document.head.appendChild(meta);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    Security.aplicarCSP();
});
