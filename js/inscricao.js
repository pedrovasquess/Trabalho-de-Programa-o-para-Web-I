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

/* Máscara de telefone BR: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX */
function mascararTelefone(input) {
    let v = input.value.replace(/\D/g, "").slice(0, 11);
    if (v.length <= 10) {
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else {
        v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }
    input.value = v;
}

/* Atualiza datalist com cidades via API IBGE */
async function atualizarCidadesDatalist() {
    const estadoEl = document.getElementById("estado");
    const datalistEl = document.getElementById("lista-cidades-datalist");
    const cidadeInput = document.getElementById("cidade");
    if (!estadoEl || !datalistEl) return;

    const uf = estadoEl.value;
    if (!uf) return;

    if (cidadeInput) {
        cidadeInput.value = "";
        cidadeInput.placeholder = "Buscando cidades...";
        cidadeInput.disabled = true;
    }

    // Usa IBGEService se disponível, senão usa lista estática de fallback
    if (typeof IBGEService !== "undefined") {
        await IBGEService.popularDatalistCidades(datalistEl, uf);
    }

    if (cidadeInput) {
        cidadeInput.placeholder = "Digite ou selecione sua cidade";
        cidadeInput.disabled = false;
        cidadeInput.focus();
    }
}


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

    // Popula select de estados via IBGE (com fallback embutido)
    const selectEstado = document.getElementById("estado");
    if (typeof IBGEService !== "undefined" && selectEstado) {
        try {
            await IBGEService.popularSelectEstados(selectEstado, dadosFormulario.estado);
        } catch (e) {
            console.warn("Erro ao popular estados:", e);
            // Fallback manual se tudo falhar
            selectEstado.innerHTML = '<option value="">Selecione o estado</option>';
            IBGEService._estadosFallback.forEach(function(est) {
                const opt = document.createElement("option");
                opt.value = est.sigla;
                opt.textContent = est.sigla + " — " + est.nome;
                selectEstado.appendChild(opt);
            });
        }
    }

    await carregarEventosSelect();

    // Só busca cidades se um estado está selecionado
    if (selectEstado && selectEstado.value) {
        await atualizarCidadesDatalist();
    }

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

    // Validação de nome completo (mínimo 2 palavras, só letras e espaços, acentos)
    const reNome = /^[A-Za-zÀ-ÿ]{2,}(\s[A-Za-zÀ-ÿ]{2,})+$/;
    if (!nome) {
        mensagem.textContent = "Informe seu nome completo.";
        return;
    }
    if (!reNome.test(nome)) {
        mensagem.textContent = "Nome inválido. Digite nome e sobrenome (apenas letras, mínimo 2 palavras).";
        return;
    }

    // Validação de apelido
    if (!apelido) {
        mensagem.textContent = "Informe seu apelido na pista.";
        return;
    }
    if (apelido.length < 2) {
        mensagem.textContent = "Apelido muito curto (mínimo 2 caracteres).";
        return;
    }

    // Validação de telefone brasileiro (aceita formatos: (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX)
    const telLimpo = telefone.replace(/\D/g, "");
    if (!telLimpo) {
        mensagem.textContent = "Informe seu telefone.";
        return;
    }
    if (telLimpo.length < 10 || telLimpo.length > 11) {
        mensagem.textContent = "Telefone inválido. Use o formato (XX) 99999-9999.";
        return;
    }
    // Formata o telefone automaticamente
    const telFormatado = telLimpo.length === 11
        ? `(${telLimpo.slice(0,2)}) ${telLimpo.slice(2,7)}-${telLimpo.slice(7)}`
        : `(${telLimpo.slice(0,2)}) ${telLimpo.slice(2,6)}-${telLimpo.slice(6)}`;
    document.getElementById("telefone").value = telFormatado;

    dadosFormulario.nome = nome;
    dadosFormulario.apelido = apelido;
    dadosFormulario.telefone = telFormatado;
    mensagem.textContent = "";
    irParaStep(3);
}

async function validarStep3() {
    const cidadeInput = document.getElementById("cidade").value.trim();
    const estadoEl = document.getElementById("estado");
    const estado = estadoEl ? estadoEl.value : "";
    const mensagem = document.getElementById("mensagem-erro");

    if (!estado) {
        mensagem.textContent = "Selecione um estado.";
        return;
    }

    if (!cidadeInput) {
        mensagem.textContent = "Informe sua cidade.";
        return;
    }

    mensagem.textContent = "Verificando cidade...";

    // Valida via IBGE (suporta todos os municípios do Brasil)
    if (typeof IBGEService !== "undefined") {
        const cidadeOficial = await IBGEService.validarCidade(cidadeInput, estado);
        if (!cidadeOficial) {
            // Obtém sugestões para a mensagem de erro
            const municipios = await IBGEService.obterMunicipios(estado);
            const sugestoes = municipios.slice(0, 5).join(", ");
            mensagem.textContent = `Município "${cidadeInput}" não encontrado em ${estado}. Ex: ${sugestoes}...`;
            return;
        }
        dadosFormulario.cidade = cidadeOficial;
    } else {
        // Fallback: aceita qualquer texto se IBGE não estiver disponível
        dadosFormulario.cidade = cidadeInput;
    }

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

    const btnFinalizar = document.querySelector("button[onclick='finalizarInscricao()']");
    if (btnFinalizar) { btnFinalizar.disabled = true; btnFinalizar.textContent = "Salvando..."; }

    const eventoInfo = eventosDisponiveis.find(e => e.nome === dadosFormulario.evento);
    const todas = InscricaoStore.obterTodas();

    const existe = todas.find(
        i => i.emailUsuario === sessao.email && i.evento === dadosFormulario.evento
    );

    if (existe) {
        document.getElementById("mensagem-erro").textContent =
            "Você já está inscrito neste evento.";
        if (btnFinalizar) { btnFinalizar.disabled = false; btnFinalizar.textContent = "Finalizar Inscrição"; }
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

    if (btnFinalizar) { btnFinalizar.disabled = false; btnFinalizar.textContent = "Finalizar Inscrição"; }

    const modalEl = document.getElementById("modalSucesso");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Ao fechar o modal, reseta o formulário e volta ao step 1
    modalEl.addEventListener("hidden.bs.modal", function handler() {
        modalEl.removeEventListener("hidden.bs.modal", handler);
        resetarFormulario(sessao);
    }, { once: true });

    carregarInscricoes(sessao);
}

/* Reseta o formulário e volta ao passo 1 após inscrição */
async function resetarFormulario(sessao) {
    // Limpa os dados (mantém o nome do usuário)
    dadosFormulario = {
        evento: "",
        nome: sessao ? sessao.nome : "",
        apelido: "",
        telefone: "",
        cidade: "",
        estado: "",
        funcao: "Puxador",
        categoria: "Amador"
    };

    // Limpa campos do formulário
    const camposTexto = ["nome", "apelido", "telefone", "cidade"];
    camposTexto.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // Reseta o select de evento
    const selectEvento = document.getElementById("select-evento");
    if (selectEvento) selectEvento.selectedIndex = 0;

    // Reseta as categorias para o padrão ativo
    document.querySelectorAll(".categoria-card").forEach(card => {
        card.classList.remove("ativo");
    });
    document.querySelectorAll(".categorias").forEach(grupo => {
        const primeiro = grupo.querySelector(".categoria-card");
        if (primeiro) {
            primeiro.classList.add("ativo");
            const tipo = primeiro.closest(".step-content") ?
                (grupo.previousElementSibling && grupo.previousElementSibling.textContent.includes("Função") ? "funcao" : "categoria")
                : null;
        }
    });

    // Limpa mensagem de erro
    const msgErro = document.getElementById("mensagem-erro");
    if (msgErro) msgErro.textContent = "";

    // Repopula select de estados
    const selectEstado = document.getElementById("estado");
    if (typeof IBGEService !== "undefined" && selectEstado) {
        await IBGEService.popularSelectEstados(selectEstado, "");
    }

    // Limpa datalist de cidades
    const datalist = document.getElementById("lista-cidades-datalist");
    if (datalist) datalist.innerHTML = "";

    // Volta para o step 1
    irParaStep(1);
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
