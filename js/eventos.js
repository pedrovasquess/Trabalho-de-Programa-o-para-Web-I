
const listaEventos = document.getElementById("lista-eventos");
const campoPesquisa = document.getElementById("pesquisa-evento");
const conteudoModal = document.getElementById("conteudo-modal");

function mostrarEventos(lista) {

    listaEventos.innerHTML = "";

    lista.forEach(function(evento, index) {

        listaEventos.innerHTML += `
            <div class="evento-card">

                <p class="status-card">
                    ${evento.status}
                </p>

                <h3>${evento.nome}</h3>

                <p>
                    <strong>Data:</strong> ${evento.data}
                </p>

                <span>
                    <i class="bi bi-geo-alt"></i>
                    ${evento.local}
                </span>
            
                <button class="btn-detalhes" data-index="${index}">
                    Detalhes
                </button>

            </div>
        `;

    });

    const botoesDetalhes = document.querySelectorAll(".btn-detalhes");

    botoesDetalhes.forEach(function(botao) {

        botao.addEventListener("click", function() {

            const index = botao.dataset.index;

            const eventoSelecionado = lista[index];

            conteudoModal.innerHTML = `
                <p><strong>Evento:</strong> ${eventoSelecionado.nome}</p>

                <p><strong>Status:</strong> ${eventoSelecionado.status}</p>

                <p><strong>Data:</strong> ${eventoSelecionado.data}</p>

                <p><strong>Local:</strong> ${eventoSelecionado.local}</p>

                <p><strong>Premiação:</strong> ${eventoSelecionado.premio}</p>

                <p><strong>Categoria:</strong> ${eventoSelecionado.categoria}</p>
            `;

            const modal = new bootstrap.Modal(
                document.getElementById("modalEvento")
            );

            modal.show();

        });

    });

}

campoPesquisa.addEventListener("input", function() {

    const textoDigitado = campoPesquisa.value.toLowerCase();

    const eventosFiltrados = eventos.filter(function(evento) {

        return evento.nome.toLowerCase().includes(textoDigitado);

    });

    mostrarEventos(eventosFiltrados);

});

mostrarEventos(eventos);

