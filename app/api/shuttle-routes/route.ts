import type { BusRoute, Stop } from "../../data/routes";

const districts = ["종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구"];
const colors = ["#e8590c", "#1971c2", "#2f9e44", "#9c36b5", "#d6336c", "#0c8599", "#f08c00"];

const clean = (value: string) => value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const cells = (row: string) => [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((cell) => clean(cell[1]));
const point = (routeIndex: number, stopIndex: number): Stop["position"] => ({ x: 8 + ((routeIndex * 17 + stopIndex * 11) % 82), y: 12 + ((routeIndex * 13 + stopIndex * 9) % 72) });

function parse(html: string): BusRoute[] {
  const section = html.slice(html.indexOf('<div class="tab-contents">'));
  const tables = [...section.matchAll(/<table class="cont-table">([\s\S]*?)<\/table>/g)].slice(0, 25);
  return tables.flatMap((table, districtIndex) => {
    const rows = [...table[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1);
    return rows.map((row, rowIndex) => {
      const values = cells(row[1]);
      const [label, journey, , , , frequency] = values;
      if (!label || !journey) return null;
      const rawStops = journey.split(/[~→↔-]/).map((name) => name.replace(/\([^)]*\)/g, "").trim()).filter(Boolean);
      const id = `shuttle-${districtIndex + 1}-${rowIndex + 1}`;
      return {
        id,
        number: `${districts[districtIndex]} ${label}`,
        name: `${districts[districtIndex]} 무료 셔틀`,
        district: districts[districtIndex],
        color: colors[(districtIndex + rowIndex) % colors.length],
        firstBus: "06:00",
        lastBus: "자치구별 상이",
        frequency: frequency || "자치구별 상이",
        stops: rawStops.map((name, stopIndex) => ({ id: `${id}-stop-${stopIndex}`, name, position: point(districtIndex * 10 + rowIndex, stopIndex) })),
      } satisfies BusRoute;
    }).filter((route): route is BusRoute => route !== null);
  });
}

export async function GET() {
  try {
    const response = await fetch("https://news.seoul.go.kr/traffic/archives/516012", { next: { revalidate: 900 } });
    if (!response.ok) throw new Error("Official source unavailable");
    return Response.json({ source: "서울특별시", routes: parse(await response.text()) });
  } catch {
    return Response.json({ source: "unavailable", routes: [] }, { status: 503 });
  }
}
