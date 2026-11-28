(()=>{
"use strict";
const KEY="formwheel_clicker_season2_save_v1";
const MAX_SAVED_LEVEL=Math.floor(10000*Math.log2(10));
let saveBlocked=false,recoveryRaw=null;
const $=id=>document.getElementById(id);
const $first=(...ids)=>ids.map($).find(Boolean);
const fmt=n=>{n=BigInt(n);if(n<1000000000000000n)return n.toLocaleString("ko-KR");const z=n.toString();return z[0]+(z.slice(1,3)!=="00"?"."+z.slice(1,3):"")+"e"+(z.length-1)};
const fallback={version:2,points:"0",earned:"0",best:"0",autoRemainder:"0",clicks:0,activeMs:0,clickLevel:0,autoLevel:0,lastGrowthAt:0};
function load(){
 let original;
 try{
  original=localStorage.getItem(KEY);
  if(original===null)return {...fallback};
  const value=JSON.parse(original);
  if(!value||typeof value!=="object"||Array.isArray(value)||value.version!==2)throw Error("Unsupported save record");
  const result={...fallback};
  for(const key of ["points","earned","best"]){
   if(value[key]===undefined)continue;
   if(typeof value[key]!=="string"||!/^\d{1,10000}$/.test(value[key]))throw Error("Invalid saved balance");
   result[key]=value[key];
  }
  if(typeof value.autoRemainder==="string"&&/^\d{1,3}$/.test(value.autoRemainder))result.autoRemainder=value.autoRemainder;
  for(const key of ["clicks","activeMs","clickLevel","autoLevel","lastGrowthAt"]){
   if(value[key]===undefined)continue;
   const n=Number(value[key]);
   if(!Number.isSafeInteger(n)||n<0||(["clickLevel","autoLevel"].includes(key)&&n>MAX_SAVED_LEVEL))throw Error("Invalid saved counter or level");
   result[key]=n;
  }
  return result;
 }catch(e){saveBlocked=true;recoveryRaw=typeof original==="string"?original:null;console.warn("Season 2 save could not be read; original save was preserved",e);return {...fallback}}
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
function effectiveGain(value){
 const nerfed=value/softcapDivisor();
 return value>0n&&nerfed===0n?1n:nerfed;
}
function credit(add){
 points+=add;earned+=add;if(points>best)best=points;
 return add;
}
function grant(value){return credit(effectiveGain(value));}
function save(){
 if(saveBlocked)return;
 try{localStorage.setItem(KEY,JSON.stringify({...game,autoRemainder:autoRemainder.toString(),points:points.toString(),earned:earned.toString(),best:best.toString()}))}
 catch(e){console.warn("Season 2 save failed",e)}
}
function recoveryPaused(){return saveBlocked&&recoveryRaw!==null;}
function downloadSaveOriginal(original){const url=URL.createObjectURL(new Blob([original],{type:"application/json"})),a=document.createElement("a");a.href=url;a.download="clicker-save-original.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function offerSaveBackup(){
 try{
  const key=localStorage.getItem(KEY+"_recovery_latest"),original=key&&localStorage.getItem(key);if(original===null||!key)return;
  const panel=document.createElement("p"),button=document.createElement("button");button.type="button";button.id="downloadLastSaveBackup";button.textContent="최근 원본 백업 내려받기";button.style.cssText="padding:12px;border:1px solid #554000;border-radius:8px;background:#554000;color:white;font:inherit;cursor:pointer";button.addEventListener("click",()=>downloadSaveOriginal(original));panel.append(button);document.querySelector(".hero").insertAdjacentElement("afterend",panel);
 }catch(e){/* A backup notice must not interrupt a playable session. */}
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
 if(antiCheat.suspicion>=85){antiCheat.held=true;showChallenge();}
 return true;
}
// Human confirmation is session-only. Never removes saved progress.
const challenge={active:false,lastPointer:null,lastTouch:null,openedAt:0,needsFreshMove:true,cooldownUntil:0,element:null};
document.addEventListener("pointermove",e=>{if(e.isTrusted)challenge.lastPointer={x:e.clientX,y:e.clientY};},{passive:true});
document.addEventListener("pointerdown",e=>{if(e.isTrusted){challenge.lastTouch={x:e.clientX,y:e.clientY};if(challenge.active&&performance.now()>challenge.openedAt+250)challenge.needsFreshMove=false;}},{passive:true});
function showChallenge(){
 if(challenge.active||performance.now()<challenge.cooldownUntil)return;
 challenge.active=true;challenge.openedAt=performance.now();challenge.needsFreshMove=true;
 const panel=document.createElement("div");challenge.element=panel;
 panel.setAttribute("role","dialog");panel.setAttribute("aria-label","입력 확인");
 panel.setAttribute("aria-modal","true");
 panel.style.cssText="position:fixed;z-index:2147483000;padding:14px;background:#fff;color:#232044;border:2px solid #6753ca;border-radius:16px;box-shadow:0 8px 30px #15123d55;max-width:calc(100vw - 24px);width:210px;text-align:center;font:600 14px system-ui";
 const title=document.createElement("div");title.textContent="🛡️ 입력 확인";title.style.marginBottom="10px";
 const button=document.createElement("button");button.type="button";button.textContent="오토가 아닙니다";button.style.cssText="min-height:48px;width:100%;border:0;border-radius:10px;background:#5540b5;color:white;font:700 15px system-ui;cursor:pointer";
 panel.append(title,button);document.body.append(panel);
 const previousFocus=document.activeElement,background=[...document.body.children].filter(e=>e!==panel).map(e=>[e,e.inert]);
 background.forEach(([e])=>{e.inert=true;});
 const rect=panel.getBoundingClientRect(),clickRect=$("clickButton").getBoundingClientRect();
 const w=innerWidth,h=innerHeight,margin=12;
 const avoid=[challenge.lastPointer,challenge.lastTouch].filter(Boolean);
 const overlaps=(x,y)=>x<clickRect.right+24&&x+rect.width>clickRect.left-24&&y<clickRect.bottom+24&&y+rect.height>clickRect.top-24;
 let candidates=[];
 for(let i=0;i<90;i++){
  const x=margin+Math.random()*Math.max(0,w-rect.width-margin*2);
  const y=margin+Math.random()*Math.max(0,h-rect.height-margin*2);
  const distance=avoid.length?Math.min(...avoid.map(p=>Math.hypot(Math.max(x-p.x,0,p.x-x-rect.width),Math.max(y-p.y,0,p.y-y-rect.height)))):999;
  if(!overlaps(x,y))candidates.push({x,y,distance});
 }
 candidates.sort((a,b)=>b.distance-a.distance);
 const pos=candidates.find(p=>p.distance>=120)||candidates[0]||{x:margin,y:margin};
 panel.style.left=pos.x+"px";panel.style.top=pos.y+"px";
 panel.style.maxHeight="calc(100dvh - 24px)";panel.style.overflow="auto";
 const keepInView=()=>{const r=panel.getBoundingClientRect();panel.style.left=Math.max(12,Math.min(r.left,innerWidth-r.width-12))+"px";panel.style.top=Math.max(12,Math.min(r.top,innerHeight-r.height-12))+"px";};
 window.addEventListener("resize",keepInView);
 panel.addEventListener("keydown",e=>{if(e.key==="Tab"){e.preventDefault();button.focus();}});
 button.focus({preventScroll:true});
 button.addEventListener("click",e=>{
  if(!e.isTrusted||performance.now()-challenge.openedAt<350||(e.detail!==0&&challenge.needsFreshMove))return;
  challenge.active=false;challenge.cooldownUntil=performance.now()+30000;
  antiCheat.suspicion=0;antiCheat.times=[];antiCheat.intervals=[];
  window.removeEventListener("resize",keepInView);background.forEach(([el,inert])=>{el.inert=inert;});
  panel.remove();challenge.element=null;setMessage("✅ 확인 완료! 계속 플레이할 수 있어요.");
  (previousFocus?.isConnected?previousFocus:$("clickButton")).focus({preventScroll:true});
 });
}
function antiCheatStatus(){return {review:antiCheat.held,level:antiCheat.suspicion>=60?"review":antiCheat.suspicion>=30?"watch":"normal"};}
let lastFrame=performance.now(),elapsedSave=0;
let autoRemainder=BigInt(game.autoRemainder),autoVisible=document.visibilityState==="visible";
function advanceAuto(now){
 const elapsed=Math.max(0,Math.min(2000,now-lastFrame));lastFrame=now;
 if(autoVisible&&game.autoLevel>0){
  autoRemainder+=effectiveGain(autoGain())*BigInt(Math.floor(elapsed));
  credit(autoRemainder/1000n);autoRemainder%=1000n;
 }
 autoVisible=document.visibilityState==="visible";
 return elapsed;
}
function render(){
 $("clickButton").disabled=recoveryPaused();
 const click=effectiveGain(clickGain()),auto=effectiveGain(autoGain());
 $("score").textContent=fmt(points);
 $("score").title=points.toString();
 $("totalClicks").textContent=game.clicks.toLocaleString("ko-KR");
 $("highScore").textContent=fmt(best);
 $("clickPowerText").textContent="+"+fmt(click);
 $("power").textContent=fmt(click);
 $("power").title="기본 파워 "+fmt(clickGain())+" · 누적 획득량 감쇠 적용 후 표시";
 $("auto").textContent=fmt(auto)+" /초";
 $("auto").title="기본 초당 획득량 "+fmt(autoGain())+" · 누적 획득량 감쇠 적용 후 표시";
 $("multi").textContent="극악 난이도";
 const c=upgradeCost(game.clickLevel,"click"),a=upgradeCost(game.autoLevel,"auto");
 $("powerPrice").textContent=fmt(c);$("autoPrice").textContent=fmt(a);
 $("powerDesc").textContent="레벨 "+game.clickLevel+" · 클릭당 "+fmt(click)+" 점";
 $("autoDesc").textContent="레벨 "+game.autoLevel+" · 초당 "+fmt(auto)+" 점";
 $("powerUpgrade").disabled=recoveryPaused()||points<c;
 $("autoUpgrade").disabled=recoveryPaused()||points<a;
 const seconds=Math.floor(game.activeMs/1000),time=Math.floor(seconds/3600)+"시간 "+Math.floor(seconds%3600/60)+"분 "+seconds%60+"초";
 $("phaseLevel").textContent=time;
 $("phasePrice").textContent=fmt(earned);
 $("phaseNote").textContent="플레이 중 획득한 누적 점수야. 시간이나 1e100으로 성장이 제한되지 않아.";
}
function setMessage(t){$("bonusText").textContent=t}
function buy(kind){
 if(recoveryPaused())return;
 advanceAuto(performance.now());
 const k=kind==="click"?"clickLevel":"autoLevel";
 const cost=upgradeCost(game[k],kind);
 if(points<cost){setMessage("점수가 부족해!");return;}
 points-=cost;
 game[k]++;
 setMessage((kind==="click"?"클릭 파워":"자동 클릭")+" 1레벨 강화!");
 render();save();
}
$("clickButton").addEventListener("click",(event)=>{
 if(recoveryPaused()||challenge.active)return;
 if(!inspectClick(event)){setMessage("🛡️ 신뢰할 수 없는 입력은 점수에 반영하지 않았어요.");return;}
 if(challenge.active)return;
 if(antiCheat.held&&performance.now()-antiCheat.lastWarning>12000){antiCheat.lastWarning=performance.now();setMessage("🛡️ 입력 패턴 확인이 필요해요. 플레이 기록은 유지되지만 이번 세션의 순위 등록은 보류됩니다.");}
 grant(clickGain());game.clicks++;
 setMessage("");
 render();save();
});
$("powerUpgrade").addEventListener("click",()=>buy("click"));
$("autoUpgrade").addEventListener("click",()=>buy("auto"));
function tick(){
 const now=performance.now();
 const elapsed=advanceAuto(now);
 advanceGrowthClock();
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
document.addEventListener("visibilitychange",()=>{advanceAuto(performance.now());advanceGrowthClock();render();save()});
window.addEventListener("pagehide",()=>{advanceAuto(performance.now());advanceGrowthClock();save()});
setInterval(tick,1000);
render();
save();
if(saveBlocked){
 const panel=document.createElement("section");panel.id="saveRecovery";panel.setAttribute("role","alert");
 panel.style.cssText="margin:16px 0;padding:18px;border:2px solid #917000;border-radius:12px;background:#fff7d6;color:#392e08";
 const title=document.createElement("h2");title.textContent="저장 기록을 열지 못했어요";
 const message=document.createElement("p");message.textContent="원본을 유지하고 게임을 잠시 멈췄어요. 원본을 내려받거나, 별도 백업을 보관한 뒤 새 게임을 시작할 수 있어요.";
 const original=recoveryRaw,download=document.createElement("button"),restart=document.createElement("button");
 download.type=restart.type="button";download.textContent="원본 내려받기";restart.textContent="원본 백업 후 새 게임 시작";
 download.id="downloadSaveOriginal";restart.id="restartWithSaveBackup";
 for(const button of [download,restart])button.style.cssText="margin:4px;padding:12px;border:1px solid #554000;border-radius:8px;background:#554000;color:white;font:inherit;cursor:pointer";
 download.disabled=restart.disabled=original===null;
 download.addEventListener("click",()=>downloadSaveOriginal(original));
 restart.addEventListener("click",()=>{
  try{
   if(localStorage.getItem(KEY)!==original){message.textContent="다른 탭에서 기록이 바뀌었어요. 원본을 덮어쓰지 않았으니 새로고침해서 확인해 주세요.";return;}
   const backupKey=KEY+"_recovery_"+(crypto.randomUUID?crypto.randomUUID():Date.now()+"_"+Math.random().toString(36).slice(2));
   localStorage.setItem(backupKey,original);
   if(localStorage.getItem(backupKey)!==original)throw Error("Backup verification failed");
   localStorage.setItem(KEY+"_recovery_latest",backupKey);
   localStorage.setItem(KEY,JSON.stringify(fallback));
  }catch(e){message.textContent="백업을 저장하지 못해 원본을 유지했어요. 원본 내려받기로 보관해 주세요.";return;}
  saveBlocked=false;recoveryRaw=null;game={...fallback};points=earned=best=0n;autoRemainder=0n;lastFrame=performance.now();autoVisible=document.visibilityState==="visible";advanceGrowthClock();render();save();
  panel.setAttribute("role","status");title.textContent="원본 백업을 보관했어요";message.textContent="새 게임을 시작했어요. 원본 내려받기로 백업을 따로 보관할 수 있어요.";restart.remove();download.focus();
 });
 if(original===null){title.textContent="저장소에 연결할 수 없어요";message.textContent="이 탭에서 임시로 플레이할 수 있어요. 원본은 변경하지 않으며 진행 상황은 저장되지 않아요. 저장소 설정을 확인한 뒤 새로고침해 주세요.";}
 panel.append(title,message,download,restart);document.querySelector(".hero").insertAdjacentElement("afterend",panel);
}else offerSaveBackup();
})();
