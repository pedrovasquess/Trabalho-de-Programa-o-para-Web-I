const corpoTabela = document.getElementById("corpo-tabela");
const campoPesquisa = document.getElementById("pesquisa");
const btnOrdenarPts = document.getElementById("ordenar-pontos");
const top3Podium = document.getElementById("top3-podium");

let ranking = [];

function processarRanking() {
    ranking = RankingUtils.processarRanking(ranking);
}

function mostrarRanking(lista) {
    corpoTabela.innerHTML = "";

    lista.forEach(function (vaqueiro, index) {
        corpoTabela.innerHTML += `
            <tr>
                <td>#${index + 1}</td>
                <td>${Security.escaparHTML(vaqueiro.nome)}</td>
                <td>${Security.escaparHTML(vaqueiro.apelido)}</td>
                <td>${Security.escaparHTML(vaqueiro.cidade)}</td>
                <td>${Security.escaparHTML(vaqueiro.categoria)}</td>
                <td>${vaqueiro.pontos}</td>
                <td>${vaqueiro.vitorias}</td>
            </tr>
        `;
    });
}

fetch("assets/dados/rankings.json")
    .then(response => response.json())
    .then(function (dados) {
        ranking = dados;
        processarRanking();
        mostrarRanking(ranking);
        RankingUtils.renderizarPodio(top3Podium, dados);
    })
    .catch(function (error) {
        console.error("Erro ao carregar ranking:", error);
    });

btnOrdenarPts.addEventListener("click", function () {
    ranking.sort(function (a, b) {
        return b.pontos - a.pontos;
    });
    mostrarRanking(ranking);
});

campoPesquisa.addEventListener("input", function () {
    const textoDigitado = campoPesquisa.value.toLowerCase();

    const rankingFiltrado = ranking.filter(function (vaqueiro) {
        return (
            vaqueiro.nome.toLowerCase().includes(textoDigitado) ||
            vaqueiro.apelido.toLowerCase().includes(textoDigitado) ||
            vaqueiro.cidade.toLowerCase().includes(textoDigitado) ||
            vaqueiro.categoria.toLowerCase().includes(textoDigitado)
        );
    });

    mostrarRanking(rankingFiltrado);
});
