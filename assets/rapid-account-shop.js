const el=id=>document.getElementById(id);
const status=el("rapidAccountStatus"), balance=el("rapidAccountBalance"), eligible=el("rapidAccountEligible");
const products=el("rapidAccountProduct"), refunds=el("rapidAccountRefund");
const connect=el("rapidAccountSignIn"), exchange=el("rapidAccountExchange"), buy=el("rapidAccountBuy"), refund=el("rapidAccountRefundButton");
const api=()=>window.FormwheelRapidAccountV3;
let busy=false,hadConnection=false;
const fmt=value=>BigInt(value).toLocaleString("ko-KR");
function option(value,label){const row=document.createElement("option");row.value=value;row.textContent=label;return row;}
function fill(select,options){
 const previous=select.value;
 select.replaceChildren(...options);
 if(options.some(o=>o.value===previous))select.value=previous;
}
function render(){
 const client=api(),account=client?.getStatus(),wallet=client?.getWallet();
 const available=account?.connected&&wallet;
 connect.hidden=!!account?.signedIn;
 balance.textContent=wallet?fmt(wallet.balance)+" R":"—";
 eligible.textContent=wallet?fmt(wallet.exchangeable)+" R":"—";
 if(!account?.connected){
  hadConnection=false;
  status.textContent=account?.signedIn?(account.mode==="connecting"?"서버 연결 확인 중…":"계정 거래 서버 연결 대기"):"Formwheel 계정에 로그인해 주세요.";
 }else if(!hadConnection){status.textContent="계정 거래 서버에 연결됐어요.";hadConnection=true;}
 const owned=new Set((wallet?.purchases||[]).filter(p=>!p.refundedAt).map(p=>p.productId));
 fill(products,(client?.getCatalog()||[]).filter(item=>!owned.has(item.id)).map(item=>option(item.id,item.name+" · "+fmt(item.price)+" R")));
 fill(refunds,(wallet?.purchases||[]).filter(p=>!p.refundedAt&&Date.now()>=p.purchasedAt&&Date.now()-p.purchasedAt<=86400000)
  .map(p=>option(p.id,p.name+" · "+fmt(p.price)+" R")));
 el("rapidAccountOwned").textContent=owned.size?(wallet.purchases.filter(p=>!p.refundedAt).map(p=>p.name).join(", ")):"아직 없어요.";
 exchange.disabled=busy||!available||BigInt(wallet.exchangeable)<1n;
 buy.disabled=busy||!available||!products.value;
 refund.disabled=busy||!available||!refunds.value;
}
async function run(fn,done){
 if(busy)return;
 busy=true;render();
 try{await fn();status.textContent=done;}
 catch(error){status.textContent=error.message;}
 finally{busy=false;render();}
}
connect.onclick=()=>run(()=>{if(!api())throw Error("로그인 모듈을 불러오지 못했어요.");return api().signIn();},"로그인이 완료됐어요.");
exchange.onclick=()=>{
 const amount=el("rapidAccountAmount").value.trim();
 if(!/^[1-9]\d{0,499}$/.test(amount)){status.textContent="환전 수량을 입력해 주세요.";return;}
 void run(()=>api().creditExchange(amount),"환전이 완료됐어요.");
};
buy.onclick=()=>{
 const productId=products.value, label=products.selectedOptions[0]?.textContent;
 if(productId&&confirm(label+"에 구매할까요?"))void run(()=>api().buy(productId),"구매가 완료됐어요.");
};
refund.onclick=()=>{
 const purchaseId=refunds.value;
 if(purchaseId&&confirm("구매를 취소하고 전액 환불할까요?"))void run(()=>api().refund(purchaseId),"환불이 완료됐어요.");
};
window.addEventListener("formwheel-rapid-account-sync",render);
render();
