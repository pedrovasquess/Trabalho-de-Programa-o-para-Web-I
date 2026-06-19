const CookieManager = {

    definirCookieSessao(nome, token) {
        const secure = CONFIG.COOKIE_SECURE ? "; Secure" : "";
        const maxAge = CONFIG.SESSION_COOKIE_MAX_AGE;

        document.cookie = `vaquejada_sessao=ativo; max-age=${maxAge}; path=/; SameSite=Strict${secure}`;
        document.cookie = `usuario=${encodeURIComponent(nome)}; max-age=${maxAge}; path=/; SameSite=Strict${secure}`;

        if (token) {
            document.cookie = `jwt_ref=${encodeURIComponent(token.substring(0, 32))}; max-age=${maxAge}; path=/; SameSite=Strict${secure}`;
        }
    },

    removerCookiesSessao() {
        const secure = CONFIG.COOKIE_SECURE ? "; Secure" : "";
        const expirar = "max-age=0; path=/; SameSite=Strict" + secure;

        document.cookie = `vaquejada_sessao=; ${expirar}`;
        document.cookie = `usuario=; ${expirar}`;
        document.cookie = `jwt_ref=; ${expirar}`;
    },

    obterCookie(nome) {
        const cookies = document.cookie.split(";");

        for (const cookie of cookies) {
            const c = cookie.trim();
            if (c.startsWith(nome + "=")) {
                return decodeURIComponent(c.substring(nome.length + 1));
            }
        }

        return null;
    },

    sessaoAtivaViaCookie() {
        return this.obterCookie("vaquejada_sessao") === "ativo";
    }
};

function obterCookie(nome) {
    return CookieManager.obterCookie(nome);
}
