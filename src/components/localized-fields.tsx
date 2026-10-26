"use client";
import NextLink from "next/link";
import { useI18n } from "./i18n";
import { useAppMode } from "./app-context";
import { toAppHref } from "@/lib/app-navigation";
export function Input(props: React.ComponentProps<"input">) {
  const { t } = useI18n();
  return (
    <input
      {...props}
      placeholder={props.placeholder ? t(props.placeholder) : undefined}
      aria-label={props["aria-label"] ? t(props["aria-label"]) : undefined}
      title={props.title ? t(props.title) : undefined}
    />
  );
}
export function Textarea(props: React.ComponentProps<"textarea">) {
  const { t } = useI18n();
  return (
    <textarea
      {...props}
      placeholder={props.placeholder ? t(props.placeholder) : undefined}
      aria-label={props["aria-label"] ? t(props["aria-label"]) : undefined}
    />
  );
}
export function Select(props: React.ComponentProps<"select">) {
  const { t } = useI18n();
  return (
    <select {...props} aria-label={props["aria-label"] ? t(props["aria-label"]) : undefined} />
  );
}
export function Control(props: React.ComponentProps<"button">) {
  const { t } = useI18n();
  return (
    <button
      {...props}
      aria-label={props["aria-label"] ? t(props["aria-label"]) : undefined}
      title={props.title ? t(props.title) : undefined}
    />
  );
}
export default function Link(props: React.ComponentProps<typeof NextLink>) {
  const { t } = useI18n();
  const app = useAppMode();
  const href = !app
    ? props.href
    : typeof props.href === "string"
      ? toAppHref(props.href)
      : props.href.protocol || props.href.host || props.href.hostname
        ? props.href
        : {
            ...props.href,
            pathname: props.href.pathname ? toAppHref(props.href.pathname) : props.href.pathname,
          };
  return (
    <NextLink
      {...props}
      href={href}
      aria-label={props["aria-label"] ? t(props["aria-label"]) : undefined}
      title={props.title ? t(props.title) : undefined}
    />
  );
}
