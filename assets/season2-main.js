(()=>{
"use strict";
const KEY="formwheel_clicker_season2_save_v1";
const TEN_HOURS=36_000_000;
const MAX_SCORE=10n**100n;
const $=id=>document.getElementById(id);
const $first=(...ids)=>ids.map($).find(Boolean);
const fmt=n=>{n=BigInt(n);if(n<1000000000000000n)return n.toLocaleString("ko-KR");const z=n.toString();return z[0]+(z.slice(1,3)!=="00"?"."+z.slice(1,3):"")+"e"+(z.length-1)};
const fallback={version:2,points:"0",earned:"0",best:"0",clicks:0,activeMs:0,clickLevel:0,autoLevel:0};
function load(){
 try{
  const value=JSON.parse(localStorage.getItem(KEY)||"null");
  if(!value||value.version!==2)return {...fallback};
  const result={...fallback};
  for(const key of ["points","earned","best"]){
   if(typeof value[key]==="string"&&/^\d{1,120}$/.test(value[key]))result[key]=value[key];
  }
  for(const key of ["clicks","activeMs","clickLevel","autoLevel"]){
   const n=Number(value[key]);
   if(Number.isSafeInteger(n)&&n>=0)result[key]=Math.min(n,key.endsWith("Level")?110:Number.MAX_SAFE_INTEGER);
  }
  return result;
 }catch(e){console.warn("Season 2 save could not be read; original save was not changed",e);return {...fallback}}
}
let game=load();
let points=BigInt(game.points),earned=BigInt(game.earned),best=BigInt(game.best);
const capped=()=>earned>=MAX_SCORE;
const exponent=()=>Math.min(100,4+Math.floor(96*Math.min(TEN_HOURS,game.activeMs)/TEN_HOURS));
const ceiling=()=>10n**BigInt(exponent());
// Nightmare difficulty: gains rise slowly, while costs grow increasingly steep.
// No existing season-2 save keys, levels, points, or historic records are rewritten.
// Season 2 NIGHTMARE+: the elapsed-time ceiling is NOT a reward curve.
// Advancement must be earned through slow income and sharply increasing prices.
// Existing saves are preserved; only future earnings and purchases use these rules.
const clickGain=()=>2n**BigInt(Math.floor(game.clickLevel/3));
const autoGain=()=>game.autoLevel?2n**BigInt(Math.floor((game.autoLevel-1)/4)):0n;
const upgradeCost=(level,kind)=>{
 const base=kind==="click"?2500n:250000n;
 const factor=kind==="click"?8n:20n;
 const fatigue=10n**BigInt(Math.floor(level*level/25));
 return base*factor**BigInt(level)*fatigue;
};
// Beyond very high total earnings, additional gains are progressively reduced.
// The minimum 1 point lets players progress without becoming mathematically stuck.
const softcapDivisor=()=>{
 const digits=earned===0n?1:earned.toString().length;
 return digits<=30?1n:10n**BigInt(Math.floor((digits-30)/4));
};
function grant(value){
 const allowance=ceiling()-earned;
 if(allowance<=0n)return 0n;
 const nerfed=value/softcapDivisor();
 const usable=value>0n&&nerfed===0n?1n:nerfed;
 const add=usable<allowance?usable:allowance;
 points+=add;earned+=add;if(points>best)best=points;
 return add;
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify({...game,points:points.toString(),earned:earned.toString(),best:best.toString()}))}
 catch(e){console.warn("Season 2 save failed",e)}
}
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
 $("powerUpgrade").disabled=game.clickLevel>=110||points<c;
 $("autoUpgrade").disabled=game.autoLevel>=110||points<a;
 const seconds=Math.floor(game.activeMs/1000),time=Math.floor(seconds/3600)+"시간 "+Math.floor(seconds%3600/60)+"분 "+seconds%60+"초";
 $("phaseLevel").textContent="10시간 챌린지 · "+time;
 $("phasePrice").textContent="1e"+exponent();
 $("phaseNote").textContent="현재 누적 획득: "+fmt(earned)+" · 시간별 상한: 1e"+exponent()+" · 목표 상한 1e100 (10시간)";
 $("phaseProgress").style.width=Math.min(100,100*game.activeMs/TEN_HOURS)+"%";
 $("clickButton").disabled=capped();
 if(capped())setMessage("🌌 시즌 2 최종 상한 1e100 도달! 기존 기록은 유지돼.");
}
function setMessage(t){$("bonusText").textContent=t}
function buy(kind){
 const k=kind==="click"?"clickLevel":"autoLevel";
 if(game[k]>=110){setMessage("최대 강화 레벨이야.");return;}
 const cost=upgradeCost(game[k],kind);
 if(points<cost){setMessage("점수가 부족해!");return;}
 points-=cost;
 game[k]++;
 setMessage((kind==="click"?"클릭 파워":"자동 클릭")+" 1레벨 강화!");
 render();save();
}
$("clickButton").addEventListener("click",()=>{
 if(capped())return;
 const before=earned;grant(clickGain());game.clicks++;
 if(before===earned)setMessage("현재 시간별 상한 도달! 플레이 시간이 늘면 상한도 늘어나.");
 else setMessage("");
 render();save();
});
$("powerUpgrade").addEventListener("click",()=>buy("click"));
$("autoUpgrade").addEventListener("click",()=>buy("auto"));
function tick(){
 const now=performance.now();
 const elapsed=Math.max(0,Math.min(2000,now-lastFrame));
 lastFrame=now;
 if(document.visibilityState!=="visible")return;
 game.activeMs=Math.min(TEN_HOURS,Math.floor(game.activeMs+elapsed));
 if(game.autoLevel>0&&!capped())grant(autoGain()*BigInt(Math.floor(elapsed))/1000n);
 elapsedSave+=elapsed;render();
 if(elapsedSave>=5000){elapsedSave=0;save()}
}
// Season 2 community leaderboard only reads the local game state.
// It cannot change the score, game save, upgrades, or legacy leaderboard.
window.ClickerSeason2={
 getBest:()=>best.toString(),
 getClicks:()=>String(game.clicks),
 getActiveMs:()=>Math.floor(game.activeMs),
 format:fmt
};
document.addEventListener("visibilitychange",()=>{lastFrame=performance.now();save()});
window.addEventListener("pagehide",save);
setInterval(tick,1000);
render();
})();