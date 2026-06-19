document.addEventListener("DOMContentLoaded", async function () {
    const pagina = Router.obterPaginaAtual();

    if (!Router.ehRotaProtegida(pagina)) {
        return;
    }

    const sessao = await Session.obterSessao();

    if (!sessao) {
        sessionStorage.setItem("redirect_apos_login", pagina);
        window.location.href = "login.html";
    }
});
