/**
 * IBGEService — integração com a API pública do IBGE
 * Endpoint: https://servicodados.ibge.gov.br/api/v1/localidades/
 *
 * Fornece todos os estados e municípios do Brasil.
 * Quando a API falha (ex: abrindo via file://), usa fallback estático
 * com os estados brasileiros e permite qualquer nome de cidade.
 */
const IBGEService = {

    _baseUrl: "https://servicodados.ibge.gov.br/api/v1/localidades",

    /* Cache em memória */
    _cacheMunicipios: {},
    _apiDisponivel: null, // null = não testado, true/false depois

    /* Fallback estático: todos os 27 estados do Brasil */
    _estadosFallback: [
        { sigla: "AC", nome: "Acre" },
        { sigla: "AL", nome: "Alagoas" },
        { sigla: "AM", nome: "Amazonas" },
        { sigla: "AP", nome: "Amapá" },
        { sigla: "BA", nome: "Bahia" },
        { sigla: "CE", nome: "Ceará" },
        { sigla: "DF", nome: "Distrito Federal" },
        { sigla: "ES", nome: "Espírito Santo" },
        { sigla: "GO", nome: "Goiás" },
        { sigla: "MA", nome: "Maranhão" },
        { sigla: "MG", nome: "Minas Gerais" },
        { sigla: "MS", nome: "Mato Grosso do Sul" },
        { sigla: "MT", nome: "Mato Grosso" },
        { sigla: "PA", nome: "Pará" },
        { sigla: "PB", nome: "Paraíba" },
        { sigla: "PE", nome: "Pernambuco" },
        { sigla: "PI", nome: "Piauí" },
        { sigla: "PR", nome: "Paraná" },
        { sigla: "RJ", nome: "Rio de Janeiro" },
        { sigla: "RN", nome: "Rio Grande do Norte" },
        { sigla: "RO", nome: "Rondônia" },
        { sigla: "RR", nome: "Roraima" },
        { sigla: "RS", nome: "Rio Grande do Sul" },
        { sigla: "SC", nome: "Santa Catarina" },
        { sigla: "SE", nome: "Sergipe" },
        { sigla: "SP", nome: "São Paulo" },
        { sigla: "TO", nome: "Tocantins" }
    ],

    async obterEstados() {
        const chaveCache = "ibge_estados";
        const cached = sessionStorage.getItem(chaveCache);
        if (cached) return JSON.parse(cached);

        try {
            const res = await fetch(`${this._baseUrl}/estados?orderBy=nome`);
            if (!res.ok) throw new Error("Erro HTTP " + res.status);
            const dados = await res.json();
            if (!Array.isArray(dados) || dados.length === 0) throw new Error("Sem dados");
            this._apiDisponivel = true;
            sessionStorage.setItem(chaveCache, JSON.stringify(dados));
            return dados;
        } catch (e) {
            console.warn("IBGEService: API indisponível, usando estados embutidos.", e.message);
            this._apiDisponivel = false;
            return this._estadosFallback;
        }
    },

    async obterMunicipios(uf) {
        if (!uf) return [];

        /* Cache em memória */
        if (this._cacheMunicipios[uf]) {
            return this._cacheMunicipios[uf];
        }

        /* Cache em sessionStorage */
        const chaveCache = `ibge_municipios_${uf}`;
        const cached = sessionStorage.getItem(chaveCache);
        if (cached) {
            const lista = JSON.parse(cached);
            this._cacheMunicipios[uf] = lista;
            return lista;
        }

        /* Se já sabemos que a API não funciona, retorna vazio (permite qualquer cidade) */
        if (this._apiDisponivel === false) {
            return [];
        }

        try {
            const res = await fetch(
                `${this._baseUrl}/estados/${uf}/municipios?orderBy=nome`
            );
            if (!res.ok) throw new Error("Erro HTTP " + res.status);
            const dados = await res.json();
            if (!Array.isArray(dados)) throw new Error("Dados inválidos");
            const nomes = dados.map(m => m.nome);
            sessionStorage.setItem(chaveCache, JSON.stringify(nomes));
            this._cacheMunicipios[uf] = nomes;
            this._apiDisponivel = true;
            return nomes;
        } catch (e) {
            console.warn(`IBGEService: falha ao buscar municípios de ${uf}.`, e.message);
            this._apiDisponivel = false;
            return [];
        }
    },

    /* Valida se uma cidade pertence ao estado. 
       Se a API não está disponível, aceita qualquer cidade. */
    async validarCidade(cidade, uf) {
        const municipios = this._cacheMunicipios[uf]
            || await this.obterMunicipios(uf);

        /* Se não temos lista de municípios (API offline), aceita qualquer nome */
        if (!municipios || municipios.length === 0) {
            return cidade; // aceita como está
        }

        const normalizar = str =>
            str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        const cidadeNorm = normalizar(cidade);
        return municipios.find(m => normalizar(m) === cidadeNorm) || null;
    },

    /* Preenche um <select> com todos os estados */
    async popularSelectEstados(selectEl, ufSelecionada) {
        if (!selectEl) return;

        selectEl.innerHTML = '<option value="">Carregando estados...</option>';
        const estados = await this.obterEstados();

        if (!estados || estados.length === 0) {
            /* Último fallback: usa a lista embutida */
            const fallback = this._estadosFallback;
            selectEl.innerHTML = '<option value="">Selecione o estado</option>';
            fallback.forEach(est => {
                const opt = document.createElement("option");
                opt.value = est.sigla;
                opt.textContent = `${est.sigla} — ${est.nome}`;
                if (est.sigla === ufSelecionada) opt.selected = true;
                selectEl.appendChild(opt);
            });
            return;
        }

        selectEl.innerHTML = '<option value="">Selecione o estado</option>';
        estados.forEach(est => {
            const opt = document.createElement("option");
            opt.value = est.sigla;
            opt.textContent = `${est.sigla} — ${est.nome}`;
            if (est.sigla === ufSelecionada) opt.selected = true;
            selectEl.appendChild(opt);
        });
    },

    /* Preenche um <datalist> com municípios do estado */
    async popularDatalistCidades(datalistEl, uf) {
        if (!datalistEl || !uf) return;

        datalistEl.innerHTML = "";
        const municipios = await this.obterMunicipios(uf);

        if (municipios && municipios.length > 0) {
            municipios.forEach(nome => {
                const opt = document.createElement("option");
                opt.value = nome;
                datalistEl.appendChild(opt);
            });
        }
        /* Se vazio, o campo aceita texto livre */
    }
};
