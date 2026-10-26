"use client";
import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowUpRight,
  Lightbulb,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useData } from "@/lib/client";
import { categories } from "@/lib/domain";
import { CategoryIcon, Status, DemoBadge, Loading, ErrorState, Empty } from "@/components/common";
import { Button } from "@/components/ui/button";
import { InstallApp } from "@/components/app-experience";

export default function CommunityApp() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"problems" | "solutions">("problems");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);
  const query = new URLSearchParams({ q: deferredSearch, category, page: String(page) });
  const { data, loading, error, reload } = useData(
    tab === "problems" ? `problems?${query}` : "proposals",
  );
  const items =
    tab === "problems"
      ? (data?.items ?? [])
      : (Array.isArray(data) ? data : []).filter(
          (p: any) =>
            (!category || p.problem.category === category) &&
            `${p.title} ${p.approach} ${p.problem.city}`
              .toLowerCase()
              .includes(deferredSearch.toLowerCase()),
        );
  const canReport = session && ["CITIZEN", "ADMIN"].includes(session.user.role);
  const canPropose = session && ["RESEARCHER", "INSTITUTION", "ADMIN"].includes(session.user.role);
  return (
    <div className="container community-app">
      <section className="app-welcome">
        <div>
          <p className="app-greeting">
            {session
              ? `Welcome, ${session.user.name?.split(" ")[0] ?? "neighbour"}`
              : "Your community, in your hands"}
          </p>
          <h1>
            Notice a problem.
            <br />
            Start something better.
          </h1>
          <p>Share what needs attention, or bring an idea that helps.</p>
        </div>
        <div className="app-post-actions">
          <Link href={session && !canReport ? "/explore" : "/problems/new"}>
            <span className="app-action-icon">
              <Plus size={25} />
            </span>
            <strong>{session && !canReport ? "Find a problem" : "Post a problem"}</strong>
            <span>
              {session && !canReport
                ? "Find where your expertise can help"
                : "A photo, a location, and your voice"}
            </span>
            <ArrowUpRight size={21} />
          </Link>
          <Link href={session && !canPropose ? "/innovations" : "/solutions/new"}>
            <span className="app-action-icon">
              <Lightbulb size={25} />
            </span>
            <strong>{session && !canPropose ? "Explore solutions" : "Propose a solution"}</strong>
            <span>
              {session && !canPropose
                ? "See how teams are making progress"
                : "Turn an open challenge into a practical plan"}
            </span>
            <ArrowUpRight size={21} />
          </Link>
        </div>
      </section>
      {!session && (
        <div className="app-account-prompt">
          <ShieldCheck size={19} />
          <p>
            <Link href="/register">Create an account</Link> or <Link href="/login">sign in</Link> to
            post and track progress. Citizen accounts report problems; researchers and institutions
            propose solutions.
          </p>
        </div>
      )}
      <InstallApp />
      <section className="app-feed" aria-label="Community posts">
        <div className="app-feed-heading">
          <h2>What’s happening nearby</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={reload}
            aria-label="Refresh community posts"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="app-feed-tabs" role="group" aria-label="Choose post type">
          <button
            type="button"
            aria-pressed={tab === "problems"}
            onClick={() => {
              setTab("problems");
              setPage(1);
            }}
          >
            Problems
          </button>
          <button
            type="button"
            aria-pressed={tab === "solutions"}
            onClick={() => {
              setTab("solutions");
              setPage(1);
            }}
          >
            Solutions
          </button>
        </div>
        <div className="app-feed-filters">
          <label>
            <Search size={18} />
            <span className="sr-only">Search community posts</span>
            <input
              type="search"
              placeholder="Search a problem, idea, or city"
              value={search}
              maxLength={200}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Every category</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} retry={reload} />
        ) : !items.length ? (
          <Empty
            title="Nothing here yet"
            description="Try another category or search, or be the first to contribute."
          />
        ) : (
          <div className="app-feed-grid">
            {items.map((p: any) => (
              <article className="app-post" key={p.id}>
                <div className="app-post-meta">
                  <CategoryIcon category={p.category ?? p.problem.category} />
                  <span>{p.category ?? p.problem.category}</span>
                  {p.isDemo && <DemoBadge />}
                </div>
                <h3>
                  <Link href={tab === "problems" ? `/problems/${p.id}` : `/innovations/${p.id}`}>
                    {p.title}
                  </Link>
                </h3>
                <p>{p.description ?? p.approach}</p>
                <div className="app-post-footer">
                  <span>
                    <MapPin size={14} />
                    {p.city ?? p.problem.city}
                  </span>
                  <Status value={p.status} />
                </div>
                {tab === "problems" && p.status === "OPEN" && canPropose && (
                  <Link
                    className="text-link app-propose-link"
                    href={`/solutions/new?problem=${encodeURIComponent(p.id)}`}
                  >
                    Propose a solution <ArrowUpRight size={15} />
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
        {tab === "problems" && data?.pages > 1 && (
          <div className="app-pagination">
            <Button
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {data.pages}
            </span>
            <Button
              variant="outline"
              disabled={page >= data.pages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
        {tab === "solutions" && (
          <p className="map-hint">
            Showing up to 100 recently reviewed public solutions. Your pending submissions are in My
            activity.
          </p>
        )}
      </section>
    </div>
  );
}
