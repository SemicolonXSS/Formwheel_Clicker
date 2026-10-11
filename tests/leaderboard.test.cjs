const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function setup(){
 const nodes=new Map(),records=Object.fromEntries(Array.from({length:35},(_,i)=>['user'+i,{uid:'user'+i,name:'Player',score:String(i+1),scoreKey:String(i+1).padStart(140,'0'),updatedAt:1}]));
 const queries=[];let rendered=[],status='',writes=0;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{events:{},addEventListener(t,f){this.events[t]=f}});return nodes.get(id)};
 const snap=v=>({val:()=>v,exists:()=>v!=null});
 const db={getDatabase:()=>({}),ref:(_,p)=>p,query:(path,...options)=>({path,options}),orderByChild:x=>({order:x}),limitToLast:x=>({limit:x}),onValue:(_,fn)=>fn(snap(0)),serverTimestamp:()=>({'.sv':'timestamp'}),get:async target=>{
  if(typeof target==='object'){queries.push(target);assert.equal(target.options.find(x=>x.limit)?.limit,20);const rows=Object.values(records).sort((a,b)=>a.scoreKey.localeCompare(b.scoreKey)).slice(-20);return snap(Object.fromEntries(rows.map(r=>[r.uid,r])))}
  assert.notEqual(target,'clickerLeaderboardSeason3','unbounded read');return snap(records[target.split('/').at(-1)]??null)
 },runTransaction:async(p,fn)=>{const key=p.split('/').at(-1),v=fn(records[key]||null);if(v===undefined)return {committed:false,snapshot:snap(records[key])};assert.deepEqual(v.updatedAt,{'.sv':'timestamp'});writes++;records[key]={...v,updatedAt:Date.now()};return {committed:true,snapshot:snap(records[key])}}};
 const auth={currentUser:{uid:'alice'},authStateReady:async()=>{}};
 const context=vm.createContext({console,Date,Intl,BigInt,String,Object,Promise,navigator:{onLine:true},document:{getElementById:node},alert(){},addEventListener(){},window:{ClickerOnline:{getNickname:()=> 'Alice',getScore:()=> '999',render:rows=>rendered=rows,status:t=>status=t,rank(){},formatScaled:x=>x,offline(){}}},__modules:[{initializeApp:()=>({})},db,{getAuth:()=>auth,signInAnonymously:async()=>({user:auth.currentUser}),onAuthStateChanged:(_,fn)=>fn(auth.currentUser)}]});
 const source=fs.readFileSync(require.resolve('../assets/app-2.js'),'utf8').replace(/await Promise.all\(\[[\s\S]*?\]\)/,'__modules');
 await vm.runInContext('(async()=>{'+source+'})()',context);
 return {queries,submit:()=>node('submitButton').events.click(),get rendered(){return rendered},get writes(){return writes},get status(){return status}};
}
test('leaderboard reads only 20 entries and repeated daily submission is rejected',async()=>{const h=await setup();assert.equal(h.rendered.length,20);assert.equal(h.rendered[0].score,'35');await h.submit();assert.equal(h.writes,1);assert.equal(h.rendered[0].score,'999');await h.submit();assert.equal(h.writes,1);assert.match(h.status,/오늘 점수를 이미 등록/);assert.ok(h.queries.every(q=>q.options.some(o=>o.limit===20)))});
