// 한 시간마다 GitHub Actions에서 실행되어 키워드별 내 업체 순위를 CSV에 한 줄씩 남긴다.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API = process.env.RANK_API || 'https://place-rank.naver-ad-web.pages.dev/api/place-rank';
const KEYWORDS = ['양양카페', '양양브런치', '양양맛집'];
const MINE = '달파도';
const DEFAULT_COORDS = { x: '128.669', y: '38.061' }; // 내 업체 좌표를 찾기 전 쓰는 손양면 대략값
const HEADER = 'checked_at,keyword,organic_rank,organic_count,total,ad_rank,ad_count,ad_total,ad_source,x,y,error';

const dir = process.argv[2] || '.';
const csvPath = join(dir, 'rank-log.csv');
const coordsPath = join(dir, 'coords.json');

const norm = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
const isMine = (p) => norm(p.name).includes(norm(MINE));
const cell = (v) => String(v ?? '').replace(/[,\r\n]+/g, ' ').slice(0, 120);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function kstNow() {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date());
  return parts.replace('T', ' ');
}

async function query(q, { x, y }) {
  const url = `${API}?${new URLSearchParams({ q, x, y, device: 'mobile' })}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
  const data = await res.json().catch(() => ({ error: `응답을 읽지 못함 (${res.status})` }));
  if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function toRow(at, q, data) {
  const ads = data.ads || [];
  const rank = data.organic.findIndex(isMine);
  const adRank = ads.findIndex(isMine);
  return [
    at, q, rank >= 0 ? rank + 1 : '', data.organic.length, data.total ?? '',
    adRank >= 0 ? adRank + 1 : '', ads.length, data.adTotal ?? '', data.adSource ?? '', data.x, data.y, '',
  ];
}

let coords = existsSync(coordsPath) ? JSON.parse(readFileSync(coordsPath, 'utf8')) : DEFAULT_COORDS;
const lines = [];
for (const q of KEYWORDS) {
  const at = kstNow();
  try {
    let data = await query(q, coords);
    const me = [...data.organic, ...(data.ads || [])].find((p) => isMine(p) && p.x && p.y);
    if (me && (String(me.x) !== coords.x || String(me.y) !== coords.y)) {
      coords = { x: String(me.x), y: String(me.y) };
      await wait(1500);
      data = await query(q, coords);
    }
    lines.push(toRow(at, q, data).map(cell).join(','));
  } catch (e) {
    lines.push([at, q, '', '', '', '', '', '', '', coords.x, coords.y, cell(e.message || e)].join(','));
  }
  await wait(1500);
}

if (!existsSync(csvPath)) writeFileSync(csvPath, `${HEADER}\n`);
appendFileSync(csvPath, `${lines.join('\n')}\n`);
writeFileSync(coordsPath, `${JSON.stringify(coords)}\n`);
console.log(lines.join('\n'));
