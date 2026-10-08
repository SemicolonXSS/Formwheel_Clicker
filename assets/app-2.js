const ui=window.ClickerOnline;
try{
 const [{initializeApp},{getDatabase,ref,query,orderByChild,limitToLast,startAt,get,runTransaction},{getAuth,signInAnonymously,onAuthStateChanged}]=await Promise.all([
  import("https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"),
  import("https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js"),
  import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js")
 ]);
 const config={apiKey:"AIzaSyBreTSe1m0-xlbF4aupnU5isRZCihR25IE",authDomain:"formwheel.firebaseapp.com",databaseURL:"https://formwheel-default-rtdb.firebaseio.com",projectId:"formwheel",storageBucket:"formwheel.firebasestorage.app",messagingSenderId:"431583088241",appId:"1:431583088241:web:74e0e34ea1e3e1170c55d0",measurementId:"G-T372YXDF8D"};
 const app=initializeApp(config),db=getDatabase(app),auth=getAuth(app);let uid=null;
 const key=s=>String(s).padStart(140,"0");

 async function loadTop(){
  const snap=await get(query(ref(db,"clickerLeaderboard"),orderByChild("scoreKey"),limitToLast(20)));
  const data=snap.exists()?snap.val():{};
  const list=Object.values(data).sort((a,b)=>String(b.scoreKey||"").localeCompare(String(a.scoreKey||"")));
  ui.render(list);
  ui.status(auth.currentUser?"온라인 리더보드 연결됨 · 사용자 인증 완료":"온라인 리더보드 연결됨 · 점수 등록 시 사용자 인증");
  return true;
 }

 async function ensureAuth(){
  if(auth.currentUser){uid=auth.currentUser.uid;return uid;}
  try{
   const r=await signInAnonymously(auth);uid=r.user.uid;return uid;
  }catch(e){
   console.error("Firebase Auth failed",e);
   throw new Error("AUTH:"+String(e?.code||e?.message||e));
  }
 }

 async function showRank(finalRecord){
  try{
   const snap=await get(query(ref(db,"clickerLeaderboard"),orderByChild("scoreKey"),startAt(finalRecord.scoreKey)));
   const count=snap.exists()?Object.keys(snap.val()).length:1;
   ui.rank(`내 최고 기록 · ${ui.formatScaled(finalRecord.score)}점 · 약 ${count}위`);
  }catch(e){console.warn("rank lookup",e);}
 }

 async function submit(){
  const name=ui.getNickname();
  if(!name){alert("닉네임을 입력해주세요.");return;}
  const score=ui.getScore();
  if(BigInt(score)<=0n){alert("먼저 점수를 만들어주세요!");return;}
  ui.status("사용자 인증 확인 중...");
  let userId;
  try{userId=await ensureAuth();}
  catch(e){
   ui.status("인터넷은 연결됨 · Firebase 익명 인증을 사용할 수 없음");
   alert("온라인 연결은 정상입니다.\n하지만 Firebase 익명 로그인이 비활성화되어 점수를 등록할 수 없습니다.\nFirebase Console → Authentication → Sign-in method에서 Anonymous를 활성화해주세요.");
   return;
  }

  try{
   ui.status("점수를 등록하는 중...");
   const playerRef=ref(db,"clickerLeaderboard/"+userId);
   const result=await runTransaction(playerRef,current=>{
    if(current&&BigInt(current.score||0)>=BigInt(score))return current;
    return {uid:userId,name,score,scoreKey:key(score),updatedAt:Date.now()};
   });
   const finalRecord=result.snapshot.val();
   await loadTop();await showRank(finalRecord);
   alert(BigInt(finalRecord.score||0)===BigInt(score)?"최고 기록이 저장되었습니다!":"기존 최고 기록이 더 높아 유지했습니다.");
  }catch(e){
   console.error("Leaderboard write failed",e);
   ui.status("Firebase 연결됨 · 점수 쓰기 권한/규칙 오류");
   alert("인터넷 연결 문제는 아닙니다. Firebase Realtime Database Rules에서 clickerLeaderboard 쓰기 권한을 확인해주세요.");
  }
 }

 document.getElementById("submitButton").addEventListener("click",submit);
 document.getElementById("nickname").addEventListener("keydown",e=>{if(e.key==="Enter")submit();});
 onAuthStateChanged(auth,u=>{uid=u?.uid||null;});

 try{
  await loadTop();
 }catch(firstError){
  console.warn("Unauthenticated leaderboard read failed",firstError);
  try{
   await ensureAuth();
   await loadTop();
  }catch(secondError){
   console.error("Leaderboard connection failed",secondError);
   if(navigator.onLine){
    const authProblem=String(secondError?.message||secondError).startsWith("AUTH:");
    ui.status(authProblem?"인터넷은 연결됨 · Firebase 인증 설정 오류":"인터넷은 연결됨 · Firebase Database 읽기 오류");
    document.getElementById("leaderboardList").innerHTML=authProblem
     ? '<div class="empty">온라인 연결은 정상입니다. Firebase Anonymous Auth 설정을 확인해주세요.</div>'
     : '<div class="empty">온라인 연결은 정상입니다. Firebase Database Rules 또는 인덱스를 확인해주세요.</div>';
   }else{
    ui.offline("인터넷 연결 없음 · 로컬 게임 모드");
   }
  }
 }

 addEventListener("online",()=>{ui.status("인터넷 재연결됨 · 리더보드 다시 연결 중...");loadTop().catch(()=>ui.status("인터넷은 연결됨 · Firebase 리더보드 읽기 오류"));});
 addEventListener("offline",()=>ui.offline("인터넷 연결 없음 · 로컬 게임 모드"));
}catch(e){
 console.error("Firebase SDK load failed",e);
 if(navigator.onLine){
  ui.status("인터넷은 연결됨 · Firebase SDK 로드 실패");
  document.getElementById("leaderboardList").innerHTML='<div class="empty">Firebase 라이브러리를 불러오지 못했습니다. 잠시 후 새로고침해주세요.</div>';
 }else{
  ui.offline("인터넷 연결 없음 · 로컬 게임 모드");
 }
}
