"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List, Map, Plus, X } from "lucide-react";
import { useData } from "@/lib/client";
import { categories } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import {
  Breadcrumbs,
  PageIntro,
  Loading,
  ErrorState,
  Empty,
  ProblemCard,
} from "@/components/common";
import { MapView } from "@/components/map";
export default function Explore() {
  const [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [city, setCity] = useState(""),
    [urgency, setUrgency] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("newest"),
    [view, setView] = useState("grid"),
    [page, setPage] = useState(1);
  const params = new URLSearchParams({
    q: search,
    category,
    city,
    urgency,
    status,
    sort,
    page: String(page),
  });
  const { data, error, loading, reload } = useData(`problems?${params}`);
  function reset() {
    setQuery("");
    setSearch("");
    setCategory("");
    setCity("");
    setUrgency("");
    setStatus("");
    setPage(1);
  }
  return (
    <div className="container page-wrap">
      <Breadcrumbs items={[{ label: "Explore challenges" }]} />
      <PageIntro
        eyebrow="Find your opportunity to make a difference"
        title="Every challenge is a beginning."
        description="Discover what your community needs. Bring your perspective, your skills, and your next big idea."
        action={
          <Button asChild>
            <Link href="/problems/new">
              <Plus size={17} />
              Report a problem
            </Link>
          </Button>
        }
      />
      <div className="filter-panel">
        <form
          className="filter-row"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(query);
            setPage(1);
          }}
        >
          <div className="search-input">
            <Search size={18} />
            <input
              aria-label="Search challenges"
              placeholder="Search challenges, places, or ideas…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit">
            <Search size={16} />
            Search
          </Button>
        </form>
        <div className="filter-row">
          <SlidersHorizontal size={17} />
          <select
            aria-label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            aria-label="City"
            className="input"
            value={city}
            placeholder="Filter by city"
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label="Urgency"
            value={urgency}
            onChange={(e) => {
              setUrgency(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Any urgency</option>
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((v) => (
              <option key={v} value={v}>
                {v.toLowerCase()}
              </option>
            ))}
          </select>
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All public statuses</option>
            <option value="OPEN">Open for solutions</option>
            <option value="COLLABORATION">Collaboration</option>
            <option value="PILOT">Pilot implementation</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <button className="icon-btn" onClick={reset} aria-label="Reset filters">
            <X size={17} />
          </button>
        </div>
      </div>
      <div className="results-bar">
        <span>
          <strong>{data?.total ?? 0}</strong> challenges to explore{" "}
          {view === "map" && "· map shows the current results page"}
        </span>
        <div className="filter-row">
          <select
            aria-label="Sort challenges"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Newest first</option>
            <option value="popular">Most supported</option>
            <option value="urgent">Highest urgency</option>
          </select>
          <div className="view-toggle">
            {[
              ["grid", LayoutGrid],
              ["list", List],
              ["map", Map],
            ].map(([v, Icon]: any) => (
              <button
                key={v}
                className={view === v ? "active" : ""}
                onClick={() => setView(v)}
                aria-label={`${v} view`}
                aria-pressed={view === v}
              >
                <Icon size={15} />
                <span>{v}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data?.items.length ? (
        <Empty
          title="A fresh opportunity awaits"
          description="Try another city or category, or clear your filters."
          action={
            <Button variant="outline" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : view === "map" ? (
        <MapView points={data.items} large />
      ) : (
        <div className={view === "list" ? "problem-list" : "challenge-grid"}>
          {data.items.map((p: any) => (
            <ProblemCard key={p.id} problem={p} />
          ))}
        </div>
      )}
      {data?.pages > 1 && (
        <div className="pagination">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {data.pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
