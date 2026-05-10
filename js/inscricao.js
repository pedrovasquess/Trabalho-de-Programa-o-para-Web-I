function nextStep(step) {

    const steps = document.querySelectorAll(".step-content");

    steps.forEach(function(item) {
        item.classList.remove("ativo");
    });

    document.getElementById(`step${step}`)
        .classList.add("ativo");

    const indicadores = document.querySelectorAll(".step");

    indicadores.forEach(function(indicador) {
        indicador.classList.remove("ativo");
    });

    document.getElementById(`step${step}-ind`)
        .classList.add("ativo");

}

function selectCategoria(card) {

    const cards = document.querySelectorAll(".categoria-card");

    cards.forEach(function(item) {
        item.classList.remove("ativo");
    });

    card.classList.add("ativo");

}

function validarStep1() {

    const nome = document.getElementById("nome").value.trim();

    const apelido = document.getElementById("apelido").value.trim();

    const telefone = document.getElementById("telefone").value.trim();

    const mensagemErro =
        document.getElementById("mensagem-erro");

    mensagemErro.textContent = "";

    if (
        nome === "" ||
        apelido === "" ||
        telefone === ""
    ) {

        mensagemErro.textContent =
            "Preencha todos os campos!";

        return;
    }

    if (nome.toLowerCase() === apelido.toLowerCase()) {

        mensagemErro.textContent =
            "Nome e apelido não podem ser iguais!";

        return;
    }

    if (telefone.length < 15) {

        mensagemErro.textContent =
            "Telefone inválido!";

        return;
    }

    nextStep(2);

}

const campoTelefone =
    document.getElementById("telefone");

campoTelefone.addEventListener("input", function() {

    let telefone = campoTelefone.value;

    telefone = telefone.replace(/\D/g, "");

    telefone = telefone.replace(
        /^(\d{2})(\d)/g,
        "($1) $2"
    );

    telefone = telefone.replace(
        /(\d{5})(\d)/,
        "$1-$2"
    );

    campoTelefone.value = telefone;

});

function finalizarInscricao() {

    const modal = new bootstrap.Modal(
        document.getElementById("modalSucesso")
    );

    modal.show();

    document.getElementById("nome").value = "";
    document.getElementById("apelido").value = "";
    document.getElementById("telefone").value = "";

    nextStep(1);

}