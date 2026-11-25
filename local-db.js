/* UrbanPulse local SQLite mode for GitHub Pages.
   sql.js runs SQLite in the browser; IndexedDB stores the SQLite database file per device. */
(() => {
  const DB_KEY = "urbanpulse-sqlite-v1";
  const DISTRICTS = {
    downtown:{ar:"وسط المدينة",en:"Downtown",x:50,y:50}, north:{ar:"حي الشمال",en:"North District",x:50,y:16},
    south:{ar:"حي الجنوب",en:"South District",x:50,y:84}, east:{ar:"حي الشرق",en:"East District",x:84,y:50},
    west:{ar:"حي الغرب",en:"West District",x:16,y:50}, university:{ar:"حي الجامعة",en:"University District",x:80,y:20},
    industrial:{ar:"المنطقة الصناعية",en:"Industrial Zone",x:20,y:82}
  };
  const RESOURCES = [
    ["maintenance","فرق الصيانة","Maintenance Teams",6],["garbage","مركبات جمع النفايات","Garbage Vehicles",5],
    ["water","فرق إصلاح المياه","Water Repair Teams",4],["electric","فرق الصيانة الكهربائية", "Electrical Teams",4],
    ["emergency","وحدات الطوارئ","Emergency Units",3]
  ];
  const TEAM={road:"maintenance",garbage:"garbage",water:"water",light:"electric",traffic:"maintenance",other:"maintenance"};
  const DUR={maintenance:4,garbage:2,water:3,electric:2,emergency:1.5};
  const CAT={
    road:["حفرة","حفر","اسفلت","تشقق","هبوط","انهيار","طريق","رصيف","pothole","road","asphalt","crack","sinkhole"],
    garbage:["نفايات","قمامة","زبالة","حاويات","مخلفات","رائحة","garbage","trash","waste","litter","bins","smell"],
    water:["تسرب","تسريب","مياه","ماء","انبوب","فيضان","مجاري","انفجار","leak","water","pipe","flood","burst","sewage"],
    light:["انارة","مصباح","عمود","اعمدة","مظلم","ظلام","كهرباء","انقطاع","streetlight","lamp","dark","power","outage","cable"],
    traffic:["حادث","تصادم","ازدحام","زحام","اشارة","مرور","traffic","accident","crash","collision","signal","congestion"]
  };
  const SAFETY=["خطر","مصابين","اصابه","حريق","صعق","مكشوف","انهيار","فيضان","طفل","اطفال","مدرسه","مستشفي","مشاه","danger","injur","fire","electrocut","exposed","collapse","child","school","hospital"];
  const URGENT=["فورا","عاجل","طارئ","حالا","urgent","immediately","emergency","asap"];
  const DAMAGE=["انفجار","انهيار","تضرر","تلف","هبوط","فيضان","burst","collapse","damage","flood"];
  const ACTIONS={
    road:{ar:"إرسال فريق صيانة لتسييج الموقع وإصلاح الحفرة/الأضرار",en:"Dispatch maintenance to cordon off and repair the road damage"},
    garbage:{ar:"جدولة مركبة جمع نفايات وتنظيف الموقع",en:"Schedule a garbage vehicle and clean the site"},
    water:{ar:"عزل خط المياه وإرسال فريق إصلاح التسرب",en:"Isolate the water line and send a leak-repair crew"},
    light:{ar:"إرسال فريق كهرباء لفحص الأعمدة وإعادة الإنارة",en:"Send an electrical crew to inspect and restore lighting"},
    traffic:{ar:"تأمين الموقع وتنظيم حركة المرور وإرسال الفريق المناسب",en:"Secure the site, manage traffic and send the right crew"},
    other:{ar:"مراجعة البلاغ ميدانياً وتحديد الجهة المختصة",en:"Inspect on site and route to the responsible department"}
  };
  let db, SQL;
  const idbOpen=()=>new Promise((resolve,reject)=>{
    const q=indexedDB.open("UrbanPulseLocalStore",1);
    q.onupgradeneeded=()=>q.result.createObjectStore("files");
    q.onsuccess=()=>resolve(q.result); q.onerror=()=>reject(q.error);
  });
  async function idbGet(){
    const x=await idbOpen(); return new Promise((resolve,reject)=>{
      const q=x.transaction("files","readonly").objectStore("files").get(DB_KEY);
      q.onsuccess=()=>resolve(q.result||null); q.onerror=()=>reject(q.error);
    });
  }
  async function idbSet(value){
    const x=await idbOpen(); return new Promise((resolve,reject)=>{
      const q=x.transaction("files","readwrite").objectStore("files").put(value,DB_KEY);
      q.onsuccess=()=>resolve(); q.onerror=()=>reject(q.error);
    });
  }
  const save=()=>{ try { idbSet(db.export()); } catch(e){ console.warn("SQLite save failed",e); } };
  const rows=(sql,params=[])=>{
    const st=db.prepare(sql,params), out=[]; while(st.step()) out.push(st.getAsObject()); st.free(); return out;
  };
  const one=(sql,params=[])=>rows(sql,params)[0]||null;
  const run=(sql,params=[])=>{ db.run(sql,params); save(); };
  const all=()=>rows("SELECT * FROM reports ORDER BY id").map(r=>({...r,analysis:r.analysis?JSON.parse(r.analysis):{}}));
  const norm=s=>(s||"").toLowerCase().replace(/[\u064B-\u0652\u0640]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه");
  function location(district,street){
    const d=DISTRICTS[district]||DISTRICTS.downtown;
    let seed=0; for(const c of norm(street)||district) seed=(seed*31+c.charCodeAt(0))|0;
    const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    return [Math.round(Math.max(3,Math.min(97,d.x+(rand()*16-8)))*10)/10,
            Math.round(Math.max(3,Math.min(97,d.y+(rand()*16-8)))*10)/10];
  }
  function tokens(s){return new Set(norm(s).match(/[a-z0-9_\u0600-\u06ff]+/g)||[]);}
  function analyze(p,exclude=null){
    const text=norm(p.title+" "+p.description), scores={};
    for(const [c,ks] of Object.entries(CAT)) scores[c]=ks.reduce((n,k)=>n+(text.includes(norm(k))?({"حفرة":3,"نفايات":3,"تسرب":3,"حادث":3}[k]||2):0),0);
    const detected=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][1]>0?Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0]:"other";
    const cat=TEAM[p.category]?p.category:detected, sev=Number(p.severity)||3, people=Number(p.people)||0;
    const sh=SAFETY.filter(k=>text.includes(norm(k))), uh=URGENT.filter(k=>text.includes(norm(k))), dh=DAMAGE.filter(k=>text.includes(norm(k)));
    const risk={road:35,garbage:12,water:28,light:30,traffic:45,other:15};
    const impact={road:55,garbage:45,water:60,light:50,traffic:65,other:30};
    const f={safety:Math.min(100,risk[cat]+sh.length*15+(sev-1)*8),people:Math.min(100,33*Math.log10(people+1)),
      damage:Math.min(100,sev*14+15*dh.length),urgency:Math.min(100,sev*12+25*uh.length+(["water","traffic"].includes(cat)?20:0))};
    f.impact=Math.min(100,impact[cat]*.6+f.people*.4); Object.keys(f).forEach(k=>f[k]=Math.round(f[k]));
    const base=f.safety*.30+f.people*.20+f.damage*.20+f.urgency*.15+f.impact*.15;
    const [x,y]=location(p.district,p.street);
    const existing=all().filter(r=>r.id!==exclude&&r.category===cat&&r.status!=="resolved");
    let dup=null, tk=tokens(p.title+" "+p.description);
    for(const r of existing){
      const d=Math.hypot(r.x-x,r.y-y); if(d>12)continue;
      const rt=tokens(r.title+" "+r.description), union=new Set([...tk,...rt]);
      let score=[...tk].filter(v=>rt.has(v)).length/Math.max(1,union.size);
      if(p.street&&norm(p.street)===norm(r.street))score+=.3; if(d<5)score+=.15;
      if(score>=.3&&(!dup||score>dup.score))dup={id:r.id,title:r.title,score:+score.toFixed(2),distance:+d.toFixed(1)};
    }
    const priority=Math.max(0,Math.min(100,Math.round(base+(dup?6:0))));
    const level=priority>=75?"critical":priority>=55?"high":priority>=35?"medium":"low";
    const team=cat==="traffic"&&["حادث","تصادم","مصابين","accident","crash","collision","injur"].some(k=>text.includes(norm(k)))?"emergency":TEAM[cat];
    return {category:cat,priority,level,team,urgency_h:{critical:1,high:4,medium:24,low:72}[level],x,y,duplicate_of:dup?.id??null,
      analysis:{engine:"local-rules-v1 (simulated, no live AI model)",detected,chosen:cat,scores,hits:{},factors:f,weights:{safety:.3,people:.2,damage:.2,urgency:.15,impact:.15},
        signals:{safety:sh,urgency:uh,damage:dh},bonus:dup?6:0,base:Math.round(base),dup,action:ACTIONS[cat]}};
  }
  function clean(p,old={}){
    const v={...old,...p}; const title=(v.title||"").trim(),description=(v.description||"").trim();
    if(title.length<3)throw Error("العنوان قصير جداً (3 أحرف على الأقل)");
    if(description.length<10)throw Error("الوصف قصير جداً (10 أحرف على الأقل)");
    if(!DISTRICTS[v.district])throw Error("اختر الحي من القائمة");
    const severity=Number(v.severity??3),people=Number(v.people??0);
    if(!Number.isInteger(severity)||severity<1||severity>5||!Number.isInteger(people)||people<0)throw Error("الشدة بين 1 و5 وعدد المتأثرين لا يقل عن 0");
    return {title:title.slice(0,120),description:description.slice(0,1500),district:v.district,street:(v.street||"").trim().slice(0,80),severity,people,category:v.category||null};
  }
  function insert(p,a){
    db.run(`INSERT INTO reports(title,description,category,district,street,x,y,severity,people,created_at,status,priority,level,team,urgency_h,analysis,duplicate_of,assigned_team,resolved_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[p.title,p.description,a.category,p.district,p.street,a.x,a.y,p.severity,p.people,new Date().toISOString().slice(0,19),"new",a.priority,a.level,a.team,a.urgency_h,JSON.stringify(a.analysis),a.duplicate_of,null,null]);
    const id=one("SELECT last_insert_rowid() id").id; save(); return one("SELECT * FROM reports WHERE id=?",[id]);
  }
  function pending(reps){return reps.filter(r=>["new","review"].includes(r.status)&&!r.duplicate_of);}
  function capsBusy(){
    const caps={}; RESOURCES.forEach(r=>caps[r[0]]=r[3]); const busy={}; Object.keys(caps).forEach(k=>busy[k]=0);
    rows("SELECT assigned_team,COUNT(*) c FROM reports WHERE status='progress' AND assigned_team IS NOT NULL GROUP BY assigned_team").forEach(r=>busy[r.assigned_team]=r.c);
    return {caps,busy};
  }
  function schedule(items,caps,busy){
    const free={}; for(const [t,c] of Object.entries(caps))free[t]=Array.from({length:c},(_,i)=>i<Math.min(busy[t]||0,c)?DUR[t]/2:0);
    const out={}; [...items].sort((a,b)=>b.priority-a.priority).forEach(it=>{
      const opts=[it.team,...(it.level==="critical"&&it.team!=="emergency"?["emergency"]:[])]; let best=null;
      opts.forEach(t=>{if(free[t]?.length){const s=Math.min(...free[t]),key=s+(t===it.team?0:1);if(!best||key<best.key)best={t,s,key};}});
      if(!best){out[it.id]={team:it.team,start:null,fallback:false};return;}
      const ix=free[best.t].indexOf(best.s);free[best.t][ix]+=DUR[best.t];out[it.id]={team:best.t,start:best.s,fallback:best.t!==it.team};
    }); return out;
  }
  function metrics(items,sch,caps,busy){
    const eta=items.map(i=>sch[i.id].start===null?24:sch[i.id].start+.5),crit=items.map((i,n)=>i.level==="critical"?eta[n]:null).filter(v=>v!==null),util={};
    for(const [t,c] of Object.entries(caps)){const now=items.filter(i=>sch[i.id].team===t&&sch[i.id].start===0).length;util[t]={util:c?Math.round(100*Math.min(c,(busy[t]||0)+now)/c):100,total:c,demand:items.filter(i=>i.team===t).length};}
    return {pending:items.length,critical:items.filter(i=>i.level==="critical").length,avg_priority:items.length?Math.round(items.reduce((s,i)=>s+i.priority,0)/items.length):0,
      avg_eta:eta.length?+(eta.reduce((a,b)=>a+b,0)/eta.length).toFixed(1):0,crit_eta:crit.length?+(crit.reduce((a,b)=>a+b,0)/crit.length).toFixed(1):0,
      max_eta:eta.length?Math.max(...eta):0,waiting:items.filter(i=>sch[i.id].start!==0).length,util};
  }
  function stats(){
    const reps=all(),opn=reps.filter(r=>r.status!=="resolved"),resolved=reps.filter(r=>r.resolved_at),hrs=resolved.map(r=>(new Date(r.resolved_at)-new Date(r.created_at))/36e5);
    const {caps,busy}=capsBusy(),items=pending(reps),m=metrics(items,schedule(items,caps,busy),caps,busy),dist={};
    Object.keys(DISTRICTS).forEach(k=>dist[k]={count:0,max:0});
    opn.forEach(r=>{dist[r.district].count++;dist[r.district].max=Math.max(dist[r.district].max,r.priority);});
    const count=(key,vals,src=reps)=>Object.fromEntries(vals.map(v=>[v,src.filter(r=>r[key]===v).length]));
    return {total:reps.length,pending:reps.filter(r=>["new","review"].includes(r.status)).length,progress:reps.filter(r=>r.status==="progress").length,
      resolved:reps.filter(r=>r.status==="resolved").length,critical:opn.filter(r=>r.level==="critical").length,
      avg_response:hrs.length?+(hrs.reduce((a,b)=>a+b,0)/hrs.length).toFixed(1):null,est_eta:m.avg_eta,
      health:Math.round(Math.max(0,100-(opn.reduce((a,r)=>a+r.priority,0)/(opn.length||1))*.7-4*opn.filter(r=>r.level==="critical").length)),
      districts:dist,by_status:count("status",["new","review","progress","resolved"]),by_category:count("category",Object.keys(TEAM)),
      by_level:count("level",["critical","high","medium","low"],opn),duplicates:opn.filter(r=>r.duplicate_of).length};
  }
  function resources(){
    const reps=all(),{caps,busy}=capsBusy();
    return RESOURCES.map(([type,ar,en,total])=>{const jobs=reps.filter(r=>r.status==="progress"&&r.assigned_team===type).map(r=>({id:r.id,title:r.title,level:r.level}));
      return {type,ar,en,total,busy:Math.min(busy[type]||0,total),available:Math.max(0,total-(busy[type]||0)),util:Math.round(100*Math.min(busy[type]||0,total)/total),jobs};});
  }
  async function init(){
    if(!window.initSqlJs)throw Error("تعذر تحميل محرك SQLite. تحقق من اتصال الإنترنت عند أول تشغيل.");
    SQL=await initSqlJs({locateFile:f=>"https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/"+f});
    const stored=await idbGet();
    if(stored) db=new SQL.Database(new Uint8Array(stored));
    else {const res=await fetch("./urbanpulse.db"); if(!res.ok)throw Error("ملف قاعدة البيانات urbanpulse.db غير موجود");db=new SQL.Database(new Uint8Array(await res.arrayBuffer()));save();}
  }
  async function localApi(path,method="GET",body){
    if(!db)await init();
    const u=new URL(path,location.href),p=u.pathname.replace(/^.*\/api/,""),m=method.toUpperCase();
    if(p==="/meta")return {districts:DISTRICTS,teams:RESOURCES.map(r=>({type:r[0],ar:r[1],en:r[2]}))};
    if(p==="/analyze"&&m==="POST"){const v=clean(body||{});return analyze(v);}
    if(p==="/reports"&&m==="GET"){
      let rs=all(); for(const k of ["category","level","status"])if(u.searchParams.get(k))rs=rs.filter(r=>r[k]===u.searchParams.get(k));
      const q=norm(u.searchParams.get("q")||"");if(q)rs=rs.filter(r=>norm(r.title+r.description+r.street).includes(q)||q===String(r.id));
      return rs.sort((a,b)=>b.priority-a.priority);
    }
    if(p==="/reports"&&m==="POST"){const v=clean(body||{}),a=analyze(v);return {...insert(v,a),analysis:a.analysis};}
    if(p.startsWith("/reports/")){
      const id=Number(p.split("/").pop()),r=one("SELECT * FROM reports WHERE id=?",[id]);if(!r)throw Error("البلاغ غير موجود");
      if(m==="GET")return {...r,analysis:r.analysis?JSON.parse(r.analysis):{}};
      if(m==="DELETE"){run("DELETE FROM reports WHERE id=?",[id]);run("UPDATE reports SET duplicate_of=NULL WHERE duplicate_of=?",[id]);return {ok:true};}
      if(m==="PUT"){
        const old={...r,analysis:r.analysis?JSON.parse(r.analysis):{}},v=clean(body||{},old),a=analyze(v,id),status=body.status||r.status;
        if(!["new","review","progress","resolved"].includes(status))throw Error("حالة غير صالحة");
        const team=body.assigned_team||((status==="progress")?a.team:r.assigned_team),resolved=status==="resolved"?(r.resolved_at||new Date().toISOString().slice(0,19)):null;
        run(`UPDATE reports SET title=?,description=?,category=?,district=?,street=?,x=?,y=?,severity=?,people=?,priority=?,level=?,team=?,urgency_h=?,analysis=?,duplicate_of=?,status=?,assigned_team=?,resolved_at=? WHERE id=?`,
          [v.title,v.description,a.category,v.district,v.street,a.x,a.y,v.severity,v.people,a.priority,a.level,a.team,a.urgency_h,JSON.stringify(a.analysis),a.duplicate_of,status,team,resolved,id]);
        return {...one("SELECT * FROM reports WHERE id=?",[id]),analysis:a.analysis};
      }
    }
    if(p==="/resources")return resources();
    if(p==="/stats")return stats();
    if(p==="/allocate"&&m==="POST"){
      const commit=!!(body||{}).commit,reps=all(),items=pending(reps),{caps,busy}=capsBusy(),sch=schedule(items,caps,busy),plan=[];
      [...items].sort((a,b)=>b.priority-a.priority).forEach(i=>{const s=sch[i.id],now=s.start===0;plan.push({id:i.id,title:i.title,priority:i.priority,level:i.level,recommended:i.team,team:s.team,fallback:s.fallback,start:s.start,assigned:now&&commit});if(commit&&now)db.run("UPDATE reports SET status='progress',assigned_team=? WHERE id=?",[s.team,i.id]);});
      if(commit)save();return {plan,committed:commit,merged:reps.filter(r=>r.duplicate_of&&r.status!=="resolved").map(r=>({id:r.id,title:r.title,of:r.duplicate_of})),metrics:metrics(items,sch,caps,busy)};
    }
    if(p==="/reset"&&m==="POST"){
      const res=await fetch("./urbanpulse.db");if(!res.ok)throw Error("تعذر استعادة قاعدة البيانات الأصلية");
      db.close();db=new SQL.Database(new Uint8Array(await res.arrayBuffer()));save();return {ok:true};
    }
    if(p==="/simulate"&&m==="POST"){
      const scenario=body.scenario,configs={water:{n:12,cat:"water",caps:1},accidents:{n:8,cat:"traffic",caps:1},blackout:{n:14,cat:"light",caps:1},garbage:{n:10,cat:"garbage",caps:1},limited:{n:6,cat:"mixed",caps:.4}};
      const cfg=configs[scenario];if(!cfg)throw Error("سيناريو غير معروف");
      const reps=all(),{caps,busy}=capsBusy(),items=pending(reps),before=metrics(items,schedule(items,caps,busy),caps,busy);
      const templates={water:[["انفجار أنبوب مياه","انفجار في أنبوب المياه وفيضان في الشارع وانقطاع المياه عن الحي"],["تسرب مياه كبير","تسرب مياه غزير يغمر الرصيف ويهدد المنازل، عاجل"]],
        traffic:[["حادث تصادم متعدد","تصادم عدة مركبات مع وجود مصابين واغلاق الطريق، عاجل"]],light:[["انقطاع الكهرباء عن الحي","انقطاع التيار الكهربائي وظلام تام في الشارع واشارات المرور معطلة"]],
        garbage:[["تراكم نفايات كبير","نفايات متراكمة وحاويات ممتلئة ورائحة كريهة منذ ايام"]],road:[["حفرة عميقة","حفرة عميقة في الطريق تسبب تضرر السيارات"]]};
      const cats=cfg.cat==="mixed"?["road","garbage","water","light","traffic"]:[cfg.cat],added=[];
      for(let i=0;i<cfg.n;i++){const c=cats[i%cats.length],t=(templates[c]||templates.road)[i%(templates[c]||templates.road).length],district=Object.keys(DISTRICTS)[i%7],v={title:t[0],description:t[1],district,street:`${i+1}-${district}`,severity:3+i%3,people:30+i*37,category:null};added.push([v,analyze(v)]);}
      const ac={};Object.keys(caps).forEach(t=>ac[t]=Math.max(1,Math.round(caps[t]*cfg.caps)));const ab={};Object.keys(ac).forEach(t=>ab[t]=Math.min(busy[t]||0,ac[t]));
      const sim=items.concat(added.map((x,i)=>({id:-(i+1),title:x[0].title,priority:x[1].priority,level:x[1].level,team:x[1].team}))),sch=schedule(sim,ac,ab),after=metrics(sim,sch,ac,ab);
      const decisions=[...sim].sort((a,b)=>b.priority-a.priority).slice(0,6).map(it=>{const z=sch[it.id];return {title:it.title,priority:it.priority,level:it.level,team:z.team,start:z.start,fallback:z.fallback,type:z.start!==0?"queued":z.fallback?"fallback":"assign"};});
      if(body.apply){added.forEach(([v,a])=>insert(v,a));}
      return {scenario,added:added.length,before,after,decisions,overload:Object.keys(after.util).filter(t=>after.util[t].demand>after.util[t].total),caps_factor:cfg.caps,applied:!!body.apply};
    }
    throw Error("طلب غير مدعوم: "+p);
  }
  window.localApi=localApi;
})();
