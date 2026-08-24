export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="Fortify">
      <span className="brandMark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brandText">FORTIFY</span>
      {!compact && <span className="brandTag">SECURE ACCESS</span>}
    </div>
  );
}
