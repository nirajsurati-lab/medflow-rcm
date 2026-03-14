"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Section } from "@/components/system/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/types/database";

type LocationsAdminProps = {
  locations: Database["public"]["Tables"]["locations"]["Row"][];
};

export function LocationsAdmin({ locations }: LocationsAdminProps) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    const response = await fetch("/api/settings/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(result?.error ?? "Unable to create location.");
      return;
    }

    setNewName("");
    router.refresh();
  }

  async function handleRename(id: string) {
    const response = await fetch(`/api/settings/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editing[id] }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(result?.error ?? "Unable to rename location.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Location error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Section
        eyebrow="Location Setup"
        title="Practice locations"
        description="Add and rename locations used by the workspace filter."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Add a new location" />
          <Button type="button" onClick={handleCreate}>
            Add location
          </Button>
        </div>
      </Section>

      <Section
        eyebrow="Current Locations"
        title="Location list"
        description="The sidebar location switcher uses these entries."
      >
        <div className="space-y-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="flex flex-col gap-3 rounded-[22px] border border-border/70 bg-white/78 px-4 py-4 sm:flex-row sm:items-center"
            >
              <Input
                value={editing[location.id] ?? location.name}
                onChange={(event) =>
                  setEditing((current) => ({ ...current, [location.id]: event.target.value }))
                }
              />
              <Button type="button" variant="outline" onClick={() => handleRename(location.id)}>
                Rename
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
