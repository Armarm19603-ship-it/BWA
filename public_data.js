/* HSBC BWA V9 / public display. Reads only RLS-approved published rows using
 * the public API key. No secrets. Existing V7 showcase stays until connection. */
(()=>{'use strict';
const cfg=window.BWA_SUPABASE_CONFIG||{};
const valid=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.url||'') && /^sb_publishable_|^eyJ/.test(cfg.publishableKey||'');
const targets={
 home:{mount:'#page-home',title:'OFFICIAL NEWS',kind:'news'},
 news:{mount:'#page-news',title:'PUBLISHED NEWS',kind:'news'},
 rankings:{mount:'#page-rankings',title:'OFFICIAL BWA RANKINGS',kind:'rankings'},
 calendar:{mount:'#page-calendar',title:'OFFICIAL TOUR CALENDAR',kind:'tournaments'},
 live:{mount:'#page-live',title:'MATCH CENTRE — PUBLISHED EVENTS',kind:'matches'}
};
const css=`
.bwa-data-block{margin:28px auto 34px;padding:23px;border:1px solid #303640;border-radius:18px;background:#151a22;color:#f6f8fa;max-width:1184px}
.bwa-data-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.bwa-data-heading strong{font:800 clamp(21px,3vw,29px)/1.05 'Barlow Condensed',Impact,sans-serif;letter-spacing:.3px}
.bwa-data-badge{font-size:10px;font-weight:800;letter-spacing:1px;color:#ff8087;text-transform:uppercase}
.bwa-data-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:12px}
.bwa-data-card{min-width:0;background:#1e242e;border:1px solid #303945;border-radius:13px;padding:15px;overflow:hidden}
.bwa-data-card h3{font:800 20px/1.08 'Barlow Condensed',Impact,sans-serif;margin:7px 0;color:#fff}
.bwa-data-card p{font-size:12px;color:#b4bdca;margin:8px 0 0;line-height:1.55}
.bwa-data-mini{font-size:10px;font-weight:800;color:#ff5964;letter-spacing:.8px;text-transform:uppercase}
.bwa-data-meta{font-size:11px;color:#a5afbd}
.bwa-data-empty{font-size:12px;color:#b4bdc8;line-height:1.7;padding:12px 0}
.bwa-data-row{display:flex;align-items:center;gap:12px;margin:8px 0;padding:11px;border-radius:12px;background:#1e242e;min-width:0}
.bwa-data-rank{min-width:34px;font:900 25px/1 'Barlow Condensed',Impact,sans-serif;color:#f14650}
.bwa-data-name{flex:1;min-width:0;overflow-wrap:anywhere;font-weight:700;font-size:13px}
.bwa-data-name small{display:block;color:#99a6b6;font-size:10px;font-weight:500;margin-top:3px}
.bwa-data-points{white-space:nowrap;font-size:12px;font-weight:800}
.bwa-data-flag{width:27px;height:19px;object-fit:cover;border:1px solid #536070;border-radius:3px;flex:none}
.bwa-data-fallback{font-size:11px;color:#b5bac4}
@media(max-width:700px){.bwa-data-block{margin:18px 14px 24px;padding:15px;border-radius:14px}.bwa-data-grid{grid-template-columns:1fr}.bwa-data-card{padding:12px}}
`;
const style=document.createElement('style');style.textContent=css;document.head.append(style);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n}
function makeCard(label,title,detail,extra){const c=el('article','bwa-data-card');c.append(el('div','bwa-data-mini',label),el('h3','',title));if(detail)c.append(el('p','',detail));if(extra)c.append(el('div','bwa-data-meta',extra));return c}
function flag(n){const codes={THA:'th',MAS:'my',CHN:'cn',DEN:'dk',IND:'in',INA:'id',JPN:'jp',KOR:'kr',FRA:'fr',SGP:'sg',TPE:'tw',ESP:'es',ENG:'gb'};const code=codes[String(n||'').toUpperCase()];if(!code)return el('span','bwa-data-fallback',n||'—');const img=el('img','bwa-data-flag');img.src='https://flagcdn.com/'+code+'.svg';img.alt='Flag of '+n;img.loading='lazy';return img}
let client=null;
async function initClient(){if(!valid||!window.supabase){if(!valid)return null;await new Promise((res,rej)=>{const x=document.createElement('script');x.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';x.onload=res;x.onerror=()=>rej(new Error('Supabase library unavailable'));document.head.append(x)})}return window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{'x-client-info':'bwa-public-v9'}}})}
async function read(table,order){const query=client.from(table).select('*').limit(40);const {data,error}=order?await query.order(order,{ascending:true}):await query.order('created_at',{ascending:false});if(error)throw error;return data||[]}
const cache={};let busy=false;
async function update(){if(!valid||busy)return;busy=true;try{
 const results=await Promise.allSettled([
 read('bwa_news'),read('bwa_tournaments','start_date'),read('bwa_rankings','position'),read('bwa_matches')
 ]);
 ['news','tournaments','rankings','matches'].forEach((k,i)=>{cache[k]=results[i].status==='fulfilled'?results[i].value:null});
 Object.entries(targets).forEach(([page,def])=>paint(page,def));
 }finally{busy=false}}
function paint(page,def){const mount=document.querySelector(def.mount);if(!mount)return;let box=mount.querySelector('[data-bwa-public]');if(!box){box=el('div','bwa-data-block');box.dataset.bwaPublic='true';const inner=mount.querySelector('.container');(inner||mount).prepend(box)}box.replaceChildren();const head=el('div','bwa-data-heading');head.append(el('strong','',def.title),el('span','bwa-data-badge','CONNECTED DATA • RLS PROTECTED'));box.append(head);const data=cache[def.kind];if(data===null){box.append(el('div','bwa-data-empty','Cannot load database data. Check Supabase configuration, grants and RLS. Existing showcase content below is unaffected.'));return}if(!data?.length){box.append(el('div','bwa-data-empty','No published records yet. Staff can create records and set their status to Published.'));return}
 const grid=el('div',def.kind==='rankings'?'':'bwa-data-grid');box.append(grid);
 if(def.kind==='news'){data.filter(x=>x.status==='published').slice(0,page==='home'?3:20).forEach(x=>grid.append(makeCard(x.category||'BWA NEWS',x.title,x.summary,x.published_at||'')))}
 if(def.kind==='tournaments'){data.filter(x=>['published','completed'].includes(x.status)).forEach(x=>grid.append(makeCard(x.level||'TOURNAMENT',x.name, [x.location,x.start_date,x.end_date].filter(Boolean).join(' · '),x.status.toUpperCase())))}
 if(def.kind==='matches'){data.slice(0,24).forEach(x=>grid.append(makeCard((x.round||'MATCH')+' · '+(x.status||'').toUpperCase(),(x.player_a||'TBA')+' vs '+(x.player_b||'TBA'),[x.tournament_name,x.court,x.score].filter(Boolean).join(' · '))))}
 if(def.kind==='rankings'){data.filter(x=>x.visibility==='published').slice(0,30).forEach(x=>{const r=el('div','bwa-data-row');r.append(el('div','bwa-data-rank',x.position??'—'),flag(x.nation));const nm=el('div','bwa-data-name',x.player_name);nm.append(el('small','',`${x.category||'MS'} · ${x.nation||'—'} · ${x.change>0?'▲ '+x.change:x.change<0?'▼ '+Math.abs(x.change):'—'}`));r.append(nm,el('div','bwa-data-points',Number(x.points||0).toLocaleString()+' PTS'));grid.append(r)})}
}
async function start(){if(!valid)return;try{client=await initClient();await update()}catch(e){console.warn('BWA public integration:',e.message)}}
window.addEventListener('bwa:navigate',()=>{if(client)update()});
window.addEventListener('bwa:public-refresh',()=>{if(client)update()});
window.BWA_PUBLIC_REFRESH=()=>{if(client)update()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
