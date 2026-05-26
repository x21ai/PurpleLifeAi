import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Small curated list — covers ~95% of likely users. Order matters (most common first).
export const COUNTRY_CODES: { code: string; dial: string; flag: string; name: string }[] = [
  { code: "US", dial: "+1", flag: "🇺🇸", name: "United States" },
  { code: "CA", dial: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "GB", dial: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "AU", dial: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "NZ", dial: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "IE", dial: "+353", flag: "🇮🇪", name: "Ireland" },
  { code: "DE", dial: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "FR", dial: "+33", flag: "🇫🇷", name: "France" },
  { code: "ES", dial: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "IT", dial: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "PT", dial: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "NL", dial: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "BE", dial: "+32", flag: "🇧🇪", name: "Belgium" },
  { code: "CH", dial: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "SE", dial: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "NO", dial: "+47", flag: "🇳🇴", name: "Norway" },
  { code: "DK", dial: "+45", flag: "🇩🇰", name: "Denmark" },
  { code: "FI", dial: "+358", flag: "🇫🇮", name: "Finland" },
  { code: "PL", dial: "+48", flag: "🇵🇱", name: "Poland" },
  { code: "MX", dial: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "BR", dial: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "AR", dial: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "IN", dial: "+91", flag: "🇮🇳", name: "India" },
  { code: "JP", dial: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "KR", dial: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "CN", dial: "+86", flag: "🇨🇳", name: "China" },
  { code: "HK", dial: "+852", flag: "🇭🇰", name: "Hong Kong" },
  { code: "SG", dial: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "IL", dial: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "ZA", dial: "+27", flag: "🇿🇦", name: "South Africa" },
];

/** Parse a stored E.164-ish string back into a country + national digits pair. */
export function parsePhone(stored: string | null | undefined): { code: string; national: string } {
  if (!stored) return { code: "US", national: "" };
  const trimmed = stored.trim();
  if (!trimmed.startsWith("+")) {
    return { code: "US", national: trimmed.replace(/\D/g, "") };
  }
  // Try longest dial-code prefix first so +1 doesn't shadow +1xxx.
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (trimmed.startsWith(c.dial)) {
      return { code: c.code, national: trimmed.slice(c.dial.length).replace(/\D/g, "") };
    }
  }
  return { code: "US", national: trimmed.replace(/\D/g, "") };
}

/** Combine a country code and national digits into E.164 ("" if no digits). */
export function formatPhone(country: string, national: string): string {
  const digits = national.replace(/\D/g, "");
  if (!digits) return "";
  const c = COUNTRY_CODES.find((x) => x.code === country) ?? COUNTRY_CODES[0];
  return `${c.dial}${digits}`;
}

export function PhoneInput({
  id,
  country,
  onCountryChange,
  national,
  onNationalChange,
  placeholder = "555 123 4567",
}: {
  id?: string;
  country: string;
  onCountryChange: (code: string) => void;
  national: string;
  onNationalChange: (digits: string) => void;
  placeholder?: string;
}) {
  const selected = COUNTRY_CODES.find((c) => c.code === country) ?? COUNTRY_CODES[0];
  return (
    <div className="flex gap-2">
      <Select value={country} onValueChange={onCountryChange}>
        <SelectTrigger className="w-[110px] shrink-0" aria-label="Country code">
          <SelectValue>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true">{selected.flag}</span>
              <span className="tabular-nums text-sm">{selected.dial}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">{c.flag}</span>
                <span>{c.name}</span>
                <span className="text-muted-foreground tabular-nums">{c.dial}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={national}
        onChange={(e) => onNationalChange(e.target.value.replace(/[^\d\s\-()]/g, ""))}
        placeholder={placeholder}
      />
    </div>
  );
}