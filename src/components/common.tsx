"use client";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  MapPin,
  MessageCircle,
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
  return <span className={cn("badge", `badge-${type.toLowerCase()}`)}>{children}</span>;
}
export function Status({ value }: { value: string }) {
  return (
    <Badge type={value}>
      {value === "OPEN"
        ? "Open for solutions"
        : value === "PILOT"
          ? "Pilot implementation"
          : label(value)}
    </Badge>
  );
}
export function DemoBadge() {
  return <span className="demo-tag">Demo</span>;
}
export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        {eyebrow && <div className="section-kicker">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      {items.map((i, n) => (
        <span key={n}>
          <ChevronRight size={13} />
          {i.href ? <Link href={i.href}>{i.label}</Link> : i.label}
        </span>
      ))}
    </nav>
  );
}
export function Loading() {
  return (
    <div className="loading-area" role="status">
      <LoaderCircle className="spin" size={26} />
      <span>Connecting the dots…</span>
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
      <AlertCircle size={32} />
      <h3>We couldn’t load this page</h3>
      <p>{error}</p>
      {retry && (
        <Button onClick={retry} variant="outline">
          Try again
        </Button>
      )}
      {error.includes("Sign in") && (
        <Button asChild>
          <Link href="/login">Sign in</Link>
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
      <Inbox size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ProblemCard({ problem: p }: { problem: any }) {
  return (
    <article className="problem-card">
      <div className={cn("problem-art", `art-${categories.indexOf(p.category)}`)}>
        {p.images?.[0] ? (
          <img src={`/api/files/${p.images[0].id}`} alt={p.title} />
        ) : (
          <>
            <div className="art-landscape" />
            <CategoryIcon category={p.category} size={50} />
          </>
        )}
        <div className="art-top">
          <Badge type="white">
            <CategoryIcon category={p.category} size={13} />
            {p.category}
          </Badge>
          {p.isDemo && <DemoBadge />}
        </div>
        <span className={cn("urgency-flag", p.urgency.toLowerCase())}>
          <i />
          {label(p.urgency)} priority
        </span>
      </div>
      <div className="problem-card-body">
        <div className="location">
          <MapPin size={13} />
          {p.city}, {p.state}
        </div>
        <h3>
          <Link href={`/problems/${p.id}`}>{p.title}</Link>
        </h3>
        <p>{p.description}</p>
        <div className="problem-card-foot">
          <Status value={p.status} />
          <Link href={`/problems/${p.id}`} className="card-arrow" aria-label={`View ${p.title}`}>
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="problem-meta">
          <span>
            <ThumbsUp size={13} />
            {p._count?.votes ?? 0} supporters
          </span>
          <span>
            <Lightbulb size={13} />
            {p._count?.proposals ?? 0} solutions
          </span>
          {p.match > 0 && <span className="match">{p.match}% match</span>}
        </div>
      </div>
    </article>
  );
}
export function Timeline({ items }: { items: any[] }) {
  return (
    <ol className="timeline">
      {items.map((i, n) => (
        <li key={i.id || n}>
          <CircleCheck size={17} />
          <div>
            <strong>{label(i.toStatus || i.action)}</strong>
            {i.note && <p>{i.note}</p>}
            <small>
              {new Date(i.createdAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              IST
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}
