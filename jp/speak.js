/* 일어 독학 — 말하기
   한국어 뜻을 보고 일본어로 말하기 / 일본어를 보고 따라 읽기 (10문장씩).
   음성 인식이 되면 점수와 틀린 글자를 보여 주고,
   안 되는 곳(아이폰 홈 화면 앱 등)에서는 녹음해서 내 목소리를 정답과 번갈아 들어 보는 방식으로 연습해요. */
(function(){
'use strict';
const A=window.APP;if(!A)return;
const W=window,{esc,I,setOv,closeOv,toast,chips,spBtn,H,render,shuffle}=A;
const IC={
  mic:'<svg class="ic" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>',
  stop:'<svg class="ic" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>',
  play:'<svg class="ic" viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5z"/></svg>'
};

/* ---------- 채점: 정답과 들린 말을 글자 단위로 비교 ---------- */
const K2H=s=>s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const NUM={'〇':'0','零':'0','一':'1','二':'2','三':'3','四':'4','五':'5','六':'6','七':'7','八':'8','九':'9','十':'10','百':'100'};
const PUNCT=/[\s、。，．,.!?！？「」『』（）()・…~〜ー\-"'“”‘’:：;；\/\\\[\]【】<>＜＞♪]/;
function toks(s){
  const out=[];
  Array.from(String(s==null?'':s)).forEach((ch,i)=>{
    Array.from(ch.normalize('NFKC')).forEach(n=>{
      let c=K2H(n.toLowerCase());
      if(NUM[c]!==undefined)c=NUM[c];else if(PUNCT.test(c))c='';
      if(c)out.push({k:c,i:i});
    });
  });
  return out;
}
function lcs(a,b){
  const n=a.length,m=b.length,dp=[];
  for(let i=0;i<=n;i++)dp.push(new Uint16Array(m+1));
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)
    dp[i][j]=a[i-1].k===b[j-1].k?dp[i-1][j-1]+1:(dp[i-1][j]>=dp[i][j-1]?dp[i-1][j]:dp[i][j-1]);
  const hit=new Array(n).fill(false);let i=n,j=m;
  while(i>0&&j>0){
    if(a[i-1].k===b[j-1].k){hit[i-1]=true;i--;j--;}
    else if(dp[i-1][j]>=dp[i][j-1])i--;else j--;
  }
  return {len:dp[n][m],hit:hit};
}
/* targets: 정답 표기들(한자 문장, 읽기), heards: 인식 후보들 → 가장 잘 맞는 조합 */
function score(targets,heards){
  const best={score:0,t:'',h:'',hit:[],tt:[]};
  (heards||[]).forEach(h=>{
    const ht=toks(h);if(!ht.length)return;
    targets.forEach(t=>{
      const tt=toks(t);if(!tt.length)return;
      const r=lcs(tt,ht),cov=r.len/tt.length,prec=r.len/ht.length;
      const sc=0.7*cov+0.3*Math.min(1,prec);
      if(sc>best.score){best.score=sc;best.t=t;best.h=h;best.hit=r.hit;best.tt=tt;}
    });
  });
  return best;
}
function grade(sc){
  if(sc>=.85)return {lv:3,t:'완벽해요'};
  if(sc>=.7)return {lv:2,t:'좋아요'};
  if(sc>=.55)return {lv:1,t:'조금만 더'};
  return {lv:0,t:'다시 해 볼까요'};
}
const WEAK=.7;
function diffHtml(target,r){
  const miss=new Set();
  (r.tt||[]).forEach((t,idx)=>{if(!r.hit[idx])miss.add(t.i);});
  if(!r.tt||!r.tt.length)return esc(target);
  return Array.from(target).map((ch,i)=>miss.has(i)?'<span class="m">'+esc(ch)+'</span>':esc(ch)).join('');
}

/* ---------- 환경 ---------- */
const SRC=()=>W.SpeechRecognition||W.webkitSpeechRecognition;
function env(){
  const ua=navigator.userAgent||'';
  let sa=false;try{sa=!!navigator.standalone||(W.matchMedia&&W.matchMedia('(display-mode: standalone)').matches);}catch(e){}
  return {
    ios:/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1),
    standalone:sa,
    inapp:/KAKAOTALK|NAVER\(inapp|DaumApps|Line\/|FBAN|FBAV|Instagram|; wv\)/i.test(ua)
  };
}
const canRec=()=>!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&W.MediaRecorder);
/* asr: 음성 인식 / rec: 녹음해서 들어 보기 / none: 듣고 따라 하기만 */
function pickMode(){
  const e=env();
  if(SRC()&&!(e.ios&&e.standalone)&&!e.inapp)return 'asr';
  return canRec()?'rec':'none';
}
function noteHtml(m){
  const e=env();let t;
  if(e.ios&&e.standalone)t='아이폰 홈 화면 앱에서는 음성 인식이 막혀 있어서 점수는 못 매겨요.';
  else if(e.inapp)t='지금 열린 화면(앱 안 브라우저)에서는 음성 인식이 안 돼요. 크롬(안드로이드)이나 사파리(아이폰)에서 열어 주세요.';
  else t='이 브라우저는 음성 인식을 지원하지 않아요. 크롬(안드로이드)이나 사파리(아이폰)에서 열어 주세요.';
  if(m==='rec')t+=' 대신 내 목소리를 녹음해서 정답과 번갈아 들어 볼 수 있어요.'+(e.ios&&e.standalone?' 점수까지 보려면 사파리에서 이 주소를 직접 열어 주세요.':'');
  else t+=' 지금은 정답을 듣고 따라 말하는 연습만 할 수 있어요.';
  return '<div class="note" style="margin-top:0">'+esc(t)+'</div>';
}
function errText(e){
  return {
    'no-speech':'소리가 들리지 않았어요. 다시 한번 말해 주세요.',
    'not-allowed':'마이크 권한이 필요해요. 브라우저 설정에서 이 사이트의 마이크를 허용해 주세요.',
    'service-not-allowed':'이 기기에서는 음성 인식을 쓸 수 없어요. 아이폰은 설정에서 받아쓰기를 켜야 해요.',
    'audio-capture':'마이크를 찾을 수 없어요.',
    'network':'인터넷 연결을 확인해 주세요. 음성 인식은 인터넷이 필요해요.',
    'language-not-supported':'이 기기는 일본어 음성 인식을 지원하지 않아요.',
    'unsupported':'이 브라우저는 음성 인식을 지원하지 않아요.',
    'start-failed':'마이크를 시작하지 못했어요. 잠시 뒤 다시 눌러 주세요.',
    'aborted':''
  }[e]||'음성을 인식하지 못했어요. 다시 한번 말해 주세요.';
}

/* ---------- 음성 인식 (한 번에 한 문장) ---------- */
let cur=null;
function listen(cb){
  const SR=SRC();
  if(!SR){cb.end([],'unsupported');return null;}
  stopListen();
  const R=new SR();
  R.lang='ja-JP';R.interimResults=true;R.maxAlternatives=5;R.continuous=false;
  let done=false,fin=null,last='',err='',started=false,tmo=null;
  const finish=(alts,e)=>{
    if(done)return;done=true;clearTimeout(tmo);
    if(cur===h)cur=null;
    cb.end(alts||[],e||'');
  };
  R.onstart=()=>{started=true;};
  R.onresult=ev=>{
    let interim='';
    for(let i=ev.resultIndex;i<ev.results.length;i++){
      const r=ev.results[i];
      if(r.isFinal){const a=[];for(let k=0;k<r.length;k++)a.push(r[k].transcript);fin=a;}
      else interim+=r[0].transcript;
    }
    if(interim){last=interim;cb.interim&&cb.interim(interim);}
  };
  R.onerror=ev=>{err=ev.error||'error';};
  R.onend=()=>{
    if(fin&&fin.length)finish(fin,'');
    else if(last)finish([last],'');
    else finish([],err||(started?'no-speech':'start-failed'));
  };
  const h={
    stop(){try{R.stop();}catch(e){}},
    abort(){done=true;clearTimeout(tmo);try{R.abort();}catch(e){}if(cur===h)cur=null;}
  };
  cur=h;
  try{R.start();}catch(e){cur=null;finish([],'start-failed');return null;}
  tmo=setTimeout(()=>{try{R.stop();}catch(e){}},10000);
  return h;
}
function stopListen(){if(cur){try{cur.abort();}catch(e){}cur=null;}}

/* ---------- 문장 모으기 ---------- */
const sk=()=>A.S.spk||(A.S.spk={src:'ref',mode:'ko',seen:[]});
function pools(){
  const o={ref:[],g5:[],g4:[]},has={ref:new Set(),g5:new Set(),g4:new Set()};
  const add=(k,ja,y,ko)=>{
    if(!ja||/[〇○]/.test(ja)||has[k].has(ja))return;
    has[k].add(ja);
    o[k].push({ja:ja,y:(y&&y!==ja)?y:'',ko:ko||''});
  };
  (W.REF||[]).forEach(r=>{if(r.id==='phrase'&&r.rows)r.rows.forEach(g=>(g[2]||[]).forEach(e=>add('ref',e[0],'',e[1])));});
  [['g5','n5'],['g4','n4']].forEach(p=>(A.G[p[1]]||[]).forEach(g=>(g.e||[]).forEach(e=>add(p[0],e[0],e[1],e[2]))));
  return o;
}
function poolOf(src,P){
  if(src!=='all')return P[src]||[];
  const seen=new Set(),out=[];
  P.ref.concat(P.g5,P.g4).forEach(x=>{if(!seen.has(x.ja)){seen.add(x.ja);out.push(x);}});
  return out;
}
/* 아직 안 해 본 문장부터 10개 (한 바퀴 돌면 다시 처음부터) */
function pick(pl,n){
  const st=sk();let seen=new Set(st.seen||[]);
  let fresh=pl.filter(x=>!seen.has(x.ja));
  if(fresh.length<n){
    const keys=new Set(pl.map(x=>x.ja));
    st.seen=(st.seen||[]).filter(j=>!keys.has(j));fresh=pl.slice();
  }
  const out=shuffle(fresh).slice(0,n);
  st.seen=(st.seen||[]).concat(out.map(x=>x.ja)).slice(-400);
  A.save();
  return out;
}

/* ---------- 연습 탭 카드 ---------- */
function card(){
  const st=sk(),m=pickMode(),n=poolOf(st.src,pools()).length;
  return '<h2 style="margin-top:6px">말하기</h2><div class="card">'
    +(m==='asr'?'':noteHtml(m))
    +'<div class="muted">내용</div>'+chips([['ref','필수 회화'],['g5','N5 예문'],['g4','N4 예문'],['all','전체']],st.src,'spk-src')
    +'<div class="muted">방식</div>'+chips([['ko','뜻 보고 말하기'],['read','보고 따라 읽기']],st.mode,'spk-mode')
    +'<button class="btn pri full" style="margin-top:6px" data-a="spk-start">10문장 시작</button>'
    +'<div class="muted" style="margin-top:8px;line-height:1.5">'+(m==='asr'?'말하면 정답과 비교해서 틀린 글자를 알려 줘요.':m==='rec'?'녹음한 내 목소리를 정답과 번갈아 들어 보며 연습해요.':'정답을 듣고 소리 내어 따라 말해 봐요.')+' <span style="white-space:nowrap">(총 '+n+'문장)</span></div></div>';
}

/* ---------- 한 판 ---------- */
let SK=null,rc=null,player=null;
const $id=id=>document.getElementById(id);

function recFree(){
  if(rc){
    clearTimeout(rc.t);
    try{rc.rec.onstop=null;if(rc.rec.state!=='inactive')rc.rec.stop();}catch(e){}
    try{rc.stream.getTracks().forEach(t=>t.stop());}catch(e){}
    rc=null;
  }
  if(player){try{player.pause();}catch(e){}player=null;}
  if(SK&&SK.url){try{URL.revokeObjectURL(SK.url);}catch(e){}SK.url='';}
}
function cleanup(){
  stopListen();recFree();
  try{speechSynthesis.cancel();}catch(e){}
}
function start(list){
  const st=sk();
  const q=list||pick(poolOf(st.src,pools()),10);
  if(!q.length){toast('문장을 만들 수 없어요');return;}
  cleanup();
  SK={q:q,i:0,res:[],mode:pickMode(),read:st.mode==='read',tok:Date.now()+Math.random()};
  begin();
}
function begin(){
  Object.assign(SK,{phase:'ask',hint:false,listening:false,recording:false,interim:'',heard:'',err:'',errCode:'',fb:null,url:''});
  draw();
}

function micHtml(){
  if(SK.mode==='none')return '<div class="sk-mic-w">'+noteHtml('none')+'<button class="btn pri full" data-a="spk-done">다 말했어요</button></div>';
  const busy=SK.listening||SK.recording,asr=SK.mode==='asr';
  const st=SK.listening?'듣고 있어요…':SK.recording?'녹음 중이에요. 다 말하면 눌러 주세요':(asr?'눌러서 말하세요':'눌러서 녹음하세요');
  return '<div class="sk-mic-w">'
    +'<div class="sk-heard'+(SK.listening&&SK.interim?' on':'')+'" id="sk-t">'+esc(SK.interim)+'</div>'
    +'<button class="sk-mic'+(busy?' on':'')+'" data-a="'+(asr?'spk-mic':'spk-rec')+'" aria-label="'+(busy?'멈추기':'말하기')+'">'+(busy?IC.stop:IC.mic)+'</button>'
    +'<div class="sk-st">'+st+'</div>'
    +(SK.err?'<div class="sk-err">'+esc(SK.err)+'</div>':'')
    +(SK.err&&asr&&canRec()?'<button class="btn sm soft" data-a="spk-torec">녹음으로 연습하기</button>':'')
    +'</div>';
}
function askHtml(q){
  const show=SK.read||SK.hint;
  return '<div class="sk-card"><div class="sk-lb">'+(SK.read?'소리 내어 읽어 보세요':'일본어로 말해 보세요')+'</div>'
    +(show
      ?'<div class="sk-ja jp">'+esc(q.ja)+'</div>'+(q.y?'<div class="sk-yomi jp">'+esc(q.y)+'</div>':'')+'<div class="sk-ko">'+esc(q.ko)+'</div><div class="sk-sp">'+spBtn(q.ja)+'</div>'
      :'<div class="sk-kob">'+esc(q.ko)+'</div><button class="btn sm soft" data-a="spk-hint">정답 힌트 보기</button>')
    +'</div>'+micHtml();
}
function fbHtml(q,last){
  const r=SK.fb,next='<button class="btn pri" data-a="spk-next">'+(last?'결과 보기':'다음')+'</button>';
  let h='<div class="sk-card sk-res">';
  if(r){
    const g=grade(r.score),onY=!!q.y&&r.t===q.y;
    h+='<div class="sk-vd g'+g.lv+'"><b>'+g.t+'</b><span>'+Math.round(r.score*100)+'%</span></div>'
      +'<div class="sk-ja jp">'+(onY?esc(q.ja):diffHtml(q.ja,r))+'</div>'
      +(q.y?'<div class="sk-yomi jp">'+(onY?diffHtml(q.y,r):esc(q.y))+'</div>':'');
  }else{
    h+='<div class="sk-ja jp">'+esc(q.ja)+'</div>'+(q.y?'<div class="sk-yomi jp">'+esc(q.y)+'</div>':'');
  }
  h+='<div class="sk-ko">'+esc(q.ko)+'</div>';
  if(r)h+='<div class="sk-hd">들린 말 <b>'+esc(r.h||SK.heard)+'</b></div>';
  if(SK.mode==='rec'&&SK.url)h+='<div class="sk-cmp"><button class="btn" data-a="spk-play">'+IC.play+'<span>내 목소리</span></button><button class="btn" data-a="say" data-t="'+esc(q.ja)+'">'+I.sp+'<span>정답</span></button></div>';
  else h+='<div class="sk-sp">'+spBtn(q.ja)+'</div>';
  if(SK.mode==='none')h+='<div class="sk-acts one">'+next+'</div>';
  else h+='<div class="sk-acts"><button class="btn" data-a="spk-retry">'+(SK.mode==='rec'?'다시 녹음':'다시 말하기')+'</button>'+next+'</div>';
  return h+'</div>';
}
function draw(){
  if(!SK)return;
  const q=SK.q[SK.i],last=SK.i+1>=SK.q.length,pct=Math.round(SK.i/SK.q.length*100);
  setOv('<div class="ov-top"><button class="ibtn" data-a="spk-close" aria-label="닫기">'+I.x+'</button><div class="grow"><div class="bar"><i style="width:'+pct+'%"></i></div></div><span class="muted">'+(SK.i+1)+' / '+SK.q.length+'</span></div>'
    +'<div class="ov-body">'+(SK.phase==='ask'?askHtml(q):fbHtml(q,last))+'</div>');
}

/* 음성 인식으로 말하기 */
function startListen(){
  if(!SK||SK.phase!=='ask'||SK.mode!=='asr')return;
  try{speechSynthesis.cancel();}catch(e){}
  const my=SK.tok,idx=SK.i;
  SK.listening=true;SK.interim='';SK.heard='';SK.err='';SK.errCode='';draw();
  const h=listen({
    interim:t=>{
      if(!SK||SK.tok!==my)return;
      SK.interim=t;const el=$id('sk-t');if(el){el.textContent=t;el.classList.add('on');}
    },
    end:(alts,err)=>{
      if(!SK||SK.tok!==my||SK.i!==idx)return;
      SK.listening=false;cur=null;
      if(!alts.length){SK.err=errText(err);SK.errCode=err;draw();return;}
      const q=SK.q[idx],r=score([q.ja].concat(q.y?[q.y]:[]),alts);
      SK.fb=r;SK.heard=alts[0];SK.phase='fb';
      const prev=SK.res[idx];
      SK.res[idx]={sc:Math.max(r.score,prev&&prev.sc!=null?prev.sc:0)};
      draw();
    }
  });
  cur=h;
}

/* 녹음해서 들어 보기 */
async function startRec(){
  if(!SK||SK.phase!=='ask'||SK.mode!=='rec')return;
  try{speechSynthesis.cancel();}catch(e){}
  recFree();
  const my=SK.tok,idx=SK.i;
  SK.err='';
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
  catch(e){
    if(!SK||SK.tok!==my)return;
    SK.err=(e&&e.name==='NotAllowedError')?'마이크 권한이 필요해요. 설정에서 이 앱(사이트)의 마이크를 허용해 주세요.':'마이크를 시작하지 못했어요. 잠시 뒤 다시 눌러 주세요.';
    draw();return;
  }
  if(!SK||SK.tok!==my||SK.i!==idx||SK.phase!=='ask'){try{stream.getTracks().forEach(t=>t.stop());}catch(e){}return;}
  let rec;
  try{
    const mt=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'].find(t=>W.MediaRecorder.isTypeSupported&&W.MediaRecorder.isTypeSupported(t));
    rec=mt?new W.MediaRecorder(stream,{mimeType:mt}):new W.MediaRecorder(stream);
  }catch(e){
    try{stream.getTracks().forEach(t=>t.stop());}catch(_){}
    SK.err='이 브라우저에서는 녹음이 안 돼요.';draw();return;
  }
  const chunks=[];
  rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
  rec.onstop=()=>{
    try{stream.getTracks().forEach(t=>t.stop());}catch(e){}
    if(rc){clearTimeout(rc.t);rc=null;}
    if(!SK||SK.tok!==my||SK.i!==idx)return;
    SK.recording=false;
    if(!chunks.length){SK.err='녹음된 소리가 없어요. 다시 해 볼까요?';draw();return;}
    SK.url=URL.createObjectURL(new Blob(chunks,{type:rec.mimeType||'audio/mp4'}));
    SK.fb=null;SK.phase='fb';
    if(!SK.res[idx])SK.res[idx]={sc:null};
    draw();
  };
  rc={rec:rec,stream:stream,t:setTimeout(()=>{try{rec.stop();}catch(e){}},15000)};
  try{rec.start();}catch(e){recFree();SK.err='녹음을 시작하지 못했어요.';draw();return;}
  SK.recording=true;draw();
}

/* ---------- 결과 ---------- */
function finish(){
  cleanup();
  SK.phase='end';
  const sc=SK.q.map((q,i)=>SK.res[i]&&SK.res[i].sc!=null?SK.res[i].sc:null);
  const has=sc.filter(x=>x!=null);
  const avg=has.length?Math.round(has.reduce((a,b)=>a+b,0)/has.length*100):null;
  const weak=SK.q.filter((q,i)=>sc[i]!=null&&sc[i]<WEAK);
  SK.weak=weak;
  const msg=avg==null?'이번에 연습한 문장이에요. 소리 내어 한 번씩 더 읽어 봐요.'
    :avg>=85?'정말 잘했어요.':avg>=70?'좋아요! 이대로 꾸준히 해요.':avg>=55?'잘하고 있어요. 아쉬운 문장은 한 번 더 해 봐요.':'천천히 다시 도전해 봐요.';
  const rows=SK.q.map((q,i)=>{
    const lv=sc[i]==null?-1:grade(sc[i]).lv;
    return '<div class="sk-rrow"><span class="sk-dot'+(lv>=0?' g'+lv:'')+'"></span><div class="grow"><div class="sk-rj jp">'+esc(q.ja)+'</div><div class="sk-rk">'+esc(q.ko)+'</div></div>'+spBtn(q.ja)+'</div>';
  }).join('');
  setOv('<div class="ov-top"><b class="grow" style="font-size:17px">연습 결과</b><button class="ibtn" data-a="spk-close" aria-label="닫기">'+I.x+'</button></div>'
    +'<div class="ov-body"><div class="card" style="text-align:center">'
    +(avg!=null?'<div class="sc">'+avg+'<small style="font-size:16px;font-weight:500">점</small></div>':'<div class="sc">'+SK.q.length+'<small style="font-size:16px;font-weight:500">문장</small></div>')
    +'<div class="muted" style="margin-top:4px">'+msg+'</div></div>'
    +'<h2>이번에 연습한 문장</h2><div class="card" style="padding-top:6px;padding-bottom:6px">'+rows+'</div>'
    +'<button class="btn pri full" data-a="spk-again">새 10문장 하기</button>'
    +(weak.length&&SK.mode==='asr'?'<button class="btn soft full" style="margin-top:10px" data-a="spk-weak">아쉬운 문장만 다시 ('+weak.length+')</button>':'')
    +'<button class="btn full" style="margin-top:10px" data-a="spk-close">닫기</button></div>');
}

/* ---------- 이벤트 ---------- */
H['spk-src']=el=>{sk().src=el.dataset.v;A.save();render(true);};
H['spk-mode']=el=>{sk().mode=el.dataset.v;A.save();render(true);};
H['spk-start']=()=>start();
H['spk-again']=()=>start();
H['spk-weak']=()=>{if(SK&&SK.weak&&SK.weak.length)start(SK.weak.slice());};
H['spk-close']=()=>{cleanup();SK=null;closeOv();render(true);};
H['spk-hint']=()=>{if(SK){SK.hint=true;draw();}};
H['spk-mic']=()=>{if(!SK)return;if(SK.listening){if(cur)cur.stop();return;}startListen();};
H['spk-rec']=()=>{
  if(!SK)return;
  if(SK.recording){if(rc){try{rc.rec.stop();}catch(e){}}return;}
  startRec();
};
H['spk-play']=()=>{
  if(!SK||!SK.url)return;
  try{speechSynthesis.cancel();}catch(e){}
  try{if(player)player.pause();player=new W.Audio(SK.url);const p=player.play();if(p&&p.catch)p.catch(()=>toast('재생할 수 없어요'));}catch(e){toast('재생할 수 없어요');}
};
H['spk-done']=()=>{if(!SK)return;SK.fb=null;SK.phase='fb';SK.res[SK.i]={sc:null};draw();};
H['spk-torec']=()=>{if(!SK)return;SK.mode='rec';SK.err='';SK.errCode='';draw();};
H['spk-retry']=()=>{
  if(!SK)return;
  cleanup();
  SK.phase='ask';SK.hint=true;SK.fb=null;SK.heard='';SK.interim='';SK.err='';SK.listening=false;SK.recording=false;
  if(SK.mode==='asr')startListen();
  else if(SK.mode==='rec'){draw();startRec();}
  else draw();
};
H['spk-next']=()=>{
  if(!SK)return;
  cleanup();
  if(SK.i+1>=SK.q.length){finish();return;}
  SK.i++;begin();
};
/* 화면이 가려지면 듣기·녹음을 멈춰요 */
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden||!SK)return;
  if(SK.listening){stopListen();SK.listening=false;SK.interim='';draw();}
  else if(SK.recording&&rc){try{rc.rec.stop();}catch(e){}}
});

W.SPK={card:card};
if(A.UI.tab==='practice')render(true);
})();
