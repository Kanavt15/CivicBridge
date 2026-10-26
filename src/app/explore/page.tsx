"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/components/localized-fields";
import { Input, Select, Control } from "@/components/localized-fields";
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
import { Text, useI18n } from "@/components/i18n";
function Discovery() {
  const initial = useSearchParams();
  const { t } = useI18n();
  const [query, setQuery] = useState(initial.get("q") ?? ""),
    [search, setSearch] = useState(initial.get("q") ?? ""),
    [category, setCategory] = useState(""),
    [city, setCity] = useState(""),
    [urgency, setUrgency] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("newest"),
    [view, setView] = useState("grid"),
    [page, setPage] = useState(1),
    [more, setMore] = useState(false);
  const params = new URLSearchParams({
    q: search,
    category,
    city,
    urgency,
    status,
    sort,
    page: String(page),
  });
  const { data, error, loading, reload } = useData("problems?" + params);
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
      <Breadcrumbs items={[{ label: "Problems" }]} />
      <PageIntro
        title="Explore problems"
        description="Find a problem you can help solve."
        action={
          <Button asChild>
            <Link href="/problems/new">
              <Plus size={17} />
              <Text>Report a problem</Text>
            </Link>
          </Button>
        }
      />
      <div className="filter-panel">
        <div className="discovery-search">
          <form
            className="filter-row"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(query);
              setPage(1);
            }}
          >
            <div className="search-input">
              <Search size={17} />
              <Input
                aria-label="Search problems or places"
                placeholder="Search problems or places"
                value={query}
                maxLength={200}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Text>Search</Text>
            </Button>
          </form>
          <Select
            aria-label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">
              <Text>All categories</Text>
            </option>
            {categories.map((c) => (
              <option value={c} key={c}>
                <Text>{c}</Text>
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMore((v) => !v)}
            aria-expanded={more}
          >
            <SlidersHorizontal size={16} />
            <Text>More filters</Text>
          </Button>
        </div>
        {more && (
          <div className="filter-row discovery-extra">
            <Input
              aria-label="City"
              placeholder="Filter by city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
            />
            <Select
              aria-label="Urgency"
              value={urgency}
              onChange={(e) => {
                setUrgency(e.target.value);
                setPage(1);
              }}
            >
              <option value="">
                <Text>Any urgency</Text>
              </option>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((v) => (
                <option value={v} key={v}>
                  <Text>{v[0] + v.slice(1).toLowerCase()}</Text>
                </option>
              ))}
            </Select>
            <Select
              aria-label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">
                <Text>All public statuses</Text>
              </option>
              {[
                ["OPEN", "Open for solutions"],
                ["COLLABORATION", "Collaboration"],
                ["PILOT", "Pilot implementation"],
                ["RESOLVED", "Resolved"],
              ].map(([v, l]) => (
                <option value={v} key={v}>
                  <Text>{l}</Text>
                </option>
              ))}
            </Select>
            <Control type="button" className="icon-btn" aria-label="Clear filters" onClick={reset}>
              <X size={16} />
            </Control>
          </div>
        )}
      </div>
      <div className="results-bar">
        <span>
          <strong>{data?.total ?? 0}</strong> <Text>results</Text>
        </span>
        <div className="filter-row">
          <Select
            aria-label="Sort challenges"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            {[
              ["newest", "Newest first"],
              ["popular", "Most supported"],
              ["urgent", "Highest urgency"],
            ].map(([v, l]) => (
              <option value={v} key={v}>
                <Text>{l}</Text>
              </option>
            ))}
          </Select>
          <div className="view-toggle">
            {[
              ["grid", "Grid view", LayoutGrid],
              ["list", "List view", List],
              ["map", "Map view", Map],
            ].map(([v, l, Icon]: any) => (
              <Control
                type="button"
                key={v}
                className={view === v ? "active" : ""}
                aria-label={t(l)}
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                <Icon size={16} />
              </Control>
            ))}
          </div>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data?.items?.length ? (
        <Empty
          title="No matching problems"
          description="Try another search or clear the filters."
          action={
            <Button type="button" variant="outline" onClick={reset}>
              <Text>Clear filters</Text>
            </Button>
          }
        />
      ) : view === "map" ? (
        <>
          <MapView points={data.items} large />
          <p className="map-hint">
            <Text>Map shows the current page.</Text>
          </p>
        </>
      ) : (
        <div className={view === "list" ? "problem-list" : "challenge-grid"}>
          {data.items.map((p: any) => (
            <ProblemCard key={p.id} problem={p} />
          ))}
        </div>
      )}
      {data?.pages > 1 && (
        <div className="pagination">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <Text>Previous</Text>
          </Button>
          <span>
            <Text>Page</Text> {page} <Text>of</Text> {data.pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <Text>Next</Text>
          </Button>
        </div>
      )}
    </div>
  );
}
export default function Explore() {
  return (
    <Suspense fallback={<Loading />}>
      <Discovery />
    </Suspense>
  );
}
