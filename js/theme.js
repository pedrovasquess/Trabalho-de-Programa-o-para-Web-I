const Theme = {

    inicializar() {
        const btnTema = document.getElementById("tema-btn");

        if (localStorage.getItem("tema") === "escuro") {
            document.body.classList.add("tema-escuro");
            this._atualizarIcone(btnTema, true);
        }

        if (!btnTema) return;

        btnTema.addEventListener("click", function () {
            document.body.classList.toggle("tema-escuro");
            const escuro = document.body.classList.contains("tema-escuro");
            localStorage.setItem("tema", escuro ? "escuro" : "claro");
            Theme._atualizarIcone(btnTema, escuro);
        });
    },

    _atualizarIcone(btn, escuro) {
        if (!btn) return;
        const icon = btn.querySelector("i");
        if (!icon) return;
        icon.className = escuro ? "bi bi-sun" : "bi bi-moon-stars";
    }
};

document.addEventListener("DOMContentLoaded", function () {
    Theme.inicializar();
});
