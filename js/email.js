const EmailService = {

    configurado() {
        return !!(
            CONFIG.EMAILJS.PUBLIC_KEY &&
            CONFIG.EMAILJS.SERVICE_ID &&
            CONFIG.EMAILJS.TEMPLATE_INSCRICAO
        );
    },

    async enviarConfirmacaoInscricao(dados) {
        const codigo = dados.codigo || this._gerarCodigo();

        const corpo = {
            para: dados.email,
            nome: dados.nome,
            evento: dados.evento,
            data: dados.data || "A confirmar",
            local: dados.local || "A confirmar",
            categoria: dados.categoria || "Não informada",
            funcao: dados.funcao || "Não informada",
            status: dados.status || "Aguardando Confirmação",
            codigo: codigo
        };

        /* 1ª tentativa: EmailJS (quando configurado) */
        if (this.configurado() && typeof emailjs !== "undefined") {
            try {
                await emailjs.send(
                    CONFIG.EMAILJS.SERVICE_ID,
                    CONFIG.EMAILJS.TEMPLATE_INSCRICAO,
                    {
                        to_email:         corpo.para,
                        to_name:          corpo.nome,
                        evento_nome:      corpo.evento,
                        evento_data:      corpo.data,
                        evento_local:     corpo.local,
                        categoria:        corpo.categoria,
                        funcao:           corpo.funcao,
                        status:           corpo.status,
                        codigo_inscricao: corpo.codigo
                    },
                    CONFIG.EMAILJS.PUBLIC_KEY
                );
                return { sucesso: true, codigo: corpo.codigo, metodo: "emailjs" };
            } catch (err) {
                console.warn("EmailJS indisponível, usando fallback.", err);
            }
        }

        /* 2ª tentativa: mailto — abre o cliente de email do usuário com
           as informações de confirmação pré-preenchidas */
        try {
            const assunto = encodeURIComponent(
                `[Vaquejada Pro] Confirmação de Inscrição — ${corpo.evento}`
            );
            const textoEmail = [
                `Olá, ${corpo.nome}!`,
                ``,
                `Sua inscrição foi registrada com sucesso no Vaquejada Pro.`,
                ``,
                `DETALHES DA INSCRIÇÃO`,
                `──────────────────────────`,
                `Código:    ${corpo.codigo}`,
                `Evento:    ${corpo.evento}`,
                `Data:      ${corpo.data}`,
                `Local:     ${corpo.local}`,
                `Função:    ${corpo.funcao}`,
                `Categoria: ${corpo.categoria}`,
                `Status:    ${corpo.status}`,
                ``,
                `Guarde este código para acompanhar sua inscrição.`,
                ``,
                `Atenciosamente,`,
                `Equipe Vaquejada Pro`
            ].join("\n");

            const mailtoUrl = `mailto:${corpo.para}?subject=${assunto}&body=${encodeURIComponent(textoEmail)}`;

            /* Abre o cliente de email silenciosamente */
            const linkEl = document.createElement("a");
            linkEl.href = mailtoUrl;
            linkEl.target = "_blank";
            linkEl.rel = "noopener";
            document.body.appendChild(linkEl);
            linkEl.click();
            document.body.removeChild(linkEl);

            return { sucesso: true, codigo: corpo.codigo, metodo: "mailto" };
        } catch (mailErr) {
            console.warn("Fallback mailto falhou.", mailErr);
        }

        /* 3ª tentativa: salva na fila local para envio futuro */
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
                        to_email:     dados.email,
                        to_name:      dados.nome,
                        reset_link:   dados.link,
                        token_expira: dados.expira
                    },
                    CONFIG.EMAILJS.PUBLIC_KEY
                );
                return { sucesso: true, metodo: "emailjs" };
            } catch (err) {
                console.warn("EmailJS indisponível para recuperação.", err);
            }
        }

        /* Fallback mailto para recuperação de senha */
        try {
            const assunto = encodeURIComponent("[Vaquejada Pro] Recuperação de Senha");
            const corpo = encodeURIComponent(
                `Olá, ${dados.nome}!\n\nClique no link abaixo para redefinir sua senha:\n${dados.link}\n\nO link expira em ${dados.expira}.\n\nSe você não solicitou isso, ignore este email.\n\nEquipe Vaquejada Pro`
            );
            const linkEl = document.createElement("a");
            linkEl.href = `mailto:${dados.email}?subject=${assunto}&body=${corpo}`;
            linkEl.target = "_blank";
            document.body.appendChild(linkEl);
            linkEl.click();
            document.body.removeChild(linkEl);
            return { sucesso: true, metodo: "mailto" };
        } catch (e) {
            console.warn("Mailto para recuperação falhou.", e);
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
