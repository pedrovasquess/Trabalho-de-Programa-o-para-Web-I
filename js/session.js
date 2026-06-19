const Session = {

    async iniciarSessao(usuario) {
        const dadosSessao = {
            nome: usuario.nome,
            email: usuario.email,
            provider: usuario.provider || "local"
        };

        const token = await Security.criarJWT(dadosSessao);

        sessionStorage.setItem("jwt_token", token);
        sessionStorage.setItem("sessao_ativa", "true");

        const usuarioSeguro = {
            nome: usuario.nome,
            email: usuario.email,
            provider: usuario.provider || "local"
        };

        localStorage.setItem("usuarioLogado", JSON.stringify(usuarioSeguro));

        CookieManager.definirCookieSessao(usuario.nome, token);

        return token;
    },

    async obterSessao() {
        const token = sessionStorage.getItem("jwt_token");

        if (token) {
            const payload = await Security.verificarJWT(token);
            if (payload) return payload;
        }

        const usuarioLocal = localStorage.getItem("usuarioLogado");
        if (!usuarioLocal) return null;

        try {
            const usuario = JSON.parse(usuarioLocal);
            if (usuario && usuario.email) {
                await this.iniciarSessao(usuario);
                return usuario;
            }
        } catch (e) {
            return null;
        }

        return null;
    },

    obterUsuarioLocal() {
        try {
            return JSON.parse(localStorage.getItem("usuarioLogado") || "null");
        } catch (e) {
            return null;
        }
    },

    estaAutenticado() {
        return sessionStorage.getItem("sessao_ativa") === "true"
            || !!localStorage.getItem("usuarioLogado");
    },

    encerrarSessao() {
        sessionStorage.removeItem("jwt_token");
        sessionStorage.removeItem("sessao_ativa");
        sessionStorage.removeItem("redirect_apos_login");
        localStorage.removeItem("usuarioLogado");
        CookieManager.removerCookiesSessao();
    }
};
