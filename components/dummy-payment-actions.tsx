"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type DummyPaymentActionsProps = {
  paymentId: string;
};

export function DummyPaymentActions({
  paymentId,
}: DummyPaymentActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSimulation(status: "paid" | "cancelled") {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/${paymentId}/simulate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; details?: string[] }
        | null;

      if (!response.ok) {
        throw new Error(
          [result?.error ?? "Unable to simulate payment.", ...(result?.details ?? [])]
            .filter(Boolean)
            .join(" ")
        );
      }

      router.push(
        `/?tab=payments&status=${status === "paid" ? "success" : "cancelled"}`
      );
      router.refresh();
    } catch (simulationError) {
      setError(
        simulationError instanceof Error
          ? simulationError.message
          : "Unable to simulate payment."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Simulation failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => handleSimulation("paid")}
          disabled={isSubmitting}
        >
          Simulate success
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSimulation("cancelled")}
          disabled={isSubmitting}
        >
          Simulate cancellation
        </Button>
      </div>
    </div>
  );
}
