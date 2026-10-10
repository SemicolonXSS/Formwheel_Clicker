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
 const koreaDay=ms=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(ms));
 const submittedToday=record=>!!record&&(record.lastSubmissionDay===koreaDay(Date.now())||(!record.lastSubmissionDay&&record.updatedAt&&koreaDay(record.updatedAt)===koreaDay(Date.now())));
 let submitting=false;

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
  if(submitting)return;
  const name=ui.getNickname();
  if(!name){alert("닉네임을 입력해주세요.");return;}
  const score=ui.getScore();
  if(BigInt(score)<=0n){alert("먼저 점수를 만들어주세요!");return;}
  submitting=true;
  const button=document.getElementById("submitButton");
  button.disabled=true;
  try{
   ui.status("사용자 인증 확인 중...");
   let userId;
   try{userId=await ensureAuth();}
   catch(e){
    ui.status("인터넷은 연결됨 · Firebase 익명 인증을 사용할 수 없음");
    alert("Firebase 익명 로그인을 확인해주세요. Firebase Console → Authentication → Sign-in method에서 Anonymous를 활성화해야 합니다.");
    return;
   }
   ui.status("하루 1회 등록 가능 여부 확인 중...");
   const playerRef=ref(db,"clickerLeaderboard/"+userId);
   const before=(await get(playerRef)).val();
   if(submittedToday(before)){
    ui.status("오늘 점수를 이미 등록했습니다 · 내일 00:00(KST)에 다시 등록 가능");
    alert("오늘은 이미 점수를 등록했어요! 한국 시간 기준 내일 00:00부터 다시 등록할 수 있습니다.");
    return;
   }
   ui.status("점수를 등록하는 중...");
   const result=await runTransaction(playerRef,current=>{
    if(submittedToday(current))return;
    const isBetter=!current||BigInt(score)>BigInt(current.score||0);
    return {
     ...(current||{}),
     uid:userId,
     name:isBetter?name:(current.name||name),
     score:isBetter?score:String(current.score),
     scoreKey:isBetter?key(score):(current.scoreKey||key(current.score)),
     updatedAt:Date.now(),
     lastSubmissionDay:koreaDay(Date.now())
    };
   });
   if(!result.committed){
    ui.status("오늘 점수를 이미 등록했습니다 · 내일 00:00(KST)에 다시 등록 가능");
    alert("오늘 등록 횟수를 모두 사용했어요! 내일 다시 시도해주세요.");
    return;
   }
   const finalRecord=result.snapshot.val();
   await loadTop();
   await showRank(finalRecord);
   ui.status("오늘 등록 완료 · 내일 00:00(KST)부터 다시 등록 가능");
   alert(BigInt(finalRecord.score||0)===BigInt(score)?"오늘의 기록을 등록했어요!":"오늘의 등록을 완료했어요. 이전 최고 기록이 더 높아 순위 점수는 유지했어요.");
  }catch(e){
   console.error("Leaderboard write failed",e);
   ui.status("리더보드 등록 오류 · Firebase 인증 또는 Database Rules 확인");
   alert("점수 등록에 실패했습니다. Firebase 권한과 연결 상태를 확인해주세요.");
  }finally{
   submitting=false;
   button.disabled=false;
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
