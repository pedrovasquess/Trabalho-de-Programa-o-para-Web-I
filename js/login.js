const AuthStore = {

    obterUsuarios() {
        return JSON.parse(localStorage.getItem("usuarios") || "[]");
    },

    salvarUsuarios(usuarios) {
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
    },

    async buscarPorEmail(email) {
        const usuarios = this.obterUsuarios();
        return usuarios.find(u => u.email === email) || null;
    },

    async verificarCredenciais(email, senha) {
        const usuario = await this.buscarPorEmail(email);
        if (!usuario) return null;

        if (usuario.senhaHash) {
            const valido = await Security.verificarSenha(senha, usuario.senhaHash);
            return valido ? usuario : null;
        }

        if (usuario.senha === senha) {
            usuario.senhaHash = await Security.hashSenha(senha);
            delete usuario.senha;
            const usuarios = this.obterUsuarios();
            const idx = usuarios.findIndex(u => u.email === email);
            if (idx >= 0) {
                usuarios[idx] = usuario;
                this.salvarUsuarios(usuarios);
            }
            return usuario;
        }

        return null;
    }
};

async function fazerLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const mensagem = document.getElementById("mensagem-login");

    if (!email || !senha) {
        mensagem.textContent = "Preencha todos os campos!";
        mensagem.className = "msg-erro";
        return;
    }

    if (!Security.validarEmail(email)) {
        mensagem.textContent = "Email inválido!";
        mensagem.className = "msg-erro";
        return;
    }

    if (!Security.validarSenha(senha)) {
        mensagem.textContent = "A senha deve ter 8 caracteres, letra maiúscula, minúscula e número.";
        mensagem.className = "msg-erro";
        return;
    }

    const usuario = await AuthStore.verificarCredenciais(email, senha);

    if (usuario) {
        await Session.iniciarSessao(usuario);
        mensagem.textContent = "Login realizado com sucesso!";
        mensagem.className = "msg-sucesso";
        setTimeout(function () {
            Router.redirecionarPosLogin();
        }, 800);
    } else {
        mensagem.textContent = "Email ou senha inválidos!";
        mensagem.className = "msg-erro";
    }
}

function mostrarCadastro() {
    document.getElementById("form-login").style.display = "none";
    document.getElementById("cadastro-box").style.display = "block";
    document.getElementById("titulo-login").textContent = "Criar Conta";
    document.getElementById("google-btn-container").style.display = "none";
    document.querySelector(".ou").style.display = "none";
    document.getElementById("link-cadastro").style.display = "none";
}

function mostrarLogin() {
    document.getElementById("form-login").style.display = "block";
    document.getElementById("cadastro-box").style.display = "none";
    document.getElementById("titulo-login").textContent = "Entrar";
    document.getElementById("google-btn-container").style.display = "flex";
    document.querySelector(".ou").style.display = "block";
    document.getElementById("link-cadastro").style.display = "block";
}

async function criarConta() {
    const nome = document.getElementById("cadastro-nome").value.trim();
    const email = document.getElementById("cadastro-email").value.trim();
    const senha = document.getElementById("cadastro-senha").value;
    const confirmarSenha = document.getElementById("cadastro-confirmar-senha").value;
    const mensagem = document.getElementById("mensagem-cadastro");

    if (!nome || !email || !senha || !confirmarSenha) {
        mensagem.textContent = "Preencha todos os campos!";
        mensagem.className = "msg-erro";
        return;
    }

    if (!Security.validarEmail(email)) {
        mensagem.textContent = "Email inválido!";
        mensagem.className = "msg-erro";
        return;
    }

    if (!Security.validarSenha(senha)) {
        mensagem.textContent = "Senha fraca! Use 8+ caracteres, maiúscula, minúscula e número.";
        mensagem.className = "msg-erro";
        return;
    }

    if (senha !== confirmarSenha) {
        mensagem.textContent = "As senhas não coincidem!";
        mensagem.className = "msg-erro";
        return;
    }

    const usuarios = AuthStore.obterUsuarios();
    const existe = usuarios.find(u => u.email === email);

    if (existe) {
        mensagem.textContent = "Email já cadastrado!";
        mensagem.className = "msg-erro";
        return;
    }

    const senhaHash = await Security.hashSenha(senha);

    usuarios.push({
        nome: nome,
        email: email,
        senhaHash: senhaHash,
        provider: "local"
    });

    AuthStore.salvarUsuarios(usuarios);

    mensagem.textContent = "Conta criada com sucesso!";
    mensagem.className = "msg-sucesso";

    document.getElementById("cadastro-nome").value = "";
    document.getElementById("cadastro-email").value = "";
    document.getElementById("cadastro-senha").value = "";
    document.getElementById("cadastro-confirmar-senha").value = "";

    mostrarLogin();
}

async function recuperarSenha() {
    const modal = document.getElementById("modal-recuperacao");
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        return;
    }

    const email = prompt("Digite seu email cadastrado:");
    if (!email) return;

    await processarRecuperacaoSenha(email);
}

async function processarRecuperacaoSenha(email) {
    const mensagemEl = document.getElementById("mensagem-recuperacao");

    if (!Security.validarEmail(email)) {
        if (mensagemEl) {
            mensagemEl.textContent = "Email inválido!";
            mensagemEl.className = "msg-erro";
        }
        return;
    }

    const usuario = await AuthStore.buscarPorEmail(email);

    if (!usuario) {
        if (mensagemEl) {
            mensagemEl.textContent = "Email não encontrado!";
            mensagemEl.className = "msg-erro";
        }
        return;
    }

    const token = Security.gerarTokenRecuperacao();
    const expira = Date.now() + (30 * 60 * 1000);

    const tokens = JSON.parse(localStorage.getItem("tokens_recuperacao") || "{}");
    tokens[email] = { token: token, expira: expira };
    localStorage.setItem("tokens_recuperacao", JSON.stringify(tokens));

    const link = window.location.origin + window.location.pathname.replace("login.html", "") +
        "login.html?reset=" + token + "&email=" + encodeURIComponent(email);

    await EmailService.enviarRecuperacaoSenha({
        email: email,
        nome: usuario.nome,
        link: link,
        expira: "30 minutos"
    });

    if (mensagemEl) {
        mensagemEl.textContent = "Link de recuperação enviado para " + email + ". Verifique sua caixa de entrada.";
        mensagemEl.className = "msg-sucesso";
    } else {
        alert("Um link de recuperação foi gerado e registrado. Em produção, seria enviado por email.");
    }
}

async function redefinirSenha(event) {
    event.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset");
    const email = params.get("email");
    const novaSenha = document.getElementById("nova-senha").value;
    const confirmar = document.getElementById("confirmar-nova-senha").value;
    const mensagem = document.getElementById("mensagem-reset");

    if (!token || !email) {
        mensagem.textContent = "Link de recuperação inválido.";
        mensagem.className = "msg-erro";
        return;
    }

    const tokens = JSON.parse(localStorage.getItem("tokens_recuperacao") || "{}");
    const registro = tokens[email];

    if (!registro || registro.token !== token || registro.expira < Date.now()) {
        mensagem.textContent = "Link expirado ou inválido. Solicite novamente.";
        mensagem.className = "msg-erro";
        return;
    }

    if (!Security.validarSenha(novaSenha)) {
        mensagem.textContent = "Senha fraca! Use 8+ caracteres, maiúscula, minúscula e número.";
        mensagem.className = "msg-erro";
        return;
    }

    if (novaSenha !== confirmar) {
        mensagem.textContent = "As senhas não coincidem!";
        mensagem.className = "msg-erro";
        return;
    }

    const usuarios = AuthStore.obterUsuarios();
    const idx = usuarios.findIndex(u => u.email === email);

    if (idx < 0) {
        mensagem.textContent = "Usuário não encontrado.";
        mensagem.className = "msg-erro";
        return;
    }

    usuarios[idx].senhaHash = await Security.hashSenha(novaSenha);
    delete usuarios[idx].senha;
    AuthStore.salvarUsuarios(usuarios);

    delete tokens[email];
    localStorage.setItem("tokens_recuperacao", JSON.stringify(tokens));

    mensagem.textContent = "Senha redefinida com sucesso! Redirecionando...";
    mensagem.className = "msg-sucesso";

    setTimeout(function () {
        window.location.href = "login.html";
    }, 1500);
}

async function handleGoogleLogin(response) {
    const mensagem = document.getElementById("mensagem-login");

    try {
        const payload = JSON.parse(atob(response.credential.split(".")[1]));

        const usuarioGoogle = {
            nome: payload.name,
            email: payload.email,
            provider: "google",
            picture: payload.picture
        };

        const usuarios = AuthStore.obterUsuarios();
        let usuario = usuarios.find(u => u.email === usuarioGoogle.email);

        if (!usuario) {
            usuario = {
                nome: usuarioGoogle.nome,
                email: usuarioGoogle.email,
                provider: "google",
                picture: usuarioGoogle.picture
            };
            usuarios.push(usuario);
            AuthStore.salvarUsuarios(usuarios);
        }

        await Session.iniciarSessao(usuario);

        if (mensagem) {
            mensagem.textContent = "Login com Google realizado!";
            mensagem.className = "msg-sucesso";
        }

        setTimeout(function () {
            Router.redirecionarPosLogin();
        }, 800);

    } catch (err) {
        if (mensagem) {
            mensagem.textContent = "Erro ao autenticar com Google.";
            mensagem.className = "msg-erro";
        }
        console.error(err);
    }
}

function inicializarGoogleAuth() {
    const container = document.getElementById("google-btn-container");
    if (!container) return;

    if (!CONFIG.GOOGLE_CLIENT_ID) {
        container.innerHTML = `
            <button type="button" class="btn-google" onclick="simularLoginGoogle()">
                <i class="bi bi-google"></i> Entrar com Google (Demo)
            </button>
        `;
        return;
    }

    if (typeof google !== "undefined" && google.accounts) {
        google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: handleGoogleLogin
        });

        google.accounts.id.renderButton(
            container,
            { theme: "outline", size: "large", width: 320, text: "signin_with", locale: "pt-BR" }
        );
    } else {
        setTimeout(inicializarGoogleAuth, 200);
    }
}

async function simularLoginGoogle() {
    const mensagem = document.getElementById("mensagem-login");
    const email = prompt("Demo Google OAuth — informe seu email:");
    if (!email) return;

    const nome = prompt("Informe seu nome:") || "Usuário Google";

    const usuario = {
        nome: nome,
        email: email,
        provider: "google"
    };

    const usuarios = AuthStore.obterUsuarios();
    if (!usuarios.find(u => u.email === email)) {
        usuarios.push(usuario);
        AuthStore.salvarUsuarios(usuarios);
    }

    await Session.iniciarSessao(usuario);

    if (mensagem) {
        mensagem.textContent = "Login com Google (demo) realizado!";
        mensagem.className = "msg-sucesso";
    }

    setTimeout(function () {
        Router.redirecionarPosLogin();
    }, 800);
}

document.addEventListener("DOMContentLoaded", function () {
    if (CONFIG.EMAILJS.PUBLIC_KEY && typeof emailjs !== "undefined") {
        emailjs.init(CONFIG.EMAILJS.PUBLIC_KEY);
    }

    inicializarGoogleAuth();

    const params = new URLSearchParams(window.location.search);
    if (params.get("reset")) {
        const box = document.getElementById("reset-senha-box");
        const formLogin = document.getElementById("form-login");
        if (box && formLogin) {
            formLogin.style.display = "none";
            box.style.display = "block";
            document.getElementById("titulo-login").textContent = "Redefinir Senha";
            document.getElementById("google-btn-container").style.display = "none";
            document.querySelector(".ou").style.display = "none";
            document.getElementById("link-cadastro").style.display = "none";
        }
    }

    const btnRecuperar = document.getElementById("btn-enviar-recuperacao");
    if (btnRecuperar) {
        btnRecuperar.addEventListener("click", async function () {
            const email = document.getElementById("email-recuperacao").value.trim();
            await processarRecuperacaoSenha(email);
        });
    }
});
