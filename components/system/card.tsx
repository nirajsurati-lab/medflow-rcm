import type { ComponentProps } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AppCard({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "border-border/60 bg-white/78 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.38)] backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}

export const AppCardHeader = CardHeader;
export const AppCardTitle = CardTitle;
export const AppCardDescription = CardDescription;
export const AppCardContent = CardContent;
export const AppCardFooter = CardFooter;
export const AppCardAction = CardAction;
