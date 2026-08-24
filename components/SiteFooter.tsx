import { PetrobrasLogo } from "./PetrobrasLogo";

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="siteFooterInner">
        <div className="footerBrand">
          <PetrobrasLogo compact />
          <span className="footerDivider" />
          <strong>FORTIFY</strong>
        </div>
        <p>
          Protótipo acadêmico desenvolvido para o desafio de inovação SENAI proposto pela Petrobras.
          Não representa produto oficial, ambiente produtivo ou padrão corporativo homologado da Petrobras.
        </p>
      </div>
    </footer>
  );
}
