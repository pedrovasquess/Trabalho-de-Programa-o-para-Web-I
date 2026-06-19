const EmailService = {

    configurado() {
        return !!(
            CONFIG.EMAILJS.PUBLIC_KEY &&
            CONFIG.EMAILJS.SERVICE_ID &&
            CONFIG.EMAILJS.TEMPLATE_INSCRICAO
        );
    },

    async enviarConfirmacaoInscricao(dados) {
        const corpo = {
            para: dados.email,
            nome: dados.nome,
            evento: dados.evento,
            data: dados.data || "A confirmar",
            local: dados.local || "A confirmar",
            categoria: dados.categoria || "Não informada",
            funcao: dados.funcao || "Não informada",
            status: dados.status || "Aguardando Confirmação",
            codigo: dados.codigo || this._gerarCodigo()
        };

        if (this.configurado() && typeof emailjs !== "undefined") {
            try {
                await emailjs.send(
                    CONFIG.EMAILJS.SERVICE_ID,
                    CONFIG.EMAILJS.TEMPLATE_INSCRICAO,
                    {
                        to_email: corpo.para,
                        to_name: corpo.nome,
                        evento_nome: corpo.evento,
                        evento_data: corpo.data,
                        evento_local: corpo.local,
                        categoria: corpo.categoria,
                        funcao: corpo.funcao,
                        status: corpo.status,
                        codigo_inscricao: corpo.codigo
                    },
                    CONFIG.EMAILJS.PUBLIC_KEY
                );
                return { sucesso: true, codigo: corpo.codigo, metodo: "emailjs" };
            } catch (err) {
                console.warn("EmailJS indisponível, usando fallback local.", err);
            }
        }

        const fila = JSON.parse(localStorage.getItem("emails_pendentes") || "[]");
        fila.push({
            tipo: "inscricao",
            ...corpo,
            enviadoEm: new Date().toISOString()
        });
        localStorage.setItem("emails_pendentes", JSON.stringify(fila));

        return { sucesso: true, codigo: corpo.codigo, metodo: "local" };
    },

    async enviarRecuperacaoSenha(dados) {
        if (
            this.configurado() &&
            CONFIG.EMAILJS.TEMPLATE_RECUPERACAO &&
            typeof emailjs !== "undefined"
        ) {
            try {
                await emailjs.send(
                    CONFIG.EMAILJS.SERVICE_ID,
                    CONFIG.EMAILJS.TEMPLATE_RECUPERACAO,
                    {
                        to_email: dados.email,
                        to_name: dados.nome,
                        reset_link: dados.link,
                        token_expira: dados.expira
                    },
                    CONFIG.EMAILJS.PUBLIC_KEY
                );
                return { sucesso: true, metodo: "emailjs" };
            } catch (err) {
                console.warn("EmailJS indisponível para recuperação.", err);
            }
        }

        const fila = JSON.parse(localStorage.getItem("emails_pendentes") || "[]");
        fila.push({
            tipo: "recuperacao",
            email: dados.email,
            link: dados.link,
            enviadoEm: new Date().toISOString()
        });
        localStorage.setItem("emails_pendentes", JSON.stringify(fila));

        return { sucesso: true, metodo: "local" };
    },

    _gerarCodigo() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let codigo = "VP-";
        for (let i = 0; i < 8; i++) {
            codigo += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return codigo;
    }
};
