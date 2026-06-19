function logout(event) {
    if (event) {
        event.preventDefault();
    }

    Session.encerrarSessao();
    window.location.href = "login.html";
}
