const rankingHome = document.getElementById("ranking-home");

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

const top3 = ranking.slice(0, 3);

const ordemVisual = [
    top3[1],
    top3[0],
    top3[2]
];

rankingHome.innerHTML = "";

ordemVisual.forEach(function(vaqueiro, index) {

    rankingHome.innerHTML += `

        <div class="card">

            <span class="tag">
                ${vaqueiro.categoria}
            </span>

            <h1 class="posicao">
                #${ranking.indexOf(vaqueiro) + 1}
            </h1>

            <p class="nome">
                <strong>${vaqueiro.nome}</strong>
            </p>

            <p>
                "${vaqueiro.apelido}"
            </p>

            <p class="local">
                ${vaqueiro.cidade}
            </p>

            <div class="info">

                <div>
                    <strong>${vaqueiro.pontos}</strong>
                    <span>Pontos</span>
                </div>

                <div>
                    <strong>${vaqueiro.vitorias}</strong>
                    <span>Vitórias</span>
                </div>

            </div>

        </div>

    `;

});

const eventosHome = document.getElementById("eventos-home");

const eventosAtivos = eventos.filter(function(evento) {

    return evento.status !== "Finalizado";

});

eventosAtivos.sort(function(a, b) {

    const dataA = b.data.split("/").reverse().join("-");
    const dataB = a.data.split("/").reverse().join("-");

    return new Date(dataA) - new Date(dataB);

});

const proximosEventos = eventosAtivos.slice(0, 3);

eventosHome.innerHTML = "";

proximosEventos.forEach(function(evento) {

    eventosHome.innerHTML += `

        <div class="boxes">

            <p>
                <span>
                    <i class="bi bi-calendar"></i>
                    ${evento.data}
                </span>
            </p>

            <h3>
                <strong>${evento.nome}</strong>
            </h3>

            <p class="local">
                ${evento.local}
            </p>

        </div>

    `;

});