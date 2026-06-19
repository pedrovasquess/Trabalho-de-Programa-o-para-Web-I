const Router = {

    obterPaginaAtual() {
        const path = window.location.pathname;
        const pagina = path.split("/").pop();
        return pagina || "index.html";
    },

    ehRotaProtegida(pagina) {
        return CONFIG.ROTAS_PROTEGIDAS.includes(pagina);
    },

    async verificarAcesso() {
        const pagina = this.obterPaginaAtual();

        if (!this.ehRotaProtegida(pagina)) {
            return true;
        }

        const sessao = await Session.obterSessao();

        if (!sessao) {
            sessionStorage.setItem("redirect_apos_login", pagina);
            window.location.href = "login.html";
            return false;
        }

        return true;
    },

    redirecionarPosLogin() {
        const destino = sessionStorage.getItem("redirect_apos_login");
        sessionStorage.removeItem("redirect_apos_login");

        if (destino && destino !== "login.html") {
            window.location.href = destino;
        } else {
            window.location.href = "index.html";
        }
    },

    obterParametro(nome) {
        const params = new URLSearchParams(window.location.search);
        return params.get(nome);
    },

    irPara(pagina, params) {
        let url = pagina;
        if (params) {
            const query = new URLSearchParams(params).toString();
            url += "?" + query;
        }
        window.location.href = url;
    }
};

document.addEventListener("DOMContentLoaded", function () {
    Router.verificarAcesso();
});
