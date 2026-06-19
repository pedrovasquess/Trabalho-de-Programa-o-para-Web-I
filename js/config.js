const CONFIG = {
    JWT_SECRET: "vaquejada-pro-secret-key-2026",
    JWT_EXPIRY_HOURS: 24,
    SESSION_COOKIE_MAX_AGE: 86400,
    COOKIE_SECURE: window.location.protocol === "https:",
    GOOGLE_CLIENT_ID: "",
    EMAILJS: {
        PUBLIC_KEY: "",
        SERVICE_ID: "",
        TEMPLATE_INSCRICAO: "",
        TEMPLATE_RECUPERACAO: ""
    },
    ROTAS_PUBLICAS: [
        "index.html",
        "login.html",
        "ranking.html",
        "eventos.html",
        "noticias.html",
        ""
    ],
    ROTAS_PROTEGIDAS: [
        "inscricao.html"
    ],
    RSS_FEEDS: [
        "https://g1.globo.com/rss/g1/agronegocios/",
        "https://www.canalrural.com.br/feed/"
    ]
};
