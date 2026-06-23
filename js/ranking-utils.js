const RankingUtils = {

    processarRanking(ranking) {
        const copia = ranking.map(v => ({ ...v }));

        copia.forEach(function (vaqueiro) {
            vaqueiro.pontos = vaqueiro.vitorias * 200;
        });

        copia.sort(function (a, b) {
            return b.pontos - a.pontos;
        });

        if (copia.length >= 3) {
            copia[0].pontos += 200;
            copia[1].pontos += 150;
            copia[2].pontos += 100;
        }

        copia.sort(function (a, b) {
            return b.pontos - a.pontos;
        });

        return copia;
    },

    obterTop3(ranking) {
        const processado = this.processarRanking(ranking);
        const top3 = processado.slice(0, 3);

        if (top3.length < 3) return top3;

        return [top3[1], top3[0], top3[2]];
    },

    renderizarPodio(container, ranking) {
        if (!container) return;

        const processado = this.processarRanking(ranking);
        const top3 = processado.slice(0, 3);
        /* Ordem visual: 2º à esquerda, 1º ao centro, 3º à direita */
        const ordemVisual = top3.length >= 3
            ? [top3[1], top3[0], top3[2]]
            : top3;

        /* Classes por posição visual (index 0=2º, 1=1º, 2=3º) */
        const classes = ["segundo", "primeiro", "terceiro"];

        /* Ícones de medalha */
        const medalhas = { 1: "🥇", 2: "🥈", 3: "🥉" };

        container.innerHTML = "";

        ordemVisual.forEach(function (vaqueiro, i) {
            const posicao = processado.findIndex(function (v) {
                return v.nome === vaqueiro.nome;
            }) + 1;

            const classeCard = top3.length >= 3 ? classes[i] : "";

            container.innerHTML += `
                <div class="card ${classeCard}">
                    <h3>${medalhas[posicao] || "#" + posicao}</h3>
                    <p><strong>${Security.escaparHTML(vaqueiro.nome)}</strong></p>
                    <span>"${Security.escaparHTML(vaqueiro.apelido)}"</span>
                    <p>${Security.escaparHTML(vaqueiro.cidade)}</p>
                    <div class="info">
                        <div><strong>${vaqueiro.pontos}</strong><span>Pontos</span></div>
                        <div><strong>${vaqueiro.vitorias}</strong><span>Vitórias</span></div>
                    </div>
                </div>
            `;
        });
    }
};
