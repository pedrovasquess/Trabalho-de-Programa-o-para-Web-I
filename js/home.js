
const rankingHome = document.getElementById("ranking-home");
const eventosHome = document.getElementById("eventos-home");

let ranking = [];
let eventos = [];

function carregarRanking() {
    const ordemVisual = RankingUtils.obterTop3(ranking);
    const processado = RankingUtils.processarRanking(ranking);

    rankingHome.innerHTML = "";

    /* Ordem visual: [2º, 1º, 3º] — classes por posição visual */
    const classesVisuais = ["card-segundo", "card-primeiro", "card-terceiro"];
    const medalhas = { 1: "🥇", 2: "🥈", 3: "🥉" };

    ordemVisual.forEach(function (vaqueiro, i) {
        const posicao = processado.findIndex(v => v.nome === vaqueiro.nome) + 1;
        const classeCard = ordemVisual.length >= 3 ? classesVisuais[i] : "";

        rankingHome.innerHTML += `
            <div class="card ${classeCard}">
                <span class="tag">${Security.escaparHTML(vaqueiro.categoria)}</span>
                <h1 class="posicao">${medalhas[posicao] || "#" + posicao}</h1>
                <p class="nome"><strong>${Security.escaparHTML(vaqueiro.nome)}</strong></p>
                <p>"${Security.escaparHTML(vaqueiro.apelido)}"</p>
                <p class="local">${Security.escaparHTML(vaqueiro.cidade)}</p>
                <div class="info">
                    <div><strong>${vaqueiro.pontos}</strong><span>Pontos</span></div>
                    <div><strong>${vaqueiro.vitorias}</strong><span>Vitórias</span></div>
                </div>
            </div>
        `;
    });
}

function carregarEventos() {
    const hoje = new Date();

    const eventosAtivos = eventos.filter(function (evento) {
        const [dia, mes, ano] = evento.data.split("/");
        const dataEvento = new Date(ano, mes - 1, dia);
        return dataEvento >= hoje;
    });

    eventosAtivos.sort(function (a, b) {
        const [diaA, mesA, anoA] = a.data.split("/");
        const [diaB, mesB, anoB] = b.data.split("/");
        return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB);
    });

    const proximosEventos = eventosAtivos.slice(0, 3);
    eventosHome.innerHTML = "";

    proximosEventos.forEach(function (evento) {
        eventosHome.innerHTML += `
            <div class="boxes">
                <p><span><i class="bi bi-calendar"></i> ${Security.escaparHTML(evento.data)}</span></p>
                <h3><strong>${Security.escaparHTML(evento.nome)}</strong></h3>
                <p class="local">${Security.escaparHTML(evento.local)}</p>
            </div>
        `;
    });
}

Promise.all([
    fetch("assets/dados/rankings.json").then(res => res.json()),
    fetch("assets/dados/eventos.json").then(res => res.json())
])
.then(function ([rankingData, eventosData]) {
    ranking = rankingData;
    eventos = eventosData;
    carregarRanking();
    carregarEventos();
})
.catch(function (error) {
    console.error("Erro ao carregar dados:", error);
});
