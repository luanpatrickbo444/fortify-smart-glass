export const PETROBRAS_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Petrobras_horizontal_logo.svg/960px-Petrobras_horizontal_logo.svg.png";

export function PetrobrasLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`petrobrasOfficial ${compact ? "compact" : ""}`}>
      <img
        src={PETROBRAS_LOGO_URL}
        alt="Petrobras"
        width={compact ? 184 : 245}
        height={compact ? 36 : 48}
        loading="eager"
      />
    </span>
  );
}
