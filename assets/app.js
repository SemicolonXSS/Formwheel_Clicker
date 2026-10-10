(()=>{
"use strict";
const SCALE=10n,SAVE_KEY="formwheel_clicker_save_v3",OLD_KEY="formwheel_clicker_save_v2";
const P=["0.1","0.5","1","2","3","5","10","15","30","50","100","200","300","500","1000","2500","5000","10000","25000","50000","100000","250000","500000","1000000","2500000","5000000","10000000","25000000","50000000","100000000","1000000000","10000000000","25000000000","50000000000","100000000000","250000000000","500000000000","1000000000000","2500000000000","5000000000000","10000000000000","25000000000000","50000000000000","100000000000000","250000000000000","500000000000000","1000000000000000","2500000000000000","5000000000000000","10000000000000000","25000000000000000","50000000000000000","100000000000000000","250000000000000000","500000000000000000","1000000000000000000","2500000000000000000","5000000000000000000","10000000000000000000","25000000000000000000","50000000000000000000","100000000000000000000","250000000000000000000","500000000000000000000","1000000000000000000000","10000000000000000000000","100000000000000000000000","1000000000000000000000000","10000000000000000000000000","100000000000000000000000000","1000000000000000000000000000","10000000000000000000000000000","100000000000000000000000000000","1000000000000000000000000000000","10000000000000000000000000000000","100000000000000000000000000000000","1000000000000000000000000000000000","10000000000000000000000000000000000","100000000000000000000000000000000000","1000000000000000000000000000000000000","10000000000000000000000000000000000000","100000000000000000000000000000000000000","1000000000000000000000000000000000000000","10000000000000000000000000000000000000000","100000000000000000000000000000000000000000","1000000000000000000000000000000000000000000","10000000000000000000000000000000000000000000"].map(toScaled);
const A=["0","0.1","0.5","1","2","3","5","10","15","20","50","100","250","500","1000","2500","5000","10000","25000","50000","100000","250000","500000","1000000","2500000","5000000","10000000","25000000","50000000","100000000","1000000000","10000000000","100000000000","1000000000000","10000000000000","100000000000000","1000000000000000","10000000000000000","100000000000000000","1000000000000000000","10000000000000000000","100000000000000000000","1000000000000000000000","10000000000000000000000","100000000000000000000000","1000000000000000000000000","10000000000000000000000000","100000000000000000000000000","1000000000000000000000000000","10000000000000000000000000000","100000000000000000000000000000","1000000000000000000000000000000","10000000000000000000000000000000","100000000000000000000000000000000","1000000000000000000000000000000000","10000000000000000000000000000000000","100000000000000000000000000000000000","1000000000000000000000000000000000000","10000000000000000000000000000000000000","100000000000000000000000000000000000000","1000000000000000000000000000000000000000","10000000000000000000000000000000000000000"].map(toScaled);
const PRESTIGE_REQ=toScaled("1000000");
const ACH=[
["first","첫 클릭","한 번 클릭하기",g=>g.totalClicks>=1],
["hundred","손가락 워밍업","100번 클릭하기",g=>g.totalClicks>=100],
["thousand","천점 돌파","최고 점수 1,000점 달성",g=>g.highScore>=toScaled("1000")],
["auto","자동화 시작","자동 클릭 1 이상 달성",g=>g.auto>=toScaled("1")],
["power","파워 유저","클릭 파워 100 이상 달성",g=>g.power>=toScaled("100")],
["prestige","새로운 시작","Prestige 1회 달성",g=>g.prestige>=1]
,
["click10","클릭 견습생","10번 클릭하기",g=>g.totalClicks>=10],
["click500","손가락 단련","500번 클릭하기",g=>g.totalClicks>=500],
["click1000","클릭 장인","1,000번 클릭하기",g=>g.totalClicks>=1000],
["click10000","만 번의 노력","10,000번 클릭하기",g=>g.totalClicks>=10000],
["click100000","전설의 손가락","100,000번 클릭하기",g=>g.totalClicks>=100000],
["score10","첫 수익","최고 점수 10점 달성",g=>g.highScore>=toScaled('10')],
["score100","백점 돌파","최고 점수 100점 달성",g=>g.highScore>=toScaled('100')],
["score10000","만점의 기쁨","최고 점수 10,000점 달성",g=>g.highScore>=toScaled('10000')],
["score100000","십만장자","최고 점수 100,000점 달성",g=>g.highScore>=toScaled('100000')],
["scoreMillion","백만장자","최고 점수 1,000,000점 달성",g=>g.highScore>=toScaled('1000000')],
["scoreBillion","십억장자","최고 점수 1,000,000,000점 달성",g=>g.highScore>=toScaled('1000000000')],
["lifetime10000","차곡차곡","누적 획득 10,000점 달성",g=>g.lifetime>=toScaled('10000')],
["lifetimeMillion","누적의 힘","누적 획득 1,000,000점 달성",g=>g.lifetime>=toScaled('1000000')],
["lifetimeBillion","끝없는 수익","누적 획득 1,000,000,000점 달성",g=>g.lifetime>=toScaled('1000000000')],
["power1","제법 강한 클릭","클릭 파워 1 이상 달성",g=>g.power>=toScaled('1')],
["power10","클릭 강화","클릭 파워 10 이상 달성",g=>g.power>=toScaled('10')],
["power1000","강력한 손끝","클릭 파워 1,000 이상 달성",g=>g.power>=toScaled('1000')],
["powerMillion","초월한 클릭","클릭 파워 1,000,000 이상 달성",g=>g.power>=toScaled('1000000')],
["auto10","작은 공장","초당 자동 생산 10 이상 달성",g=>g.auto>=toScaled('10')],
["auto100","자동화 전문가","초당 자동 생산 100 이상 달성",g=>g.auto>=toScaled('100')],
["auto1000","클릭 공장장","초당 자동 생산 1,000 이상 달성",g=>g.auto>=toScaled('1000')],
["autoMillion","무한 생산 라인","초당 자동 생산 1,000,000 이상 달성",g=>g.auto>=toScaled('1000000')],
["upgrade1","첫 투자","업그레이드 1회 구매하기",g=>g.upgrades>=1],
["upgrade10","꾸준한 투자자","한 Prestige 주기에서 업그레이드 10회 구매",g=>g.upgrades>=10],
["upgrade30","업그레이드 수집가","한 Prestige 주기에서 업그레이드 30회 구매",g=>g.upgrades>=30],
["prestige3","새 출발 전문가","Prestige 3회 달성",g=>g.prestige>=3],
["prestige5","환생의 달인","Prestige 5회 달성",g=>g.prestige>=5],
["prestige10","열 번의 시작","Prestige 10회 달성",g=>g.prestige>=10],
["prestige25","불멸의 클릭러","Prestige 25회 달성",g=>g.prestige>=25]
];
const MISSION_PERIOD=60*60*1000;
const MISS=[
["m1","1시간 동안 클릭 100회","25점",g=>g.totalClicks-(g.missionBase?.clicks||0)>=100,toScaled("25")],
["m2","1시간 동안 업그레이드 3회","100점",g=>g.upgrades-(g.missionBase?.upgrades||0)>=3,toScaled("100")],
["m3","1시간 동안 1,000점 획득","250점",g=>g.lifetime-BigInt(g.missionBase?.lifetime||"0")>=toScaled("1000"),toScaled("250")],
["m4","1시간 동안 Prestige 1회","500점",g=>g.prestige-(g.missionBase?.prestige||0)>=1,toScaled("500")]
];
let g={score:0n,power:toScaled("0.1"),auto:0n,totalClicks:0,highScore:0n,lifetime:0n,upgrades:0,prestige:0,achievements:{},claimed:{},missionResetAt:Date.now()+MISSION_PERIOD,missionBase:{clicks:0,upgrades:0,lifetime:"0",prestige:0},lastSaved:Date.now(),lastBonus:0};

function toScaled(v){
 const s=String(v??"0").trim(); if(!s||s==="NaN") return 0n;
 if(/e/i.test(s)){ const n=Number(s); return BigInt(Math.round(n*10)); }
 const neg=s.startsWith("-"); const t=neg?s.slice(1):s; const [i="0",d=""]=t.split(".");
 const r=BigInt((i||"0").replace(/\D/g,"")||"0")*10n+BigInt((d[0]||"0").replace(/\D/g,"")||"0");
 return neg?-r:r;
}
function fromLegacy(v){ return toScaled(typeof v==="number" ? String(v) : (v??0)); }
function fmt(x){
 x=BigInt(x); const neg=x<0n;if(neg)x=-x; const i=x/10n,d=x%10n;
 const raw=i.toString(); const grouped=raw.replace(/\B(?=(\d{3})+(?!\d))/g,",");
 return (neg?"-":"")+grouped+(d? "."+d:"");
}
function compact(x){x=BigInt(x);const i=x/10n;if(i<1000000000000000n)return fmt(x);const s=i.toString();return s[0]+"."+s.slice(1,3)+"e"+(s.length-1);}
function gain(base){return BigInt(base)*BigInt(4+g.prestige)/4n;}
function price(base,index){let p=BigInt(base);for(let i=0;i<index;i++)p=(p*175n+99n)/100n;return p*SCALE;}
function normalizeLevel(value,arr){let v=BigInt(value);for(const n of arr)if(n>=v)return n;return arr[arr.length-1];}
function serialize(){return {version:3,score:g.score.toString(),power:g.power.toString(),auto:g.auto.toString(),totalClicks:g.totalClicks,highScore:g.highScore.toString(),lifetime:g.lifetime.toString(),upgrades:g.upgrades,prestige:g.prestige,achievements:g.achievements,claimed:g.claimed,missionResetAt:g.missionResetAt,missionBase:g.missionBase,lastSaved:Date.now(),lastBonus:g.lastBonus};}
function save(){try{g.lastSaved=Date.now();localStorage.setItem(SAVE_KEY,JSON.stringify(serialize()));}catch(e){console.warn("save",e)}}
function load(){
 try{
  let raw=localStorage.getItem(SAVE_KEY),data=raw?JSON.parse(raw):null;
  if(!data){
   const old=localStorage.getItem(OLD_KEY); if(old){const o=JSON.parse(old);data={score:fromLegacy(o.score).toString(),power:fromLegacy(o.power??0.1).toString(),auto:fromLegacy(o.auto).toString(),totalClicks:Number(o.totalClicks)||0,highScore:fromLegacy(o.highScore).toString(),lifetime:fromLegacy(o.highScore).toString(),upgrades:0,prestige:0,achievements:{},claimed:{},lastSaved:Date.now()};}
  }
  if(data){g={...g,...data,score:BigInt(data.score||0),power:normalizeLevel(BigInt(data.power||1),P),auto:normalizeLevel(BigInt(data.auto||0),A),highScore:BigInt(data.highScore||0),lifetime:BigInt(data.lifetime||data.highScore||0),totalClicks:Number(data.totalClicks)||0,upgrades:Number(data.upgrades)||0,prestige:Number(data.prestige)||0,achievements:data.achievements||{},claimed:data.claimed||{},missionResetAt:Number(data.missionResetAt)||Date.now()+MISSION_PERIOD,missionBase:data.missionBase||{clicks:Number(data.totalClicks)||0,upgrades:Number(data.upgrades)||0,lifetime:String(data.lifetime||data.highScore||0),prestige:Number(data.prestige)||0},lastSaved:Number(data.lastSaved)||Date.now(),lastBonus:Number(data.lastBonus)||0};}
  const elapsed=Math.min(28800,Math.max(0,Math.floor((Date.now()-g.lastSaved)/1000)));
  if(elapsed>0&&g.auto>0n){const offline=gain(g.auto)*BigInt(elapsed);g.score+=offline;g.lifetime+=offline;if(g.score>g.highScore)g.highScore=g.score;setTimeout(()=>flash("💤 오프라인 보너스 +"+compact(offline)),50);}
 }catch(e){console.warn("load",e)}
}
const $=id=>document.getElementById(id);
function powerIndex(){return P.indexOf(g.power)} function autoIndex(){return A.indexOf(g.auto)}
function next(arr,val){const i=arr.indexOf(val);return i>=0?(arr[i+1]??null):(arr.find(x=>x>val)??null)}
function resetMissions(now=Date.now()){
 g.claimed={};
 g.missionBase={clicks:g.totalClicks,upgrades:g.upgrades,lifetime:g.lifetime.toString(),prestige:g.prestige};
 g.missionResetAt=now+MISSION_PERIOD;
 flash("🎯 새로운 1시간 미션이 시작됐어요!");
}
function checkMissionReset(){
 const now=Date.now();
 if(!g.missionResetAt||now>=g.missionResetAt){
  const periods=Math.max(1,Math.floor((now-(g.missionResetAt||now))/MISSION_PERIOD)+1);
  resetMissions((g.missionResetAt||now)+(periods-1)*MISSION_PERIOD);
  save();
 }
 const left=Math.max(0,g.missionResetAt-now),m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);
 const timer=$("missionTimer"); if(timer)timer.textContent=`다음 초기화 ${m}:${String(s).padStart(2,"0")}`;
}
function updateAchievements(){for(const [id,,,test] of ACH)if(!g.achievements[id]&&test(g))g.achievements[id]=true;}
function renderAchievements(){
 $("achievements").innerHTML=`<div class="item-desc" style="margin-bottom:12px">달성 ${ACH.filter(([id])=>g.achievements[id]).length} / ${ACH.length}개 · Prestige 후에도 유지</div>`+ACH.map(([id,title,desc])=>`<div class="achievement ${g.achievements[id]?"done":""}"><div class="item-title">${g.achievements[id]?"✅":"⬜"} ${title}</div><div class="item-desc">${desc}</div></div>`).join("");
}
function renderMissions(){
 $("missions").innerHTML=MISS.map(([id,title,reward,test])=>{const ready=test(g),claimed=!!g.claimed[id];return `<div class="mission ${claimed?"done":""}"><div class="mission-row"><div><div class="item-title">${claimed?"✅":"🎯"} ${title}</div><div class="item-desc">보상 ${reward}</div></div><button class="claim" data-mission="${id}" ${!ready||claimed?"disabled":""}>${claimed?"완료":"받기"}</button></div></div>`;}).join("");
 document.querySelectorAll("[data-mission]").forEach(b=>b.onclick=()=>claimMission(b.dataset.mission));
}
function update(){
 checkMissionReset();
 updateAchievements();
 $("score").textContent=compact(g.score);$("power").textContent=fmt(g.power);$("auto").textContent=fmt(g.auto)+" /초";$("totalClicks").textContent=g.totalClicks.toLocaleString("ko-KR");$("highScore").textContent=compact(g.highScore);$("clickPowerText").textContent="+"+fmt(gain(g.power));$("multi").textContent="x"+(1+g.prestige*.25).toFixed(2);
 const np=next(P,g.power),na=next(A,g.auto),pi=Math.max(0,powerIndex()),ai=Math.max(0,autoIndex()),pp=price(10,pi),ap=price(50,ai);
 $("powerPrice").textContent=np===null?"MAX":fmt(pp);$("autoPrice").textContent=na===null?"MAX":fmt(ap);
 $("powerDesc").textContent=np===null?"최대 클릭 파워입니다.":`클릭 파워를 ${fmt(g.power)} → ${fmt(np)}로 증가`;
 $("autoDesc").textContent=na===null?"최대 자동 클릭입니다.":`자동 클릭을 ${fmt(g.auto)} → ${fmt(na)} /초로 증가`;
 $("powerUpgrade").disabled=np===null||g.score<pp;$("autoUpgrade").disabled=na===null||g.score<ap;$("prestigeButton").disabled=g.highScore<PRESTIGE_REQ;
 renderAchievements();renderMissions();
}
function addScore(v){const n=BigInt(v);g.score+=n;g.lifetime+=n;if(g.score>g.highScore)g.highScore=g.score;}
function flash(t){$("bonusText").textContent=t;clearTimeout(flash.t);flash.t=setTimeout(()=>$("bonusText").textContent="",2600);}
function maybeBonus(){if(Date.now()-g.lastBonus<10000||Math.random()>=.01)return;g.lastBonus=Date.now();const b=gain(g.power)*50n;addScore(b);flash("✨ 랜덤 보너스! +"+compact(b));}
$("clickButton").onclick=()=>{addScore(gain(g.power));g.totalClicks++;maybeBonus();update();save();};
$("powerUpgrade").onclick=()=>{const n=next(P,g.power),p=price(10,Math.max(0,powerIndex()));if(n===null||g.score<p)return;g.score-=p;g.power=n;g.upgrades++;update();save();};
$("autoUpgrade").onclick=()=>{collectAuto();const n=next(A,g.auto),p=price(50,Math.max(0,autoIndex()));if(n===null||g.score<p)return;g.score-=p;g.auto=n;g.upgrades++;update();save();};
function claimMission(id){const m=MISS.find(x=>x[0]===id);if(!m||g.claimed[id]||!m[3](g))return;g.claimed[id]=true;addScore(m[4]);flash("🎁 미션 보상 +"+fmt(m[4]));update();save();}
$("prestigeButton").onclick=()=>{collectAuto();if(g.highScore<PRESTIGE_REQ)return;if(!confirm("현재 점수와 업그레이드를 초기화하고 Prestige할까요?"))return;g.prestige++;g.score=0n;g.power=P[0];g.auto=A[0];g.upgrades=0;flash("✨ Prestige "+g.prestige+"회!");update();save();};
let lastAutoAt=Date.now(),autoRemainder=0n;
function collectAuto(at=Date.now()){
 const elapsed=Math.min(28800000,Math.max(0,at-lastAutoAt));lastAutoAt=at;
 if(g.auto>0n&&elapsed>0){const scaled=gain(g.auto)*BigInt(Math.floor(elapsed))+autoRemainder;autoRemainder=scaled%1000n;addScore(scaled/1000n);}else checkMissionReset();
}
setInterval(()=>{collectAuto();update();save();},1000);
setInterval(save,5000);addEventListener("beforeunload",save);addEventListener("visibilitychange",()=>{collectAuto();update();save();});
load();update();save();

window.ClickerOnline={
 getScore:()=>g.highScore.toString(),
 formatScaled:s=>compact(BigInt(s)),
 getNickname:()=>$("nickname").value.trim().slice(0,12),
 status:t=>$("status").textContent=t,
 rank:(t)=>{const e=$("myRank");e.style.display=t?"block":"none";e.textContent=t||"";},
 render:list=>{const el=$("leaderboardList");if(!list.length){el.innerHTML='<div class="empty">아직 등록된 점수가 없습니다.</div>';return;}el.innerHTML="";list.forEach((x,i)=>{const r=document.createElement("div");r.className="rank-row";const a=document.createElement("div");a.className="rank";a.textContent=i+1;const b=document.createElement("div");b.className="player";b.textContent=x.name||"Unknown";const c=document.createElement("div");c.className="points";c.textContent=compact(BigInt(x.score||0));r.append(a,b,c);el.appendChild(r);});},
 offline:msg=>{$("status").textContent=msg;$("leaderboardList").innerHTML='<div class="empty">오프라인 모드 · 게임은 정상 플레이할 수 있습니다.</div>';}
};
})();
