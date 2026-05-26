import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Bell, Watch, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { ensureServiceWorker, requestPermission } from "@/lib/med-notifications";
import { toast } from "sonner";
import { OuraConnection } from "@/components/connections/oura-connection";
import { PhoneInput, parsePhone, formatPhone } from "@/components/ui/phone-input";
import dawn from "@/assets/hero-readiness-dawn.jpg";
import mist from "@/assets/hero-readiness-mist.jpg";

export const Route = createFileRoute("/_app/welcome")({
  head: () => ({ meta: [{ title: "Welcome — Purple" }] }),
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("US");
  const [phoneNational, setPhoneNational] = useState("");
  const [notifGranted, setNotifGranted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  // Prefill from existing profile so the user never re-enters what's saved.
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("first_name, last_name, emergency_contact_name, emergency_contact_phone")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.first_name) setFirstName(data.first_name);
        if (data.last_name) setLastName(data.last_name);
        if (data.emergency_contact_name) setEmergencyName(data.emergency_contact_name);
        if (data.emergency_contact_phone) {
          const parsed = parsePhone(data.emergency_contact_phone);
          setPhoneCountry(parsed.code);
          setPhoneNational(parsed.national);
        }
      });
  }, [userId]);

  const finish = async () => {
    if (!userId) {
      navigate({ to: "/" });
      return;
    }
    setSaving(true);
    try {
      const phone = formatPhone(phoneCountry, phoneNational);
      await supabase.from("profiles").upsert({
        id: userId,
        first_name: firstName || null,
        last_name: lastName || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: phone || null,
        onboarded_at: new Date().toISOString(),
      });
      localStorage.setItem("purple-onboarded", "1");
      navigate({ to: "/" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        onboarded_at: new Date().toISOString(),
      });
    }
    localStorage.setItem("purple-onboarded", "1");
    navigate({ to: "/" });
  };

  const enableNotifs = async () => {
    await ensureServiceWorker();
    const perm = await requestPermission();
    setNotifGranted(perm === "granted");
    if (perm === "granted") toast.success("Notifications on");
  };

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-8 sm:pt-12 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={skip}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Skip
        </button>
      </div>

      {step === 0 && (
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card aspect-[4/3] sm:aspect-[16/10]">
            <img
              src={dawn}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              width={1536}
              height={1024}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/55" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="label-eyebrow" style={{ color: "var(--background)", opacity: 0.85 }}>
                Purple
              </p>
            </div>
          </div>
          <h1 className="font-serif text-5xl sm:text-7xl leading-[1.02] tracking-tight text-foreground mt-10">
            Welcome.<br />This is your space.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
            A calm place to keep track of your sleep, your symptoms, your medications, and
            the patterns underneath them. Nothing here is sold, shared, or judged. I&rsquo;m
            here when you need me, quiet when you don&rsquo;t.
          </p>
          <Button className="mt-10 rounded-full px-7 h-12 text-base" size="lg" onClick={() => setStep(1)}>
            Continue <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="label-eyebrow mb-4">Step 2 of 3</p>
          <h1 className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight text-foreground">
            Let me know who you are.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">
            Just enough so I can address you, and someone to reach if a seizure is ever logged.
          </p>
          <div className="mt-8 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first">First name</Label>
                <Input id="first" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="last">Last name</Label>
                <Input id="last" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="ename">Emergency contact name</Label>
              <Input id="ename" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ephone">Emergency contact phone</Label>
              <div className="mt-1.5">
                <PhoneInput
                  id="ephone"
                  country={phoneCountry}
                  onCountryChange={setPhoneCountry}
                  national={phoneNational}
                  onNationalChange={setPhoneNational}
                />
              </div>
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button className="rounded-full" onClick={() => setStep(2)}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-border mb-8 aspect-[16/9]">
            <img
              src={mist}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              width={1536}
              height={1024}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-foreground/40" />
          </div>
          <p className="label-eyebrow mb-4">Step 3 of 3</p>
          <h1 className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight text-foreground">
            Connect what helps.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            All optional. You can do this any time from Settings.
          </p>
          <div className="mt-8 space-y-3">
            <div className="rounded-xl border border-border bg-card px-4">
              <OuraConnection />
            </div>
            <ConnectCard
              icon={Watch}
              title="Whoop"
              body="Recovery, strain, sleep performance."
              actionLabel="Coming soon"
              disabled
            />
            <ConnectCard
              icon={Bell}
              title="Browser notifications"
              body="Quiet reminders when it's time for a dose."
              actionLabel={notifGranted ? "Enabled" : "Enable"}
              disabled={notifGranted}
              onAction={enableNotifs}
              done={notifGranted}
            />
          </div>
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button className="rounded-full" onClick={finish} disabled={saving}>
              {saving ? "Saving…" : "Take me in"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectCard({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  disabled,
  done,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  actionLabel: string;
  onAction?: () => void;
  disabled?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-base text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{body}</p>
        </div>
      </div>
      <Button size="sm" variant={done ? "ghost" : "outline"} onClick={onAction} disabled={disabled}>
        {done && <Check className="h-3.5 w-3.5 mr-1" />}
        {actionLabel}
      </Button>
    </div>
  );
}