"use client";

import Link from "@/components/localized-fields";
import {
  AlertCircle,
  ArrowRight,
  MapPin,
  ThumbsUp,
  Lightbulb,
  Droplets,
  Trash2,
  Sprout,
  Bus,
  GraduationCap,
  HeartPulse,
  Building2,
  Leaf,
  Shield,
  Globe,
  ChevronRight,
  CircleCheck,
  LoaderCircle,
  Inbox,
} from "lucide-react";
import { categories } from "@/lib/domain";
import { label, cn } from "@/lib/utils";
import { Text, useI18n } from "./i18n";
import { localeTags } from "@/lib/i18n/messages";
import { Button } from "./ui/button";
export const categoryIcons = [
  Trash2,
  Droplets,
  GraduationCap,
  HeartPulse,
  Building2,
  Sprout,
  Leaf,
  Shield,
  Bus,
  Globe,
];
export function CategoryIcon({ category, size = 19 }: { category: string; size?: number }) {
  const Icon =
    categoryIcons[Math.max(0, categories.indexOf(category as (typeof categories)[number]))];
  return <Icon size={size} />;
}
export function Badge({
  children,
  type = "neutral",
}: {
  children: React.ReactNode;
  type?: string;
}) {
  return (
    <span className={cn("badge", "badge-" + type.toLowerCase())}>
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </span>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <Badge type={value}>
      <Text>
        {value === "OPEN"
          ? "Open for solutions"
          : value === "PILOT"
            ? "Pilot implementation"
            : label(value)}
      </Text>
    </Badge>
  );
}
export function DemoBadge() {
  return (
    <span className="demo-tag">
      <Text>Demo</Text>
    </span>
  );
}
export function PageIntro({
  title,
  description,
  action,
  content = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  content?: boolean;
}) {
  return (
    <div className="page-intro">
      <div>
        <h1>{content ? title : <Text>{title}</Text>}</h1>
        <p>{content ? description : <Text>{description}</Text>}</p>
      </div>
      {action}
    </div>
  );
}
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">
        <Text>Home</Text>
      </Link>
      {items.map((i, n) => (
        <span key={n}>
          <ChevronRight size={12} />
          {i.href ? (
            <Link href={i.href}>
              <Text>{i.label}</Text>
            </Link>
          ) : (
            <Text>{i.label}</Text>
          )}
        </span>
      ))}
    </nav>
  );
}
export function Loading() {
  return (
    <div className="loading-area" role="status">
      <LoaderCircle className="spin" size={23} />
      <span>
        <Text>Loading…</Text>
      </span>
      <div className="skeleton-row">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
export function ErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <span className="state-icon">
        <AlertCircle size={24} />
      </span>
      <h3>
        <Text>We couldn’t load this page</Text>
      </h3>
      <p>
        <Text>{error}</Text>
      </p>
      {retry && (
        <Button onClick={retry} variant="outline">
          <Text>Try again</Text>
        </Button>
      )}
      {error.includes("Sign in") && (
        <Button asChild>
          <Link href="/login">
            <Text>Sign in</Text>
          </Link>
        </Button>
      )}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="state-icon">
        <Inbox size={24} />
      </span>
      <h3>
        <Text>{title}</Text>
      </h3>
      <p>
        <Text>{description}</Text>
      </p>
      {action}
    </div>
  );
}
export function ProblemCard({ problem: p }: { problem: any }) {
  const { t } = useI18n();
  return (
    <article className="problem-card">
      {p.images?.[0] && (
        <div className="problem-photo">
          <img src={"/api/files/" + p.images[0].id} alt={p.title} loading="lazy" />
        </div>
      )}
      <div className="problem-card-body">
        <div className="problem-category">
          <span className="category-symbol">
            <CategoryIcon category={p.category} size={18} />
          </span>
          <Text>{p.category}</Text>
          {p.isDemo && <DemoBadge />}
        </div>
        <h3>
          <Link href={"/problems/" + p.id}>{p.title}</Link>
        </h3>
        <p>{p.description}</p>
        <div className="location">
          <MapPin size={14} />
          {p.city}
          <span className="location-state">, {p.state}</span>
        </div>
        <div className="problem-card-foot">
          <Status value={p.status} />
          <Link href={"/problems/" + p.id} className="card-arrow" aria-label={t("View details")}>
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="problem-meta">
          <span>
            <ThumbsUp size={13} />
            {p._count?.votes ?? 0} <Text>supporters</Text>
          </span>
          <span>
            <Lightbulb size={13} />
            {p._count?.proposals ?? 0} <Text>solutions</Text>
          </span>
          {p.match > 0 && <span className="match">{p.match}%</span>}
        </div>
      </div>
    </article>
  );
}
export function Timeline({ items }: { items: any[] }) {
  const { locale } = useI18n();
  return (
    <ol className="timeline">
      {items.map((i, n) => (
        <li key={i.id || n}>
          <CircleCheck size={17} />
          <div>
            <strong>
              <Text>{label(i.toStatus || i.action)}</Text>
            </strong>
            {i.note && <p>{i.note}</p>}
            <small>
              {new Date(i.createdAt).toLocaleString(localeTags[locale], {
                timeZone: "Asia/Kolkata",
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              <Text>{" IST"}</Text>
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}
