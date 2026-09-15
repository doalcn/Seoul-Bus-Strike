"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { routes, type BusRoute, type Stop } from "./data/routes";

function Badge({ route }: { route: BusRoute }) {
  return <span className="route-badge" style={{ "--route-color": route.color } as React.CSSProperties}>{route.number}</span>;
}

function RouteMap({ routes: visible, selected, chooseRoute, chooseStop }: { routes: BusRoute[]; selected: string | null; chooseRoute: (id: string) => void; chooseStop: (stop: Stop) => void }) {
  return <div className="map-canvas" aria-label="임시버스 노선 지도">
    <div className="water water-one" /><div className="water water-two" /><div className="river" />
    <span className="map-label north">강북</span><span className="map-label center">도심</span><span className="map-label east">동서울</span><span className="map-label south">강남</span>
    <svg className="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
      {visible.map((route) => <g key={route.id} className={selected && selected !== route.id ? "muted" : ""}>
        <polyline className="route-shadow" points={route.stops.map((s) => `${s.position.x},${s.position.y}`).join(" ")} />
        <polyline className="route-line" stroke={route.color} points={route.stops.map((s) => `${s.position.x},${s.position.y}`).join(" ")} onClick={() => chooseRoute(route.id)} />
        {route.stops.map((stop) => <circle key={`${route.id}-${stop.id}`} className="stop-dot" fill={route.color} cx={stop.position.x} cy={stop.position.y} r="1.3" onClick={() => chooseStop(stop)} />)}
      </g>)}
    </svg>
    <span className="map-hint">공식 경유지 기반 · 실제 지도 API 연결 전</span><div className="map-controls"><button>+</button><button>−</button></div>
  </div>;
}

export default function Home() {
  const [query, setQuery] = useState(""); const [district, setDistrict] = useState("전체");
  const [selectedId, setSelectedId] = useState<string | null>(null); const [selectedStop, setSelectedStop] = useState<Stop | null>(null); const [searched, setSearched] = useState(false);
  const [shuttleRoutes, setShuttleRoutes] = useState<BusRoute[]>([]);
  useEffect(() => { fetch("/api/shuttle-routes").then((response) => response.ok ? response.json() : null).then((data) => setShuttleRoutes(data?.routes ?? [])).catch(() => undefined); }, []);
  const allRoutes = useMemo(() => [...routes, ...shuttleRoutes], [shuttleRoutes]);
  const districts = useMemo(() => ["전체", ...new Set(allRoutes.map((route) => route.district))], [allRoutes]);
  const visible = useMemo(() => allRoutes.filter((route) => district === "전체" || route.district === district), [allRoutes, district]);
  const selectedRoute = allRoutes.find((route) => route.id === selectedId) ?? null;
  const found = useMemo(() => { const q = query.trim().toLowerCase(); const items = new Map<string, Stop>(); if (q) allRoutes.forEach((r) => r.stops.forEach((s) => { if (s.name.toLowerCase().includes(q)) items.set(s.id, s); })); return [...items.values()]; }, [allRoutes, query]);
  const routesFor = (stop: Stop) => allRoutes.filter((route) => route.stops.some((item) => item.id === stop.id));
  const chooseRoute = (id: string) => { setSelectedId(id === selectedId ? null : id); setSelectedStop(null); };
  const chooseStop = (stop: Stop) => { setSelectedStop(stop); setSelectedId(null); };
  const search = (e: FormEvent) => { e.preventDefault(); setSearched(true); if (found.length === 1) chooseStop(found[0]); };
  return <main>
    <header className="topbar"><a className="brand" href="#top"><span>🚌</span><strong>서울 임시버스 지도</strong></a><span className="notice-dot">파업 비상수송 안내</span></header>
    <section className="hero" id="top"><p className="eyebrow">SEOUL EMERGENCY TRANSPORT</p><h1>임시버스 노선을<br />한눈에 찾아보세요.</h1><p>정류장 이름을 검색하면 해당 정류장을 지나는<br className="desktop-only" /> 임시버스 노선과 운행 정보를 확인할 수 있어요.</p></section>
    <section className="app-shell">
      <aside className="sidebar">
        <form className="search-box" onSubmit={search}><label htmlFor="stop-search">정류장 검색</label><div className="search-input"><span>⌕</span><input id="stop-search" value={query} onChange={(e) => { setQuery(e.target.value); setSearched(false); }} placeholder="예: 서울역, 강남역" /><button>검색</button></div></form>
        <div className="filter-section"><p>운행 지역</p><div className="chips">{districts.map((name) => <button key={name} className={district === name ? "active" : ""} onClick={() => setDistrict(name)}>{name}</button>)}</div></div>
        <div className="result-panel" aria-live="polite">
          {selectedStop ? <><p className="panel-kicker">선택한 정류장</p><h2>📍 {selectedStop.name}</h2><p className="description">이 정류장을 지나는 임시버스</p><div className="results">{routesFor(selectedStop).map((r) => <button className="result" key={r.id} onClick={() => chooseRoute(r.id)}><Badge route={r} /><span><strong>{r.name}</strong><small>{r.stops[0].name} ↔ {r.stops.at(-1)?.name}</small></span><b>›</b></button>)}</div></> : selectedRoute ? <><p className="panel-kicker">선택한 임시노선</p><h2><Badge route={selectedRoute} /> {selectedRoute.name}</h2><p className="description">{selectedRoute.district} · {selectedRoute.frequency}</p><div className="time"><span>첫차<strong>{selectedRoute.firstBus}</strong></span><span>막차<strong>{selectedRoute.lastBus}</strong></span></div><ol>{selectedRoute.stops.map((s) => <li key={s.id}><button onClick={() => chooseStop(s)}>{s.name}</button></li>)}</ol></> : searched ? <><p className="panel-kicker">검색 결과</p>{found.length ? <><h2>일치하는 정류장 {found.length}곳</h2><div className="results">{found.map((s) => <button className="result" key={s.id} onClick={() => chooseStop(s)}><span className="pin">●</span><span><strong>{s.name}</strong><small>임시버스 {routesFor(s).map((r) => r.number).join(", ")}</small></span><b>›</b></button>)}</div></> : <><h2>검색 결과가 없어요</h2><p className="description">다른 정류장 이름으로 다시 검색해 보세요.</p></>}</> : <><p className="panel-kicker">서울시 공식 주간선 비상수송버스</p><h2>노선을 선택해 보세요</h2><p className="description">지도 위의 색깔 선이나 아래 목록을 누르면 정류장과 운행 정보를 볼 수 있어요.</p><div className="results">{visible.map((r) => <button className="result" key={r.id} onClick={() => chooseRoute(r.id)}><Badge route={r} /><span><strong>{r.name}</strong><small>{r.frequency}</small></span><b>›</b></button>)}</div></>}</div>
      </aside>
      <section className="map-section"><div className="map-header"><div><p>지도에서 노선 확인</p><strong>{district === "전체" ? "서울시 전체" : district}</strong></div><span>{visible.length}개 노선 표시 중</span></div><RouteMap routes={visible} selected={selectedId} chooseRoute={chooseRoute} chooseStop={chooseStop} /><div className="legend">{visible.map((r) => <button key={r.id} className={selectedId === r.id ? "selected" : ""} onClick={() => chooseRoute(r.id)}><i style={{ background: r.color }} /><b>{r.number}</b>{r.name}</button>)}</div></section>
    </section><footer>※ 서울시 공식 공지(2026.09.15 갱신)의 주간선 비상수송버스 경유지 기준입니다. 실제 운행 여부와 상세 배차는 공식 안내를 다시 확인해 주세요.</footer>
  </main>;
}
