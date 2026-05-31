import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Zap, MapPin, X, Camera, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouteTheme } from "@/lib/use-route-theme";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/seizures/new")({
  head: () => ({ meta: [{ title: "Log seizure — Purple" }] }),
  component: LogSeizurePage,
});

const SEIZURE_TYPES = [
  { value: "focal_aware", label: "Focal aware" },
  { value: "focal_impaired_awareness", label: "Focal impaired awareness" },
  { value: "focal_to_bilateral_tonic_clonic", label: "Focal to bilateral tonic-clonic" },
  { value: "generalized_tonic_clonic", label: "Generalized tonic-clonic" },
  { value: "absence", label: "Absence" },
  { value: "myoclonic", label: "Myoclonic" },
  { value: "atonic", label: "Atonic" },
  { value: "unknown", label: "Unknown" },
];

type Attachment = {
  id: string;
  file: File;
  previewUrl: string;
  kind: "photo" | "video";
};

function extOf(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const m = file.type.split("/")[1];
  return (m || "bin").toLowerCase();
}

function LogSeizurePage() {
  useRouteTheme("dark");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [quickSaving, setQuickSaving] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [type, setType] = React.useState<string>("");
  const [startedAtDate, setStartedAtDate] = React.useState<Date>(new Date());
  const [witnessed, setWitnessed] = React.useState(false);
  const [witnessName, setWitnessName] = React.useState("");
  const [duration, setDuration] = React.useState(0);
  const [severity, setSeverity] = React.useState(5);
  const [injury, setInjury] = React.useState(false);
  const [injuryDescription, setInjuryDescription] = React.useState("");
  const [rescueUsed, setRescueUsed] = React.useState(false);
  const [rescueName, setRescueName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = React.useState(false);

  const photoInput = React.useRef<HTMLInputElement | null>(null);
  const galleryInput = React.useRef<HTMLInputElement | null>(null);
  const videoInput = React.useRef<HTMLInputElement | null>(null);

  const addFiles = (files: FileList | null, kind: "photo" | "video") => {
    if (!files || files.length === 0) return;
    const next: Attachment[] = [];
    for (const f of Array.from(files)) {
      next.push({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        kind,
      });
    }
    setAttachments((prev) => [...prev, ...next]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location not available");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        toast.error(err.message || "Could not get location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else void navigate({ to: "/" });
  };

  const handleQuickLog = async () => {
    if (!userId || quickSaving) return;
    setQuickSaving(true);
    try {
      const { error } = await supabase.from("seizure_events").insert({
        user_id: userId,
        started_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Logged. You can add details anytime.");
      goBack();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Could not log");
    } finally {
      setQuickSaving(false);
    }
  };

  const uploadAttachments = async (seizureId: string): Promise<string[]> => {
    if (!userId || attachments.length === 0) return [];
    const ts = Date.now();
    const paths: string[] = [];
    for (const a of attachments) {
      const path = `${userId}/seizure-${seizureId}/${a.kind}-${ts}-${a.id}.${extOf(a.file)}`;
      const { error } = await supabase.storage
        .from("journal-media")
        .upload(path, a.file, { contentType: a.file.type, upsert: false });
      if (error) throw error;
      paths.push(path);
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from("journal-media")
      .createSignedUrls(paths, 60 * 60 * 24 * 365);
    if (signErr) throw signErr;
    return (signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[];
  };

  const handleSaveDetailed = async () => {
    if (!userId || saving) return;
    setSaving(true);
    try {
      const startedAt = startedAtDate.toISOString();
      // 1. Insert seizure
      const { data: seizure, error: sErr } = await supabase
        .from("seizure_events")
        .insert({
          user_id: userId,
          started_at: startedAt,
          type: type || null,
          witnessed,
          witness_name: witnessed && witnessName.trim() ? witnessName.trim() : null,
          duration_seconds: duration > 0 ? duration : null,
          severity: severity,
          injury,
          injury_description: injury && injuryDescription.trim() ? injuryDescription.trim() : null,
          rescue_med_given: rescueUsed,
          rescue_med_name: rescueUsed && rescueName.trim() ? rescueName.trim() : null,
          notes: notes.trim() || null,
          location_lat: location?.lat ?? null,
          location_lng: location?.lng ?? null,
        })
        .select("id")
        .single();
      if (sErr || !seizure) throw sErr ?? new Error("Insert failed");

      // 2. Upload attachments, then update seizure with photo_urls
      const mediaUrls = await uploadAttachments(seizure.id);
      const photoUrls = mediaUrls.filter((_, i) => attachments[i]?.kind === "photo");
      const videoUrl = mediaUrls.find((_, i) => attachments[i]?.kind === "video") ?? null;
      if (photoUrls.length > 0 || videoUrl) {
        await supabase
          .from("seizure_events")
          .update({ photo_urls: photoUrls, video_url: videoUrl })
          .eq("id", seizure.id);
      }

      // 3. Parallel journal entry
      const typeLabel = SEIZURE_TYPES.find((t) => t.value === type)?.label;
      const journalText = [
        `Seizure logged${typeLabel ? ` — ${typeLabel}` : ""}.`,
        notes.trim(),
      ]
        .filter(Boolean)
        .join("\n\n");
      const { data: entry, error: jErr } = await supabase
        .from("journal_entries")
        .insert({
          user_id: userId,
          kind: "mixed",
          status: "processing",
          text: journalText,
          linked_seizure_id: seizure.id,
          media_urls: mediaUrls,
        })
        .select("id")
        .single();
      if (jErr || !entry) throw jErr ?? new Error("Journal insert failed");

      // 4. Fire-and-forget AI processing
      supabase.functions
        .invoke("journal-processor", { body: { entry_id: entry.id } })
        .catch(() => {});

      toast.success("Seizure logged.");
      goBack();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-32">
      <div className="flex items-start justify-between mb-10 gap-4">
        <div>
          <p className="label-eyebrow text-muted-foreground">{t("seizuresNew.eyebrow")}</p>
          <h1 className="mt-3 font-serif text-[40px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
            {t("seizuresNew.title")}
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={goBack} aria-label={t("seizuresNew.close")} className="mt-2 shrink-0">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Quick log */}
      <button
        type="button"
        onClick={handleQuickLog}
        disabled={quickSaving || saving}
        className={cn(
          "w-full rounded-2xl bg-destructive text-destructive-foreground",
          "py-6 px-6 text-lg font-semibold shadow-lg shadow-destructive/25",
          "flex items-center justify-center gap-3",
          "hover:bg-destructive/90 active:scale-[0.99] transition disabled:opacity-60",
        )}
      >
        {quickSaving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Zap className="h-6 w-6" fill="currentColor" />
        )}
        Log right now, fill details later
      </button>

      <h2 className="font-serif text-xl mt-10 mb-4 text-foreground">Or add details</h2>

      <div className="space-y-6">
        {/* When did it happen */}
        <div className="space-y-2">
          <Label>When did it happen?</Label>
          <DateTimePicker value={startedAtDate} onChange={(d) => d && setStartedAtDate(d)} disableFuture />
          <p className="text-xs text-muted-foreground">Defaults to now. Change it to log a past seizure.</p>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type (optional)" />
            </SelectTrigger>
            <SelectContent>
              {SEIZURE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Witnessed */}
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="witnessed">Witnessed</Label>
            <Switch id="witnessed" checked={witnessed} onCheckedChange={setWitnessed} />
          </div>
          {witnessed && (
            <Input
              placeholder="Witness name"
              value={witnessName}
              onChange={(e) => setWitnessName(e.target.value)}
            />
          )}
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Duration</Label>
            <span className="text-sm text-muted-foreground tabular-nums">
              {duration === 0 ? "—" : `${duration}s`}
            </span>
          </div>
          <Slider
            value={[duration]}
            onValueChange={(v) => setDuration(v[0] ?? 0)}
            min={0}
            max={600}
            step={5}
          />
        </div>

        {/* Severity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Severity</Label>
            <span className="text-sm text-muted-foreground tabular-nums">{severity} / 10</span>
          </div>
          <Slider
            value={[severity]}
            onValueChange={(v) => setSeverity(v[0] ?? 5)}
            min={1}
            max={10}
            step={1}
          />
        </div>

        {/* Injury */}
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="injury">Injury</Label>
            <Switch id="injury" checked={injury} onCheckedChange={setInjury} />
          </div>
          {injury && (
            <Textarea
              placeholder="What happened?"
              value={injuryDescription}
              onChange={(e) => setInjuryDescription(e.target.value)}
              rows={2}
            />
          )}
        </div>

        {/* Rescue */}
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="rescue">Rescue medication used</Label>
            <Switch id="rescue" checked={rescueUsed} onCheckedChange={setRescueUsed} />
          </div>
          {rescueUsed && (
            <Input
              placeholder="Medication name"
              value={rescueName}
              onChange={(e) => setRescueName(e.target.value)}
            />
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else worth remembering…"
            rows={4}
          />
        </div>

        {/* Attachments */}
        <div className="space-y-3">
          <Label>Photos &amp; video</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => photoInput.current?.click()}>
              <Camera className="h-4 w-4 mr-2" /> Camera
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={() => galleryInput.current?.click()}>
              <ImageIcon className="h-4 w-4 mr-2" /> Photo
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={() => videoInput.current?.click()}>
              <Video className="h-4 w-4 mr-2" /> Video
            </Button>
          </div>
          {attachments.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {attachments.map((a) => (
                <div key={a.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  {a.kind === "photo" ? (
                    <img src={a.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video src={a.previewUrl} className="h-full w-full object-cover" muted />
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="absolute top-1 right-1 rounded-full bg-foreground/70 text-background p-1"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { addFiles(e.target.files, "photo"); e.target.value = ""; }}
          />
          <input
            ref={galleryInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { addFiles(e.target.files, "photo"); e.target.value = ""; }}
          />
          <input
            ref={videoInput}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { addFiles(e.target.files, "video"); e.target.value = ""; }}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>Location</Label>
          <Button
            type="button"
            variant="outline"
            onClick={captureLocation}
            disabled={locating}
            className="w-full justify-start"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            {location
              ? `Saved (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
              : "Capture my location"}
          </Button>
        </div>
      </div>

      <div className="mt-10 flex gap-3">
        <Button variant="ghost" onClick={goBack} className="flex-1" disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSaveDetailed} disabled={saving || quickSaving} className="flex-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save event"}
        </Button>
      </div>
    </div>
  );
}