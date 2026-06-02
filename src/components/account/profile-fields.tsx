import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";

export function ProfileFields() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [first, setFirst] = React.useState("");
  const [last, setLast] = React.useState("");
  const [phone, setPhone] = React.useState(session?.user?.phone ?? "");
  const [pronouns, setPronouns] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [savingName, setSavingName] = React.useState(false);
  const [savingPhone, setSavingPhone] = React.useState(false);
  const [savingPronouns, setSavingPronouns] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, pronouns")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      setFirst(data?.first_name ?? "");
      setLast(data?.last_name ?? "");
      if ((data as any)?.phone) setPhone((data as any).phone);
      setPronouns((data as any)?.pronouns ?? "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const saveName = async () => {
    if (!userId) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ first_name: first.trim() || null, last_name: last.trim() || null })
      .eq("id", userId);
    setSavingName(false);
    if (error) toast.error("Couldn't save name");
    else toast.success("Name updated");
  };

  const savePhone = async () => {
    setSavingPhone(true);
    const trimmed = phone.trim();
    // Save to profiles.phone so the people you care for (and the people who
    // care for you) can see/contact it. Best-effort sync to auth too.
    const { error } = await supabase
      .from("profiles")
      .update({ phone: trimmed || null })
      .eq("id", userId!);
    if (!error && trimmed) {
      void supabase.auth.updateUser({ phone: trimmed }).catch(() => {});
    }
    setSavingPhone(false);
    if (error) toast.error(error.message);
    else toast.success("Phone updated");
  };

  const savePronouns = async () => {
    if (!userId) return;
    setSavingPronouns(true);
    const { error } = await supabase
      .from("profiles")
      .update({ pronouns: pronouns.trim() || null })
      .eq("id", userId);
    setSavingPronouns(false);
    if (error) toast.error("Couldn't save pronouns");
    else toast.success("Pronouns updated");
  };

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
        <div className="mt-3">
          <Button onClick={saveName} disabled={savingName || loading} variant="outline" className="bg-white/[0.04] border-white/10 text-[#FAFAFC] hover:bg-white/10">
            {savingName && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Save name
          </Button>
        </div>
      </div>

      <div className="border-t sheet-divider pt-6">
        <p className="text-[15px] text-[#FAFAFC]">Email</p>
        <p className="mt-1 text-[13px] sheet-muted">{session?.user?.email ?? "—"}</p>
      </div>

      <div className="border-t sheet-divider pt-6">
        <p className="text-[15px] text-[#FAFAFC]">Phone number</p>
        <p className="mt-1 text-[13px] sheet-muted">Used for security and account recovery. Include country code.</p>
        <div className="mt-3 flex gap-2">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 555 5555"
            inputMode="tel"
            className="bg-white/[0.04] border-white/10 text-[#FAFAFC] placeholder:text-white/30 flex-1"
          />
          <Button onClick={savePhone} disabled={savingPhone} variant="outline" className="bg-white/[0.04] border-white/10 text-[#FAFAFC] hover:bg-white/10">
            {savingPhone && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}