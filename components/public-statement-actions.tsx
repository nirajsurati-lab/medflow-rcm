"use client";

import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type PublicStatementActionsProps = {
  statementId: string;
  token: string;
  isPaid: boolean;
};

export function PublicStatementActions({
  statementId,
  token,
  isPaid,
}: PublicStatementActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/statements/${statementId}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; url?: string }
        | null;

      if (!response.ok || !result?.url) {
        throw new Error(result?.error ?? "Unable to start checkout.");
      }

      window.location.href = result.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Checkout failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="button"
        className="w-full"
        disabled={isPaid || isLoading}
        onClick={handleCheckout}
      >
        {isPaid ? "Statement paid" : isLoading ? "Opening checkout..." : "Pay with Stripe"}
      </Button>
    </div>
  );
}
