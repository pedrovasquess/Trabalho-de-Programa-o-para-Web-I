// Tela de Inicio 
// Tela de login
// Tela de ranking
// Tela de eventos
// Tela de Inscrição 
    // Função para avançar ou voltar entre os passos do formulário
        function nextStep(step) {
            var elementos = document.querySelectorAll(".step-content");
            elementos.forEach(function(el) {
                el.classList.remove("ativo");
            });

            document.getElementById("step" + step).classList.add("ativo");

            var steps = document.querySelectorAll(".step");
            steps.forEach(function(el) {
                el.classList.remove("ativo");
                el.classList.remove("completo");
            });

            for (var i = 1; i < step; i++) {
                document.getElementById("step" + i + "-ind").classList.add("completo");
            }

            document.getElementById("step" + step + "-ind").classList.add("ativo");
        }


        function selectCategoria(el) {
            var categorias = document.querySelectorAll(".categoria-card");

            categorias.forEach(function(c) {
                c.classList.remove("ativo");
            });

            el.classList.add("ativo");
        }
    
