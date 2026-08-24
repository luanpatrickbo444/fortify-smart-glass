export function Logo({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <div className={`brand ${dark ? "brandDark" : ""}`} aria-label="Fortify para Petrobras">
      <span className="fortifyGlyph" aria-hidden="true">
        <span className="glyphTop" />
        <span className="glyphMid" />
        <span className="glyphBottom" />
      </span>
      <span className="brandCopy">
        <span className="brandText">FORTIFY</span>
        {!compact && <span className="brandTag">SMART ACCESS</span>}
      </span>
      {!compact && (
        <span className="petrobrasLockup">
          <span className="petrobrasFlag" aria-hidden="true"><i /><b /></span>
          <span className="petrobrasText">PETROBRAS</span>
        </span>
      )}
    </div>
  );
}
