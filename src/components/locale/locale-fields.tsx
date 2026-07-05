import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe, Clock, Languages, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  COUNTRIES,
  detectBrowserCountry,
  detectBrowserTimezone,
  listTimezones,
} from "@/lib/countries";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n";

export type LocaleValues = {
  country: string | null;
  homeCity: string | null;
  timezone: string | null;
  locale: SupportedLocale;
};

type Props = {
  values: LocaleValues;
  onChange: (next: LocaleValues) => void;
  disabled?: boolean;
  compact?: boolean;
  showTitle?: boolean;
};

const TZ_LIST = listTimezones();

function groupedTimezones() {
  const groups: Record<string, string[]> = {};
  for (const tz of TZ_LIST) {
    const region = tz.includes("/") ? tz.split("/")[0] : "Other";
    (groups[region] ||= []).push(tz);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Shared region + language fields used by sign-up, welcome, and settings.
 * Controlled, the parent persists values when the user is ready.
 */
export function LocaleFields({ values, onChange, disabled, compact, showTitle }: Props) {
  const { t } = useTranslation();
  const timezoneGroups = React.useMemo(groupedTimezones, []);

  // Auto-fill empty fields from the browser on first mount so users
  // see sensible defaults they can confirm with one tap.
  React.useEffect(() => {
    if (values.country && values.timezone) return;
    const next: LocaleValues = { ...values };
    if (!next.country) next.country = detectBrowserCountry();
    if (!next.timezone) next.timezone = detectBrowserTimezone();
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      {showTitle && (
        <div>
          <p className="font-serif text-base text-foreground">{t("locale.title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("locale.subtitle")}</p>
        </div>
      )}
      <div>
        <Label
          htmlFor="locale-country"
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <Globe className="h-3.5 w-3.5 text-primary" />
          {t("locale.country")}
        </Label>
        <Select
          value={values.country ?? ""}
          onValueChange={(v) => onChange({ ...values, country: v || null })}
          disabled={disabled}
        >
          <SelectTrigger id="locale-country" className="mt-1.5">
            <SelectValue placeholder={t("locale.countryPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label
          htmlFor="locale-home-city"
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {t("locale.homeCity")}
        </Label>
        <Input
          id="locale-home-city"
          className="mt-1.5"
          placeholder={t("locale.homeCityPlaceholder")}
          value={values.homeCity ?? ""}
          onChange={(e) =>
            onChange({ ...values, homeCity: e.target.value.trim() || null })
          }
          disabled={disabled}
        />
      </div>

      <div>
        <Label
          htmlFor="locale-tz"
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <Clock className="h-3.5 w-3.5 text-primary" />
          {t("locale.timezone")}
        </Label>
        <div className="mt-1.5 flex gap-2">
          <Select
            value={values.timezone ?? ""}
            onValueChange={(v) => onChange({ ...values, timezone: v || null })}
            disabled={disabled}
          >
            <SelectTrigger id="locale-tz" className="flex-1">
              <SelectValue placeholder="UTC" />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              {timezoneGroups.map(([region, zones]) => (
                <SelectGroup key={region}>
                  <SelectLabel className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {region}
                  </SelectLabel>
                  {zones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onChange({ ...values, timezone: detectBrowserTimezone() })}
          >
            {t("locale.timezoneDetect")}
          </Button>
        </div>
      </div>

      <div>
        <Label
          htmlFor="locale-lang"
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <Languages className="h-3.5 w-3.5 text-primary" />
          {t("locale.language")}
        </Label>
        <Select
          value={values.locale}
          onValueChange={(v) =>
            onChange({ ...values, locale: v as SupportedLocale })
          }
          disabled={disabled}
        >
          <SelectTrigger id="locale-lang" className="mt-1.5 w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LOCALES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}