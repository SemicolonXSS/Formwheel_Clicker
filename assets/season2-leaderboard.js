/* Clicker Season 2 community leaderboard: independent of legacy season 1.02.
 * Rankings are client-submitted and not server-verified game achievements.
 */
const root="clickerLeaderboardSeason2";
const scoreLength=101; // leading-zero padded decimal integer, bounded by 1e100
const maxScore=10n**100n;
const el=id=>document.getElementById(id);
const status=message=>{el("s2Status").textContent=message};
const cleanName=value=>String(value??"").trim().slice(0,12);
const formatScore=value=>{
 const n=BigInt(value);
 if(n<1000000000000000n)return n.toLocaleString("ko-KR");
 const s=n.toString();
 return s[0]+(s.slice(1,3)!=="00"?"."+s.slice(1,3):"")+"e"+(s.length-1);
};
function normalizeScore(value){
 const n=BigInt(value);
 if(n<0n||n>maxScore)throw Error("시즌 2의 점수 범위(0 ~ 1e100)를 벗어났어요.");
 return n.toString().padStart(scoreLength,"0");
}
function drawRows(records,myUid){
 const target=el("s2List");
 target.replaceChildren();
 if(!records.length){const empty=document.createElement("div");empty.className="empty";empty.textContent="아직 등록된 시즌 2 점수가 없어요. 첫 번째 기록에 도전해 봐!";target.append(empty);return;}
 records.forEach((item,index)=>{
  const row=document.createElement("div");row.className="rank-row";
  const rank=document.createElement("div");rank.className="rank";rank.textContent=String(index+1);
  const player=document.createElement("div");player.className="player";player.textContent=item.name+(item.uid===myUid?" (나)":"");
  const points=document.createElement("div");points.className="points";points.textContent=formatScore(item.score);
  row.append(rank,player,points);target.append(row);
 });
 const myIndex=records.findIndex(v=>v.uid===myUid);
 el("s2MyRank").textContent=myIndex>=0?"내 현재 순위: "+(myIndex+1)+"위":"";
}
try{
 const [{initializeApp,getApps},{getDatabase,ref,query,orderByChild,limitToLast,get,runTransaction},{getAuth,signInAnonymously}]=await Promise.all([
  import("https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"),
  import("https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js"),
  import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js")
 ]);
 const config={apiKey:"AIzaSyBreTSe1m0-xlbF4aupnU5isRZCihR25IE",authDomain:"formwheel.firebaseapp.com",databaseURL:"https://formwheel-default-rtdb.firebaseio.com",projectId:"formwheel",storageBucket:"formwheel.firebasestorage.app",messagingSenderId:"431583088241",appId:"1:431583088241:web:74e0e34ea1e3e1170c55d0"};
 const app=getApps().find(x=>x.name==="[DEFAULT]")||initializeApp(config);
 const db=getDatabase(app),auth=getAuth(app);
 let busy=false;
 async function refresh(){
  status("시즌 2 순위를 불러오는 중…");
  try{
   const snapshot=await get(query(ref(db,root),orderByChild("score"),limitToLast(20)));
   const rows=Object.entries(snapshot.val()||{}).map(([uid,v])=>({uid,name:cleanName(v?.name),score:v?.score}))
    .filter(v=>v.name&&typeof v.score==="string"&&/^[0-9]{101}$/.test(v.score))
    .sort((a,b)=>b.score.localeCompare(a.score));
   drawRows(rows,auth.currentUser?.uid||"");
   status("온라인 순위 연결됨 · 최고 점수 상위 20명");
  }catch(error){
   console.warn("Season 2 leaderboard read unavailable",error?.code||error?.message||error);
   status("시즌 2 Firebase 읽기 권한이나 연결을 확인해 주세요. 기존 게임 기록은 안전해요.");
   el("s2List").textContent="온라인 랭킹을 표시할 수 없어요. 시즌 2 전용 Firebase Rules가 아직 게시되지 않았을 수 있어요.";
  }
 }
 async function submit(){
  if(busy)return;
  const name=cleanName(el("s2Nickname").value);
  if(!name){status("닉네임을 입력해 주세요.");return}
  const raw=window.ClickerSeason2?.getBest?.();
  if(!raw||!/^[0-9]+$/.test(raw)){status("시즌 2 점수를 읽지 못했어요.");return}
  let score;
  try{score=normalizeScore(raw)}catch(error){status(error.message);return}
  if(BigInt(raw)===0n){status("먼저 시즌 2에서 점수를 얻어 주세요.");return}
  busy=true;el("s2Submit").disabled=true;
  try{
   await auth.authStateReady();
   let user=auth.currentUser;
   if(!user){status("Firebase 익명 계정으로 연결 중…");user=(await signInAnonymously(auth)).user;}
   status("최고 점수 등록 중…");
   const node=ref(db,root+"/"+user.uid);
   const tx=await runTransaction(node,current=>{
    const now=Date.now();
    if(current&&typeof current.score==="string"&&current.score>=score)return;
    if(current&&typeof current.updatedAt==="number"&&now-current.updatedAt<60000)return;
    return {uid:user.uid,name,score,updatedAt:now};
   },{applyLocally:false});
   if(!tx.committed){status("최고 점수가 이미 등록됐거나 1분 등록 간격이 남았어요.");return}
   status("🏆 시즌 2 최고 점수 등록 성공!");
   await refresh();
  }catch(error){
   console.warn("Season 2 leaderboard submit failed",error?.code||error?.message||error);
   status("등록에 실패했어요. 시즌 2 전용 Firebase Rules의 쓰기 권한 또는 로그인을 확인해 주세요.");
  }finally{busy=false;el("s2Submit").disabled=false}
 }
 el("s2Refresh").addEventListener("click",refresh);
 el("s2Submit").addEventListener("click",submit);
 refresh();
}catch(error){
 console.warn("Season 2 Firebase SDK unavailable",error);
 status("Firebase 연결에 실패했어요. 온라인 순위만 사용할 수 없으며 클릭커는 계속 플레이할 수 있어요.");
}
