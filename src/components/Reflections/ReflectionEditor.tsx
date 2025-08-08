import { useState, useCallback } from "react";
import { useAutosave } from "@/hooks/useAutosave";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReflectionEditor({ prompt, storageKey, onWritten }: { prompt: string; storageKey: string; onWritten?: () => void; }) {
  const [text, setText] = useState<string>(() => localStorage.getItem(storageKey) || "");

  const save = useCallback((val: string) => {
    localStorage.setItem(storageKey, val);
    if (val.trim().length > 10) onWritten?.();
  }, [storageKey, onWritten]);

  useAutosave(text, save, 700);

  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{prompt}</Label>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your reflection…"
        className="min-h-[120px]"
      />
      <p className="text-xs text-muted-foreground">Autosaving…</p>
    </div>
  );
}
