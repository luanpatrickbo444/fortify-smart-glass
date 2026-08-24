export function audit(event: string, data: Record<string, unknown> = {}) {
  console.info(
    JSON.stringify({
      source: "fortify-security-gateway",
      event,
      at: new Date().toISOString(),
      ...data
    })
  );
}
