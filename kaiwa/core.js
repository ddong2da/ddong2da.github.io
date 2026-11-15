/* 일어 회화 — 점수 계산 · 음성(재생/인식) 도구 */
(function(W){
'use strict';
const KC=W.KC={};

/* ---------- 정규화 · 토큰 ---------- */
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
KC.toks=toks;
KC.flat=s=>toks(s).map(t=>t.k).join('');

/* ---------- LCS ---------- */
function lcs(a,b){
  const n=a.length,m=b.length;
  const dp=[];for(let i=0;i<=n;i++)dp.push(new Uint16Array(m+1));
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)
    dp[i][j]=a[i-1].k===b[j-1].k?dp[i-1][j-1]+1:(dp[i-1][j]>=dp[i][j-1]?dp[i-1][j]:dp[i][j-1]);
  const hit=new Array(n).fill(false);let i=n,j=m;
  while(i>0&&j>0){
    if(a[i-1].k===b[j-1].k){hit[i-1]=true;i--;j--;}
    else if(dp[i-1][j]>=dp[i][j-1])i--;else j--;
  }
  return {len:dp[n][m],hit:hit};
}

/* targets: 정답 문자열 배열(대체 정답 포함), heards: 인식 후보 배열 → 가장 좋은 조합 */
KC.score=function(targets,heards){
  const best={score:0,cov:0,prec:0,t:'',h:'',hit:[],tt:[]};
  (heards||[]).forEach(h=>{
    const ht=toks(h);if(!ht.length)return;
    (targets||[]).forEach(t=>{
      const tt=toks(t);if(!tt.length)return;
      const r=lcs(tt,ht),cov=r.len/tt.length,prec=r.len/ht.length;
      const sc=0.7*cov+0.3*Math.min(1,prec);
      if(sc>best.score){best.score=sc;best.cov=cov;best.prec=prec;best.t=t;best.h=h;best.hit=r.hit;best.tt=tt;}
    });
  });
  return best;
};
/* 여러 선택지 중 어느 것을 말했는지: 선택지마다 [ja,...alts]로 채점 */
KC.pickOpt=function(opts,heards){
  const rs=opts.map((o,i)=>{const r=KC.score([o[0]].concat(o[2]||[]),heards);r.i=i;return r;});
  rs.sort((a,b)=>b.score-a.score);
  return rs;
};
KC.grade=function(sc){
  if(sc>=.85)return {lv:3,t:'완벽해요'};
  if(sc>=.7)return {lv:2,t:'좋아요'};
  if(sc>=.55)return {lv:1,t:'조금만 더'};
  return {lv:0,t:'다시 해 볼까요'};
};
KC.PASS=.55;
/* 정답 문장에서 빠뜨린 글자를 표시 */
KC.diffHtml=function(target,r,esc){
  const miss=new Set();
  (r.tt||[]).forEach((t,idx)=>{if(!r.hit[idx])miss.add(t.i);});
  if(!r.tt||!r.tt.length)return esc(target);
  return Array.from(target).map((ch,i)=>miss.has(i)?'<span class="m">'+esc(ch)+'</span>':esc(ch)).join('');
};
/* 자유 대화 키워드 포함 여부 */
KC.hasKw=function(text,kws){
  const f=KC.flat(text);if(!f)return false;
  return kws.some(k=>{const kf=KC.flat(k);return kf&&f.indexOf(kf)>=0;});
};

/* ---------- 환경 ---------- */
KC.srOk=!!(W.SpeechRecognition||W.webkitSpeechRecognition);
KC.ttsOk='speechSynthesis' in W;
KC.env=function(){
  const ua=navigator.userAgent||'';
  let sa=false;try{sa=!!navigator.standalone||(W.matchMedia&&W.matchMedia('(display-mode: standalone)').matches);}catch(e){}
  return {
    android:/Android/i.test(ua),
    ios:/iPhone|iPad|iPod/i.test(ua),
    kakao:/KAKAOTALK/i.test(ua),
    inapp:/KAKAOTALK|NAVER\(inapp|DaumApps|Line\/|FBAN|FBAV|Instagram|; wv\)/i.test(ua),
    standalone:sa
  };
};
KC.chromeUrl=()=>'intent://'+location.host+location.pathname+location.search+'#Intent;scheme=https;package=com.android.chrome;end';
KC.kakaoUrl=()=>'kakaotalk://web/openExternal?url='+encodeURIComponent(location.href);

/* ---------- 음성 재생(TTS) ---------- */
let voices=[],sayTok=0;
function loadVoices(){
  try{voices=speechSynthesis.getVoices().filter(v=>/^ja/i.test(v.lang)||/japan|日本/i.test(v.name));}catch(e){voices=[];}
}
if(KC.ttsOk){
  loadVoices();
  try{speechSynthesis.addEventListener('voiceschanged',loadVoices);}catch(e){try{speechSynthesis.onvoiceschanged=loadVoices;}catch(_){}}
}
KC.voices=function(){loadVoices();return voices;};
KC.pickVoice=function(uri){
  loadVoices();
  return voices.find(v=>v.voiceURI===uri)||voices[0]||null;
};
KC.say=function(text,o){
  o=o||{};
  return new Promise(res=>{
    if(!KC.ttsOk||!text){res(false);return;}
    const my=++sayTok;
    try{speechSynthesis.cancel();}catch(e){}
    setTimeout(()=>{
      if(my!==sayTok){res(false);return;}
      let fin=false,t=null;
      const end=ok=>{if(fin)return;fin=true;clearTimeout(t);res(ok);};
      try{
        const u=new SpeechSynthesisUtterance(String(text).replace(/\{name\}/g,o.name||''));
        u.lang='ja-JP';u.rate=o.rate||1;
        const v=KC.pickVoice(o.voice);if(v)u.voice=v;
        u.onend=()=>end(true);u.onerror=()=>end(false);
        t=setTimeout(()=>end(true),Math.max(3000,String(text).length*380/(u.rate||1)+2500));
        speechSynthesis.speak(u);
      }catch(e){end(false);}
    },70);
  });
};
KC.stopSay=function(){sayTok++;try{speechSynthesis.cancel();}catch(e){}};

/* ---------- 음성 인식(STT) ---------- */
let cur=null;
/* cb: {start, interim(text), end(alts[], err)}  → 핸들 {stop(), abort()} */
KC.listen=function(cb){
  const SRC=W.SpeechRecognition||W.webkitSpeechRecognition;
  if(!SRC){cb.end&&cb.end([],'unsupported');return null;}
  KC.stopListen();
  const R=new SRC();
  R.lang='ja-JP';R.interimResults=true;R.maxAlternatives=5;R.continuous=false;
  let done=false,finalAlts=null,lastInt='',err='',tmo=null;
  const finish=(alts,e)=>{
    if(done)return;done=true;clearTimeout(tmo);
    if(cur===h)cur=null;
    cb.end&&cb.end(alts||[],e||'');
  };
  R.onstart=()=>{cb.start&&cb.start();};
  R.onresult=ev=>{
    let interim='';
    for(let i=ev.resultIndex;i<ev.results.length;i++){
      const r=ev.results[i];
      if(r.isFinal){const a=[];for(let k=0;k<r.length;k++)a.push(r[k].transcript);finalAlts=a;}
      else interim+=r[0].transcript;
    }
    if(interim){lastInt=interim;cb.interim&&cb.interim(interim);}
  };
  R.onerror=ev=>{err=ev.error||'error';};
  R.onend=()=>{
    if(finalAlts&&finalAlts.length)finish(finalAlts,'');
    else if(lastInt)finish([lastInt],'');
    else finish([],err||'no-speech');
  };
  const h={
    stop(){try{R.stop();}catch(e){}},
    abort(){done=true;clearTimeout(tmo);try{R.abort();}catch(e){}if(cur===h)cur=null;}
  };
  cur=h;
  try{R.start();}catch(e){cur=null;finish([],'start-failed');return null;}
  tmo=setTimeout(()=>{try{R.stop();}catch(e){}},cb.timeout||10000);
  return h;
};
KC.stopListen=function(){if(cur){try{cur.abort();}catch(e){}cur=null;}};
KC.errText=function(e){
  return {
    'no-speech':'소리가 들리지 않았어요. 다시 한번 말해 주세요.',
    'not-allowed':'마이크 권한이 필요해요. 주소창 옆 자물쇠에서 마이크를 허용해 주세요.',
    'service-not-allowed':'이 브라우저에서는 음성인식을 쓸 수 없어요. 크롬에서 열어 주세요.',
    'audio-capture':'마이크를 찾을 수 없어요.',
    'network':'인터넷 연결을 확인해 주세요. 음성인식은 인터넷이 필요해요.',
    'language-not-supported':'이 기기는 일본어 음성인식을 지원하지 않아요.',
    'unsupported':'이 브라우저는 음성인식을 지원하지 않아요. 크롬에서 열어 주세요.',
    'start-failed':'마이크를 시작하지 못했어요. 잠시 뒤 다시 눌러 주세요.',
    'aborted':''
  }[e]||'음성을 인식하지 못했어요. 다시 한번 말해 주세요.';
};

/* ---------- 기타 ---------- */
KC.AIZ=[
  ['なるほど。','그렇군요.'],['そうなんですね。','그렇군요.'],['いいですね。','좋네요.'],
  ['へえ、そうなんですか。','와, 그래요?'],['それは素敵ですね。','그거 멋지네요.']
];
KC.shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
KC.rnd=n=>Math.floor(Math.random()*n);
})(window);
