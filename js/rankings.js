
const corpoTabela = document.getElementById("corpo-tabela");
const campoPesquisa = document.getElementById("pesquisa");
const btnOrdenarPts = document.getElementById("ordenar-pontos");



ranking.forEach(function(vaqueiro) {

    vaqueiro.pontos = vaqueiro.vitorias * 200;

});

ranking.sort(function(a, b) {

    return b.pontos - a.pontos;

});

ranking[0].pontos += 200;
ranking[1].pontos += 150;
ranking[2].pontos += 100;

ranking.sort(function(a, b) {

    return b.pontos - a.pontos;

});

function mostrarRanking(lista) {

    corpoTabela.innerHTML = "";

    lista.forEach(function(vaqueiro, index) {

        corpoTabela.innerHTML += `
            <tr>
                <td>#${index + 1}</td>
                <td>${vaqueiro.nome}</td>
                <td>${vaqueiro.apelido}</td>
                <td>${vaqueiro.cidade}</td>
                <td>${vaqueiro.categoria}</td>
                <td>${vaqueiro.pontos}</td>
                <td>${vaqueiro.vitorias}</td>
            </tr>
        `;

    });

}

mostrarRanking(ranking);

btnOrdenarPts.addEventListener("click", function() {
    
    ranking.sort(function(a, b) {

        return b.pontos - a.pontos;

    });

    mostrarRanking(ranking);

});

campoPesquisa.addEventListener("input", function() {

    const textoDigitado = campoPesquisa.value.toLowerCase();

    const rankingFiltrado = ranking.filter(function(vaqueiro) {

        return (
            vaqueiro.nome.toLowerCase().includes(textoDigitado) ||
            vaqueiro.apelido.toLowerCase().includes(textoDigitado) ||
            vaqueiro.cidade.toLowerCase().includes(textoDigitado) ||
            vaqueiro.categoria.toLowerCase().includes(textoDigitado)
        );

    });

    mostrarRanking(rankingFiltrado);

});