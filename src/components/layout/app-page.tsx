import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useRouteShellConfig, useShell } from "@/lib/native/shell-context";

type AppPageWidth = "sm" | "md" | "lg" | "xl";

const WIDTH_CLASS: Record<AppPageWidth, string> = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

type AppPageProps = {
  width?: AppPageWidth;
  /** auto: native shell owns tab-bar inset; web keeps page-level padding via className */
  safeBottom?: "auto" | "none" | "nav";
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">;

export function AppPage({
  width = "md",
  safeBottom = "auto",
  className,
  children,
  ...props
}: AppPageProps) {
  const { mode } = useShell();
  const shell = useRouteShellConfig();
  const isNative = mode === "native";

  const bottomClass =
    safeBottom === "none"
      ? ""
      : safeBottom === "nav"
        ? "pb-24"
        : isNative && shell.hideTabBar
          ? "pb-[max(1rem,env(safe-area-inset-bottom))]"
          : "";

  return (
    <div
      className={cn("mx-auto w-full", WIDTH_CLASS[width], bottomClass, className)}
      {...props}
    >
      {children}
    </div>
  );
}
