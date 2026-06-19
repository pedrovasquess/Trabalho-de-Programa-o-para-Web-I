const InscricaoStore = {

    obterTodas() {
        return JSON.parse(localStorage.getItem("inscricoes") || "[]");
    },

    obterPorUsuario(email) {
        return this.obterTodas().filter(function (i) {
            return i.emailUsuario === email;
        });
    },

    migrarInscricoesLegadas(email) {
        const todas = this.obterTodas();
        let alterou = false;

        todas.forEach(function (item) {
            if (!item.emailUsuario) {
                item.emailUsuario = email;
                alterou = true;
            }
        });

        if (alterou) this.salvar(todas);
    },

    salvar(inscricoes) {
        localStorage.setItem("inscricoes", JSON.stringify(inscricoes));
    }
};

let eventosDisponiveis = [];
let stepAtual = 1;
let dadosFormulario = {
    evento: "",
    nome: "",
    apelido: "",
    telefone: "",
    cidade: "",
    estado: "PB",
    funcao: "Puxador",
    categoria: "Amador"
};

async function inicializarPagina() {
    const sessao = await Session.obterSessao();

    if (!sessao) {
        document.getElementById("area-logado").style.display = "none";
        document.getElementById("area-nao-logado").style.display = "block";
        return;
    }

    document.getElementById("area-logado").style.display = "block";
    document.getElementById("area-nao-logado").style.display = "none";

    dadosFormulario.nome = sessao.nome;
    InscricaoStore.migrarInscricoesLegadas(sessao.email);

    const eventoParam = Router.obterParametro("evento");
    if (eventoParam) {
        dadosFormulario.evento = eventoParam;
    }

    await carregarEventosSelect();
    carregarInscricoes(sessao);
    irParaStep(1);
}

async function carregarEventosSelect() {
    try {
        const res = await fetch("assets/dados/eventos.json");
        eventosDisponiveis = await res.json();

        const select = document.getElementById("select-evento");
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um evento</option>';

        eventosDisponiveis.forEach(function (ev) {
            const selected = ev.nome === dadosFormulario.evento ? "selected" : "";
            select.innerHTML += `<option value="${Security.escaparHTML(ev.nome)}" ${selected}>${Security.escaparHTML(ev.nome)} — ${Security.escaparHTML(ev.data)}</option>`;
        });
    } catch (e) {
        console.error("Erro ao carregar eventos:", e);
    }
}

function irParaStep(step) {
    stepAtual = step;

    document.querySelectorAll(".step-content").forEach(function (el) {
        el.classList.remove("ativo");
    });

    document.querySelectorAll(".step").forEach(function (el, i) {
        el.classList.remove("ativo", "completo");
        if (i + 1 < step) el.classList.add("completo");
        if (i + 1 === step) el.classList.add("ativo");
    });

    const stepEl = document.getElementById("step" + step);
    if (stepEl) stepEl.classList.add("ativo");
}

function validarStep1() {
    const evento = document.getElementById("select-evento").value;
    const mensagem = document.getElementById("mensagem-erro");

    if (!evento) {
        mensagem.textContent = "Selecione um evento para continuar.";
        return;
    }

    dadosFormulario.evento = evento;
    mensagem.textContent = "";
    irParaStep(2);
}

function validarStep2() {
    const nome = document.getElementById("nome").value.trim();
    const apelido = document.getElementById("apelido").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const mensagem = document.getElementById("mensagem-erro");

    if (!nome || !apelido || !telefone) {
        mensagem.textContent = "Preencha todos os dados pessoais.";
        return;
    }

    dadosFormulario.nome = nome;
    dadosFormulario.apelido = apelido;
    dadosFormulario.telefone = telefone;
    mensagem.textContent = "";
    irParaStep(3);
}

function validarStep3() {
    const cidade = document.getElementById("cidade").value.trim();
    const estado = document.getElementById("estado").value;
    const mensagem = document.getElementById("mensagem-erro");

    if (!cidade) {
        mensagem.textContent = "Informe sua cidade.";
        return;
    }

    dadosFormulario.cidade = cidade;
    dadosFormulario.estado = estado;
    mensagem.textContent = "";
    irParaStep(4);
}

function selectCategoria(el, tipo) {
    const grupo = el.parentElement;
    grupo.querySelectorAll(".categoria-card").forEach(function (c) {
        c.classList.remove("ativo");
    });
    el.classList.add("ativo");
    dadosFormulario[tipo] = el.dataset.valor;
}

async function finalizarInscricao() {
    const sessao = await Session.obterSessao();
    if (!sessao) return;

    const eventoInfo = eventosDisponiveis.find(e => e.nome === dadosFormulario.evento);
    const todas = InscricaoStore.obterTodas();

    const existe = todas.find(
        i => i.emailUsuario === sessao.email && i.evento === dadosFormulario.evento
    );

    if (existe) {
        document.getElementById("mensagem-erro").textContent =
            "Você já está inscrito neste evento.";
        return;
    }

    const resultadoEmail = await EmailService.enviarConfirmacaoInscricao({
        email: sessao.email,
        nome: dadosFormulario.nome,
        evento: dadosFormulario.evento,
        data: eventoInfo ? eventoInfo.data : "",
        local: eventoInfo ? eventoInfo.local : "",
        categoria: dadosFormulario.categoria,
        funcao: dadosFormulario.funcao,
        status: "Aguardando Confirmação"
    });

    const inscricao = {
        emailUsuario: sessao.email,
        evento: dadosFormulario.evento,
        nome: dadosFormulario.nome,
        apelido: dadosFormulario.apelido,
        telefone: dadosFormulario.telefone,
        cidade: dadosFormulario.cidade,
        estado: dadosFormulario.estado,
        funcao: dadosFormulario.funcao,
        categoria: dadosFormulario.categoria,
        status: "Aguardando Confirmação",
        codigo: resultadoEmail.codigo,
        dataInscricao: new Date().toISOString()
    };

    todas.push(inscricao);
    InscricaoStore.salvar(todas);

    document.getElementById("codigo-inscricao").textContent = resultadoEmail.codigo;
    document.getElementById("email-confirmacao").textContent = sessao.email;

    const modal = new bootstrap.Modal(document.getElementById("modalSucesso"));
    modal.show();

    carregarInscricoes(sessao);
}

function carregarInscricoes(sessao) {
    const lista = document.getElementById("lista-inscricoes");
    const inscricoes = InscricaoStore.obterPorUsuario(sessao.email);

    if (inscricoes.length === 0) {
        lista.innerHTML = `
            <div class="evento-card inscricao-vazia">
                <p><i class="bi bi-info-circle"></i> Você ainda não possui inscrições.</p>
                <p>Use o formulário acima para se inscrever em um evento.</p>
            </div>
        `;
        return;
    }

    lista.innerHTML = "";

    inscricoes.forEach(function (item) {
        const todas = InscricaoStore.obterTodas();
        const indexGlobal = todas.findIndex(
            i => i.emailUsuario === item.emailUsuario && i.codigo === item.codigo
        );

        lista.innerHTML += `
            <div class="evento-card inscricao-item">
                <div class="inscricao-header">
                    <h3>${Security.escaparHTML(item.evento)}</h3>
                    <span class="badge-status">${Security.escaparHTML(item.status)}</span>
                </div>
                <p><strong>Código:</strong> ${Security.escaparHTML(item.codigo || "—")}</p>
                <p><strong>Função:</strong> ${Security.escaparHTML(item.funcao)} | <strong>Categoria:</strong> ${Security.escaparHTML(item.categoria)}</p>
                <p><strong>Local:</strong> ${Security.escaparHTML(item.cidade)} - ${Security.escaparHTML(item.estado)}</p>
                <button class="btn-cancelar" onclick="excluirInscricao(${indexGlobal})">
                    <i class="bi bi-x-circle"></i> Cancelar
                </button>
            </div>
        `;
    });
}

function excluirInscricao(index) {
    if (!confirm("Deseja cancelar esta inscrição?")) return;

    const todas = InscricaoStore.obterTodas();
    todas.splice(index, 1);
    InscricaoStore.salvar(todas);

    Session.obterSessao().then(function (sessao) {
        if (sessao) carregarInscricoes(sessao);
    });
}

function irParaLogin() {
    sessionStorage.setItem("redirect_apos_login", "inscricao.html");
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", function () {
    if (CONFIG.EMAILJS.PUBLIC_KEY && typeof emailjs !== "undefined") {
        emailjs.init(CONFIG.EMAILJS.PUBLIC_KEY);
    }
    inicializarPagina();
});
