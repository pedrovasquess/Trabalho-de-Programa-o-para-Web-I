const Navbar = {

    async inicializar() {
        this._destacarPaginaAtual();
        await this._atualizarMenuLogin();
        this._inicializarHamburger();
    },

    _destacarPaginaAtual() {
        const pagina = Router.obterPaginaAtual().replace(".html", "");
        const links = document.querySelectorAll(".menu a[data-page]");

        links.forEach(function (link) {
            link.classList.remove(
                "menu-item-inicio",
                "menu-item-ranking",
                "menu-item-eventos",
                "menu-item-noticias",
                "menu-item-inscricao",
                "menu-item-login"
            );

            if (link.dataset.page === pagina) {
                const mapa = {
                    index: "menu-item-inicio",
                    ranking: "menu-item-ranking",
                    eventos: "menu-item-eventos",
                    noticias: "menu-item-noticias",
                    inscricao: "menu-item-inscricao",
                    login: "menu-item-login"
                };
                const classe = mapa[pagina];
                if (classe) link.classList.add(classe);
            }
        });
    },

    async _atualizarMenuLogin() {
        const menuLogin = document.getElementById("menu-login");
        if (!menuLogin) return;

        const sessao = await Session.obterSessao();

        if (sessao) {
            const primeiroNome = Security.escaparHTML(sessao.nome.split(" ")[0]);
            menuLogin.innerHTML = `<span><i class="bi bi-box-arrow-right"></i> Sair (${primeiroNome})</span>`;
            menuLogin.href = "#";
            menuLogin.onclick = logout;
        } else {
            menuLogin.innerHTML = `<span><i class="bi bi-box-arrow-in-right"></i> Entrar</span>`;
            menuLogin.href = "login.html";
            menuLogin.onclick = null;
        }
    },

    _inicializarHamburger() {
        const btn = document.getElementById("hamburger-btn");
        const menu = document.getElementById("nav-menu");

        if (!btn || !menu) return;

        btn.addEventListener("click", function () {
            menu.classList.toggle("menu-aberto");
            btn.classList.toggle("ativo");

            const icon = btn.querySelector("i");
            if (icon) {
                icon.classList.toggle("bi-list");
                icon.classList.toggle("bi-x-lg");
            }
        });

        menu.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                menu.classList.remove("menu-aberto");
                btn.classList.remove("ativo");
                const icon = btn.querySelector("i");
                if (icon) {
                    icon.classList.add("bi-list");
                    icon.classList.remove("bi-x-lg");
                }
            });
        });
    }
};

document.addEventListener("DOMContentLoaded", function () {
    Navbar.inicializar();
});
