import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";

const GENDER_PRESETS = ["Female", "Male", "Non-binary", "Prefer not to say"] as const;

export function ProfileFields() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [first, setFirst] = React.useState("");
  const [last, setLast] = React.useState("");
  const [phone, setPhone] = React.useState(session?.user?.phone ?? "");
  const [gender, setGender] = React.useState<string>("");
  const [genderCustom, setGenderCustom] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [nameState, setNameState] = React.useState<SaveState>("idle");
  const [phoneState, setPhoneState] = React.useState<SaveState>("idle");
  const [genderState, setGenderState] = React.useState<SaveState>("idle");

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, gender")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      setFirst(data?.first_name ?? "");
      setLast(data?.last_name ?? "");
      if ((data as any)?.phone) setPhone((data as any).phone);
      const g = (data as any)?.gender ?? "";
      if (g && (GENDER_PRESETS as readonly string[]).includes(g)) {
        setGender(g);
        setGenderCustom("");
      } else if (g) {
        setGender("__self__");
        setGenderCustom(g);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Autosave: debounce every field 600ms after the last edit. No buttons.
  useAutosave(loading || !userId ? null : { first, last }, async (v) => {
    setNameState("saving");
    const { error } = await supabase
      .from("profiles")
      .update({ first_name: v.first.trim() || null, last_name: v.last.trim() || null })
      .eq("id", userId!);
    if (error) { setNameState("error"); toast.error("Couldn't save name"); }
    else setNameState("saved");
  });

  useAutosave(loading || !userId ? null : phone, async (v) => {
    setPhoneState("saving");
    const trimmed = v.trim();
    const { error } = await supabase
      .from("profiles").update({ phone: trimmed || null }).eq("id", userId!);
    if (!error && trimmed) void supabase.auth.updateUser({ phone: trimmed }).catch(() => {});
    if (error) { setPhoneState("error"); toast.error(error.message); }
    else setPhoneState("saved");
  });

  useAutosave(
    loading || !userId ? null : { gender, genderCustom },
    async (v) => {
      setGenderState("saving");
      const value =
        v.gender === "__self__"
          ? v.genderCustom.trim() || null
          : v.gender || null;
      const { error } = await supabase
        .from("profiles")
        .update({ gender: value })
        .eq("id", userId!);
      if (error) { setGenderState("error"); toast.error("Couldn't save gender"); }
      else setGenderState("saved");
    },
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[15px] text-[#FAFAFC]">Full name</p>
        <p className="mt-1 text-[13px] sheet-muted">How Purple addresses you.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <Label htmlFor="first-name" className="sr-only">First name</Label>
            <Input
              id="first-name"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="First"
              disabled={loading}
              className="bg-white/[0.04] border-white/10 text-[#FAFAFC] placeholder:text-white/30"
            />
          </div>
          <div>
            <Label htmlFor="last-name" className="sr-only">Last name</Label>
            <Input
              id="last-name"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              placeholder="Last"
              disabled={loading}
              className="bg-white/[0.04] border-white/10 text-[#FAFAFC] placeholder:text-white/30"
            />
          </div>
        </div>
        <SavedIndicator state={nameState} className="mt-2" />
      </div>

      <div className="border-t sheet-divider pt-6">
        <p className="text-[15px] text-[#FAFAFC]">Email</p>
        <p className="mt-1 text-[13px] sheet-muted">{session?.user?.email ?? "–"}</p>
      </div>

      <div className="border-t sheet-divider pt-6">
        <p className="text-[15px] text-[#FAFAFC]">Phone number</p>
        <p className="mt-1 text-[13px] sheet-muted">
          Visible to people you share your account with so they can reach you. Include country code.
        </p>
        <div className="mt-3">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 555 5555"
            inputMode="tel"
            className="bg-white/[0.04] border-white/10 text-[#FAFAFC] placeholder:text-white/30 w-full"
          />
          <SavedIndicator state={phoneState} className="mt-2" />
        </div>
      </div>

      <div className="border-t sheet-divider pt-6">
        <p className="text-[15px] text-[#FAFAFC]">Pronouns</p>
        <p className="mt-1 text-[13px] sheet-muted">Optional. Shown to people you share with.</p>
        <div className="mt-3">
          <p className="text-[15px] text-[#FAFAFC]">Gender</p>
          <p className="mt-1 text-[13px] sheet-muted">Optional. Shown to people you share with.</p>
          <div className="mt-3 space-y-2">
            <Select value={gender} onValueChange={setGender} disabled={loading}>
              <SelectTrigger className="bg-white/[0.04] border-white/10 text-[#FAFAFC]">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_PRESETS.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
                <SelectItem value="__self__">Self-describe…</SelectItem>
              </SelectContent>
            </Select>
            {gender === "__self__" && (
              <Input
                value={genderCustom}
                onChange={(e) => setGenderCustom(e.target.value)}
                placeholder="Describe in your own words"
                className="bg-white/[0.04] border-white/10 text-[#FAFAFC] placeholder:text-white/30 w-full"
              />
            )}
          </div>
          <SavedIndicator state={genderState} className="mt-2" />
        </div>
      </div>
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function useAutosave<T>(value: T | null, save: (v: T) => Promise<void>, delay = 600) {
  const first = React.useRef(true);
  const lastJson = React.useRef<string>("");
  React.useEffect(() => {
    if (value === null || value === undefined) return;
    const json = JSON.stringify(value);
    if (first.current) { first.current = false; lastJson.current = json; return; }
    if (json === lastJson.current) return;
    lastJson.current = json;
    const id = window.setTimeout(() => { void save(value); }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);
}

function SavedIndicator({ state, className }: { state: SaveState; className?: string }) {
  if (state === "idle") return <div className={className} style={{ minHeight: 18 }} />;
  return (
    <div className={`flex items-center gap-1.5 text-[12px] sheet-muted ${className ?? ""}`}>
      {state === "saving" && (<><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>)}
      {state === "saved" && (<><Check className="h-3 w-3 text-emerald-400" /> Saved</>)}
      {state === "error" && <span className="text-destructive">Couldn't save, try again</span>}
    </div>
  );
}