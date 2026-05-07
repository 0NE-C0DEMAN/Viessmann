// VIES — VAT Information Exchange System (EU). Confirms whether a VAT number
// is currently registered in the issuing country.
// Croatia uses the same OIB number as the VAT id (prefixed "HR").
//
// VIES exposes both a SOAP service and a newer JSON REST endpoint at
// ec.europa.eu/taxation_customs/vies/rest-api. We use the REST endpoint and
// fail gracefully on timeout / 5xx so signup never blocks on VIES being down.

const REST_URL = "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

export interface ViesResult {
  valid: boolean;
  /** True if the VIES service answered, even with `valid: false`. */
  authoritative: boolean;
  /** Optional registered name, if VIES returned one. */
  name?: string;
  /** Diagnostic message for the audit log. */
  message: string;
}

export async function checkOibViaVies(oib: string, countryCode = "HR"): Promise<ViesResult> {
  const cleaned = oib.replace(/\D/g, "");
  if (cleaned.length !== 11) {
    return { valid: false, authoritative: false, message: "OIB length not 11" };
  }
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(REST_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ countryCode, vatNumber: cleaned }),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      return { valid: false, authoritative: false, message: `VIES HTTP ${res.status}` };
    }
    const json = (await res.json()) as { valid?: boolean; name?: string };
    return {
      valid: !!json.valid,
      authoritative: true,
      name: json.name,
      message: json.valid ? "valid" : "not registered",
    };
  } catch (e) {
    return {
      valid: false,
      authoritative: false,
      message: e instanceof Error && e.name === "AbortError" ? "VIES timeout" : "VIES unreachable",
    };
  }
}
