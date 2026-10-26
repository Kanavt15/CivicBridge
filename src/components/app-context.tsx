"use client";
import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { toAppHref } from "@/lib/app-navigation";

export const AppModeContext = createContext(false);
export const useAppMode = () => useContext(AppModeContext);
export function usePlatformRouter() {
  const router = useRouter();
  const app = useAppMode();
  return {
    ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) =>
      router.push(app ? toAppHref(href) : href, options),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) =>
      router.replace(app ? toAppHref(href) : href, options),
  };
}
