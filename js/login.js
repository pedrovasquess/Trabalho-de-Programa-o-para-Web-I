function fazerLogin(event) {

    event.preventDefault();

    const email = document.getElementById("email").value;

    const senha = document.getElementById("senha").value;

    const mensagem = document.getElementById("mensagem-login");

    if (
        email.trim() === "" ||
        senha.trim() === ""
    ) {

        mensagem.textContent =
            "Preencha todos os campos!";

        return;
    }

    if (
        !email.includes("@") ||
        !email.includes(".com")
    ) {

        mensagem.textContent =
            "Email inválido!";

        return;
    }

    if (
        email === "admin@vaquejada.com" &&
        senha === "123456"
    ) {

        mensagem.textContent =
            "Login realizado com sucesso!";

        window.location.href = "index.html";

    } else {

        mensagem.textContent =
            "Email ou senha inválidos!";
    }

}