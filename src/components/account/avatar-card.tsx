import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { getAvatarSignedUrl, setAvatarPath } from "@/lib/avatar.functions";
import { toast } from "sonner";
import { userMessage } from "@/lib/user-message";

function initialsFrom(first?: string | null, last?: string | null, email?: string | null) {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (f || l) return ((f[0] ?? "") + (l[0] ?? "")).toUpperCase() || (f[0] ?? "?").toUpperCase();
  return ((email ?? "?")[0] ?? "?").toUpperCase();
}

const MAX_BYTES = 2 * 1024 * 1024;

export function AvatarCard() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const fetchAvatar = useServerFn(getAvatarSignedUrl);
  const setPath = useServerFn(setAvatarPath);
  const q = useQuery({
    queryKey: ["avatar", "me"],
    queryFn: () => fetchAvatar(),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
  const initials = initialsFrom(q.data?.first_name, q.data?.last_name, session?.user?.email);

  const onPick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 2 MB");
      return;
    }
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
      const path = `${userId}/avatar/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("journal-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      await setPath({ data: { path } });
      await qc.invalidateQueries({ queryKey: ["avatar", "me"] });
      toast.success("Profile picture updated");
    } catch (err: unknown) {
      toast.error(
        userMessage(
          err,
          "The upload didn't finish. Check your connection and try again; the file is still on your device.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (!userId || !q.data?.path) return;
    setBusy(true);
    try {
      await supabase.storage.from("journal-media").remove([q.data.path]);
      await setPath({ data: { path: null } });
      await qc.invalidateQueries({ queryKey: ["avatar", "me"] });
      toast.success("Profile picture removed");
    } catch (err: unknown) {
      toast.error(userMessage(err, "That didn't remove. Try again in a moment."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-[15px] text-[#FAFAFC]">Profile picture</p>
      <p className="mt-1 text-[13px] sheet-muted">Used in your menu and shared with caregivers.</p>
      <div className="mt-5 flex items-center gap-4">
        <span
          className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-xl font-medium text-white"
          style={{ background: q.data?.url ? "transparent" : "var(--purple-primary, #7c5cff)" }}
        >
          {q.data?.url ? (
            <img src={q.data.url} alt="Your avatar" className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onPick}
            disabled={busy}
            variant="outline"
            className="bg-white/[0.04] border-white/10 text-[#FAFAFC] hover:bg-white/10"
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload photo
          </Button>
          {q.data?.path && (
            <Button
              type="button"
              onClick={onRemove}
              disabled={busy}
              variant="ghost"
              className="text-white/70 hover:text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
    </div>
  );
}
