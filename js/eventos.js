const listaEventos = document.getElementById("lista-eventos");
const campoPesquisa = document.getElementById("pesquisa-evento");
const conteudoModal = document.getElementById("conteudo-modal");

let eventos = [];

function calcularStatus(dataEvento) {
    const hoje = new Date();
    const [dia, mes, ano] = dataEvento.split("/");
    const data = new Date(ano, mes - 1, dia);
    return data < hoje ? "Finalizado" : "Em Breve";
}

function mostrarEventos(lista) {
    listaEventos.innerHTML = "";

    lista.forEach(function (evento, index) {
        listaEventos.innerHTML += `
            <div class="evento-card">
                <p class="status-card">${calcularStatus(evento.data)}</p>
                <h3>${Security.escaparHTML(evento.nome)}</h3>
                <p><strong>Data:</strong> ${Security.escaparHTML(evento.data)}</p>
                <span><i class="bi bi-geo-alt"></i> ${Security.escaparHTML(evento.local)}</span>
                <button class="btn-detalhes" data-index="${index}">Detalhes</button>
            </div>
        `;
    });

    document.querySelectorAll(".btn-detalhes").forEach(function (botao) {
        botao.addEventListener("click", function () {
            const index = botao.dataset.index;
            const eventoSelecionado = lista[index];

            conteudoModal.innerHTML = `
                <p><strong>Evento:</strong> ${Security.escaparHTML(eventoSelecionado.nome)}</p>
                <p><strong>Status:</strong> ${calcularStatus(eventoSelecionado.data)}</p>
                <p><strong>Data:</strong> ${Security.escaparHTML(eventoSelecionado.data)}</p>
                <p><strong>Local:</strong> ${Security.escaparHTML(eventoSelecionado.local)}</p>
                <p><strong>Premiação:</strong> ${Security.escaparHTML(eventoSelecionado.premio)}</p>
                <p><strong>Categoria:</strong> ${Security.escaparHTML(eventoSelecionado.categoria)}</p>
                <button class="btn-proximo" id="btn-inscrever-modal">Inscrever-se</button>
            `;

            document.getElementById("btn-inscrever-modal").addEventListener("click", function () {
                inscreverEvento(eventoSelecionado);
            });

            const modal = new bootstrap.Modal(document.getElementById("modalEvento"));
            modal.show();
        });
    });
}

campoPesquisa.addEventListener("input", function () {
    const textoDigitado = campoPesquisa.value.toLowerCase();
    const eventosFiltrados = eventos.filter(function (evento) {
        return evento.nome.toLowerCase().includes(textoDigitado);
    });
    mostrarEventos(eventosFiltrados);
});

fetch("assets/dados/eventos.json")
    .then(response => response.json())
    .then(function (dados) {
        eventos = dados;
        mostrarEventos(eventos);
    })
    .catch(function (error) {
        console.error(error);
    });

async function inscreverEvento(evento) {
    const sessao = await Session.obterSessao();

    if (!sessao) {
        alert("É necessário possuir cadastro para se inscrever.");
        sessionStorage.setItem("redirect_apos_login", "inscricao.html");
        setTimeout(function () {
            window.location.href = "login.html";
        }, 1000);
        return;
    }

    Router.irPara("inscricao.html", { evento: evento.nome });
}
