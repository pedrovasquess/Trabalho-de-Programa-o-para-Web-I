const NoticiasService = {

    async carregar() {
        const manchete = document.getElementById("manchete-principal");
        const grid = document.getElementById("noticias-grid");
        const status = document.getElementById("noticias-status");

        if (status) {
            status.innerHTML = '<p class="loading-noticias"><i class="bi bi-arrow-repeat"></i> Carregando notícias...</p>';
        }

        let noticias = [];

        try {
            noticias = await this._buscarRSS();
        } catch (e) {
            console.warn("RSS indisponível, usando dados locais.", e);
        }

        if (noticias.length === 0) {
            const res = await fetch("assets/dados/noticias.json");
            noticias = await res.json();
        }

        if (status) status.innerHTML = "";

        this._renderizar(noticias, manchete, grid);
    },

    async _buscarRSS() {
        const noticias = [];

        for (const feedUrl of CONFIG.RSS_FEEDS) {
            try {
                const url = "https://api.rss2json.com/v1/api.json?rss_url=" +
                    encodeURIComponent(feedUrl);
                const res = await fetch(url);

                if (!res.ok) continue;

                const data = await res.json();

                if (data.items) {
                    data.items.slice(0, 6).forEach(function (item) {
                        noticias.push({
                            titulo: item.title,
                            resumo: item.description
                                ? item.description.replace(/<[^>]*>/g, "").substring(0, 180) + "..."
                                : "Sem resumo disponível.",
                            imagem: item.thumbnail || item.enclosure?.link ||
                                "https://images.unsplash.com/photo-1517841905240-472988babdf9",
                            link: item.link,
                            data: item.pubDate,
                            fonte: data.feed?.title || "Feed RSS",
                            tipo: "normal"
                        });
                    });
                }
            } catch (e) {
                continue;
            }
        }

        if (noticias.length > 0) {
            noticias[0].tipo = "manchete";
        }

        return noticias;
    },

    _renderizar(noticias, manchete, grid) {
        manchete.innerHTML = "";
        grid.innerHTML = "";

        noticias.forEach(function (noticia) {
            const titulo = Security.escaparHTML(noticia.titulo);
            const resumo = Security.escaparHTML(noticia.resumo);
            const imagem = Security.escaparHTML(noticia.imagem);
            const fonte = noticia.fonte ? Security.escaparHTML(noticia.fonte) : "";
            const link = noticia.link ? Security.escaparHTML(noticia.link) : "#";

            if (noticia.tipo === "manchete") {
                manchete.innerHTML = `
                    <div class="hero-noticia">
                        <img src="${imagem}" alt="${titulo}" loading="lazy">
                        <div class="hero-overlay">
                            <span>DESTAQUE</span>
                            ${fonte ? '<span class="fonte-noticia">' + fonte + '</span>' : ''}
                            <h1>${titulo}</h1>
                            <p>${resumo}</p>
                            ${noticia.link ? '<a href="' + link + '" target="_blank" rel="noopener" class="btn-leia-mais">Leia mais <i class="bi bi-arrow-right"></i></a>' : ''}
                        </div>
                    </div>
                `;
            } else {
                grid.innerHTML += `
                    <article class="card-noticia">
                        <img src="${imagem}" alt="${titulo}" loading="lazy">
                        <div class="conteudo-noticia">
                            ${fonte ? '<span class="fonte-noticia">' + fonte + '</span>' : ''}
                            <h3>${titulo}</h3>
                            <p>${resumo}</p>
                            ${noticia.link ? '<a href="' + link + '" target="_blank" rel="noopener" class="link-noticia">Leia mais</a>' : ''}
                        </div>
                    </article>
                `;
            }
        });
    }
};

document.addEventListener("DOMContentLoaded", function () {
    NoticiasService.carregar();
});
