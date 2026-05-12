const testimonials = [
  "/images/depoimento1.PNG",
  "/images/depoimento2.jpeg",
  "/images/depoimento3.PNG",
  "/images/depoimento4.PNG",
];

export default function Home() {
  return (
    <>
      <div className="page-bg" />
      <div className="page-overlay" />

      <main className="page-content">
        <div className="top-alert">
          <span className="top-alert-text">
            &Uacute;LTIMAS VAGAS LIBERADAS HOJE - ENTRE AGORA
          </span>
        </div>

        <div className="container">
          <h1 className="headline">
            Trampo do 7 <span className="highlight">liberado!!</span>
          </h1>

          <p className="subheadline">
            Tem uma galera entrando nisso hoje antes de saturar
          </p>

          <p className="limited-access">GRUPO ABERTO POR TEMPO LIMITADO</p>

          <a
            href="https://t.me/trampo7fxp"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-telegram"
          >
            Acessar o Telegram
          </a>

          <h2 className="section-title">
            ALGUNS FEEDBACKS DE HOJE &#128071;&#127996;&#128071;&#127996;
          </h2>

          <div className="testimonial-grid">
            {testimonials.map((src, index) => (
              <img key={src} src={src} alt={`Feedback ${index + 1}`} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
