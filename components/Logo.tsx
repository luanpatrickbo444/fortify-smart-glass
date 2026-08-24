import { PetrobrasLogo } from "./PetrobrasLogo";

export function Logo({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <div className={`brand ${dark ? "brandDark" : ""}`} aria-label="Fortify para desafio Smart Glasses Petrobras">
      <PetrobrasLogo compact={compact} />
      <span className="brandDivider" aria-hidden="true" />
      <span className="brandCopy">
        <span className="brandText">FORTIFY</span>
        {!compact && <span className="brandTag">SECURE SMART ACCESS</span>}
      </span>
    </div>
  );
}
