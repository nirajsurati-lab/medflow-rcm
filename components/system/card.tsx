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
        "border-white/80 bg-white/90 shadow-sm shadow-slate-200/70 backdrop-blur",
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
