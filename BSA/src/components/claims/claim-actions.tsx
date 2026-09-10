import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionsForState, type ClaimActionKey } from "@/components/claims/claim-actions-model";
import type { LifecycleState } from "@/lib/domain/lifecycle";

/**
 * Actions allowed by lifecycle state. These are recorded locally only: no
 * lifecycle store method is called (Stream B's methods still throw), and no
 * lifecycle state changes here. A human operator remains the authority for
 * any state change once Task 8 is merged.
 */
export function ClaimActions({
  state,
  onAction,
}: {
  state: LifecycleState;
  onAction: (key: ClaimActionKey, text: string) => void;
}) {
  const actions = actionsForState(state);
  const [text, setText] = useState<Record<string, string>>({});

  if (actions.length === 0) {
    return <p className="text-sm text-muted-foreground">No pharmacy action is available while this claim is {state.replace(/_/g, " ")}.</p>;
  }

  return (
    <div className="space-y-4">
      {actions.map((a) => (
        <form
          key={a.key}
          className="space-y-2 rounded-md border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const value = (text[a.key] ?? "").trim();
            if (!value) return;
            onAction(a.key, value);
            setText((m) => ({ ...m, [a.key]: "" }));
          }}
        >
          <Label htmlFor={`action-${a.key}`}>{a.label}</Label>
          <p className="text-xs text-muted-foreground">{a.help}</p>
          <Textarea
            id={`action-${a.key}`}
            value={text[a.key] ?? ""}
            onChange={(e) => setText((m) => ({ ...m, [a.key]: e.target.value }))}
            placeholder={a.placeholder}
          />
          <Button type="submit" className="bg-teal-700 text-white hover:bg-teal-800">
            <Send aria-hidden="true" /> {a.label}
          </Button>
        </form>
      ))}
      <p className="text-xs text-muted-foreground">Recorded here only, as a synthetic note. No claim, payment or lifecycle state changes.</p>
    </div>
  );
}
