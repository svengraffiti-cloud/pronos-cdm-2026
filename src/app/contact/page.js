export default function ContactPage() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Support Les Pronos de Papy</h1>

      <p>
        Si vous rencontrez un problème avec l’application Les Pronos de Papy,
        contactez notre équipe de support.
      </p>

      <h2>Contact</h2>

      <p>Email : contact@lespronosdepapy.com</p>

      <p>
        Site web :
        <a
          href="https://lespronosdepapy.com"
          target="_blank"
          rel="noreferrer"
        >
          {" "}
          https://lespronosdepapy.com
        </a>
      </p>

      <h2>Assistance</h2>

      <p>
        Nous répondons généralement sous 24 à 48 heures ouvrées.
      </p>

      <h2>Politique de confidentialité</h2>

      <p>
        <a
          href="https://lespronosdepapy.com/privacy"
          target="_blank"
          rel="noreferrer"
        >
          Consulter la politique de confidentialité
        </a>
      </p>
    </main>
  );
}
