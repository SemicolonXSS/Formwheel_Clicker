(()=>{
"use strict";
const KEY="formwheel_clicker_season2_save_v1";
const $=id=>document.getElementById(id);
const $first=(...ids)=>ids.map($).find(Boolean);
const fmt=n=>{n=BigInt(n);if(n<1000000000000000n)return n.toLocaleString("ko-KR");const z=n.toString();return z[0]+(z.slice(1,3)!=="00"?"."+z.slice(1,3):"")+"e"+(z.length-1)};
const fallback={version:2,points:"0",earned:"0",best:"0",clicks:0,activeMs:0,clickLevel:0,autoLevel:0,lastGrowthAt:0};
function load(){
 try{
  const value=JSON.parse(localStorage.getItem(KEY)||"null");
  if(!value||value.version!==2)return {...fallback};
  const result={...fallback};
  for(const key of ["points","earned","best"]){
   if(typeof value[key]==="string"&&/^\d{1,10000}$/.test(value[key]))result[key]=value[key];
  }
  for(const key of ["clicks","activeMs","clickLevel","autoLevel","lastGrowthAt"]){
   const n=Number(value[key]);
   if(Number.isSafeInteger(n)&&n>=0)result[key]=n;
  }
  return result;
 }catch(e){console.warn("Season 2 save could not be read; original save was not changed",e);return {...fallback}}
}
let game=load();
// Track elapsed time for display only, including while the page is closed.
// This no longer limits earnings. Legacy saves keep their original values.
function advanceGrowthClock(){
 const now=Date.now();
 if(!Number.isSafeInteger(now)||now<0)return;
 const previous=game.lastGrowthAt;
 if(previous>0&&now>previous){
  game.activeMs=Math.min(Number.MAX_SAFE_INTEGER,game.activeMs+Math.min(Number.MAX_SAFE_INTEGER-game.activeMs,now-previous));
 }
 game.lastGrowthAt=Math.max(previous,now);
}
advanceGrowthClock();
let points=BigInt(game.points),earned=BigInt(game.earned),best=BigInt(game.best);
// Balanced future upgrade costs; saved levels, scores and legacy records stay intact.
// Elapsed time is informational only; all earned points come from gameplay.
// Click power still doubles per level. The next click upgrade costs the
// equivalent of 100, 90, 80 ... minimum 40 clicks at the current power.
// Auto upgrades now start at 250 points and double in price per level.
// No migrations, refunds, or retroactive deductions are performed.
const clickGain=()=>2n**BigInt(game.clickLevel);
const autoGain=()=>game.autoLevel?2n**BigInt(Math.floor((game.autoLevel-1)/4)):0n;
const upgradeCost=(level,kind)=>{
 if(kind==="click")return BigInt(Math.max(40,100-10*level))*2n**BigInt(level);
 return 250n*2n**BigInt(level);
};
// Beyond very high total earnings, additional gains are progressively reduced.
// The minimum 1 point lets players progress without becoming mathematically stuck.
const softcapDivisor=()=>{
 const digits=earned===0n?1:earned.toString().length;
 return digits<=30?1n:10n**BigInt(Math.floor((digits-30)/4));
};
function grant(value){
 const nerfed=value/softcapDivisor();
 const add=value>0n&&nerfed===0n?1n:nerfed;
 points+=add;earned+=add;if(points>best)best=points;
 return add;
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify({...game,points:points.toString(),earned:earned.toString(),best:best.toString()}))}
 catch(e){console.warn("Season 2 save failed",e)}
}
// Session-only heuristic: never deletes points, achievements, or saved progress.
// This is advisory client-side detection, NOT proof of a human or server verification.
const antiCheat={times:[],intervals:[],suspicion:0,held:false,lastWarning:0};
function inspectClick(event){
 const now=performance.now();
 if(event.isTrusted===false){antiCheat.suspicion=Math.min(100,antiCheat.suspicion+50);return false;}
 if(document.visibilityState==="hidden"){antiCheat.suspicion=Math.min(100,antiCheat.suspicion+30);return false;}
 const recent=antiCheat.times;
 const previous=recent.length?recent[recent.length-1]:null;
 recent.push(now);
 while(recent.length&&recent[0]<now-4000)recent.shift();
 if(previous!==null){
  const interval=now-previous;
  antiCheat.intervals.push(interval);
  if(antiCheat.intervals.length>40)antiCheat.intervals.shift();
 }
 // Click rates alone are not evidence of automation; use multiple signals.
 if(recent.length>=120&&now-recent[0]<4000)antiCheat.suspicion+=8;
 if(antiCheat.intervals.length>=30){
  const samples=antiCheat.intervals.slice(-30);
  const mean=samples.reduce((a,b)=>a+b,0)/samples.length;
  const variance=samples.reduce((a,b)=>a+(b-mean)**2,0)/samples.length;
  if(mean>=20&&mean<=120&&Math.sqrt(variance)<1.5)antiCheat.suspicion+=3;
 }
 antiCheat.suspicion=Math.min(100,Math.max(0,antiCheat.suspicion-0.15));
 if(antiCheat.suspicion>=85)antiCheat.held=true;
 return true;
}
function antiCheatStatus(){return {review:antiCheat.held,level:antiCheat.suspicion>=60?"review":antiCheat.suspicion>=30?"watch":"normal"};}
let lastFrame=performance.now(),elapsedSave=0;
function render(){
 $("score").textContent=fmt(points);
 $("score").title=points.toString();
 $("totalClicks").textContent=game.clicks.toLocaleString("ko-KR");
 $("highScore").textContent=fmt(best);
 $("clickPowerText").textContent="+"+fmt(clickGain());
 $("power").textContent=fmt(clickGain());
 $("auto").textContent=fmt(autoGain())+" /초";
 $("multi").textContent="극악 난이도";
 const c=upgradeCost(game.clickLevel,"click"),a=upgradeCost(game.autoLevel,"auto");
 $("powerPrice").textContent=fmt(c);$("autoPrice").textContent=fmt(a);
 $("powerDesc").textContent="레벨 "+game.clickLevel+" · 클릭당 "+fmt(clickGain())+" 점";
 $("autoDesc").textContent="레벨 "+game.autoLevel+" · 초당 "+fmt(autoGain())+" 점";
 $("powerUpgrade").disabled=points<c;
 $("autoUpgrade").disabled=points<a;
 const seconds=Math.floor(game.activeMs/1000),time=Math.floor(seconds/3600)+"시간 "+Math.floor(seconds%3600/60)+"분 "+seconds%60+"초";
 $("phaseLevel").textContent=time;
 $("phasePrice").textContent=fmt(earned);
 $("phaseNote").textContent="플레이 중 획득한 누적 점수야. 시간이나 1e100으로 성장이 제한되지 않아.";
}
function setMessage(t){$("bonusText").textContent=t}
function buy(kind){
 const k=kind==="click"?"clickLevel":"autoLevel";
 const cost=upgradeCost(game[k],kind);
 if(points<cost){setMessage("점수가 부족해!");return;}
 points-=cost;
 game[k]++;
 setMessage((kind==="click"?"클릭 파워":"자동 클릭")+" 1레벨 강화!");
 render();save();
}
$("clickButton").addEventListener("click",(event)=>{
 if(!inspectClick(event)){setMessage("🛡️ 신뢰할 수 없는 입력은 점수에 반영하지 않았어요.");return;}
 if(antiCheat.held&&performance.now()-antiCheat.lastWarning>12000){antiCheat.lastWarning=performance.now();setMessage("🛡️ 입력 패턴 확인이 필요해요. 플레이 기록은 유지되지만 이번 세션의 순위 등록은 보류됩니다.");}
 grant(clickGain());game.clicks++;
 setMessage("");
 render();save();
});
$("powerUpgrade").addEventListener("click",()=>buy("click"));
$("autoUpgrade").addEventListener("click",()=>buy("auto"));
function tick(){
 const now=performance.now();
 const elapsed=Math.max(0,Math.min(2000,now-lastFrame));
 lastFrame=now;
 advanceGrowthClock();
 if(document.visibilityState==="visible"&&game.autoLevel>0){
  grant(autoGain()*BigInt(Math.floor(elapsed))/1000n);
 }
 elapsedSave+=elapsed;render();
 if(elapsedSave>=5000){elapsedSave=0;save()}
}
// Season 2 community leaderboard only reads the local game state.
// It cannot change the score, game save, upgrades, or legacy leaderboard.
window.ClickerSeason2={
 getBest:()=>best.toString(),
 getClicks:()=>String(game.clicks),
 getActiveMs:()=>Math.floor(game.activeMs),
 getAntiCheatStatus:antiCheatStatus,
 format:fmt
};
document.addEventListener("visibilitychange",()=>{advanceGrowthClock();lastFrame=performance.now();render();save()});
window.addEventListener("pagehide",()=>{advanceGrowthClock();save()});
setInterval(tick,1000);
render();
save();
})();