/* 일어 회화 — 2) 홈 · 대화 목록 */
(function(){
'use strict';
const KC=window.KC,KA=window.KA,esc=KA.esc,$=KA.$,I=KA.I;
const H=KA.H=KA.H||{};
const UI=KA.UI={tab:'home',tlv:'all',tcat:'all',elg:'all',eq:'',slv:'all',scat:'all',pq:{rlv:'all',klv:'all',elv:'all'}};
const CATS=KA.CATS={daily:'일상',travel:'여행',life:'생활',work:'직장',talk:'토론'};
const TALK=KA.TALK=window.TALK||[];
const EXALL=KA.EXALL=[];
(window.EXPR||[]).forEach(g=>g.items.forEach((it,i)=>EXALL.push(Object.assign({gid:g.id,gt:g.t,key:g.id+':'+i},it))));
KA.tabs=[['home','家','홈'],['talk','話','대화'],['speak','声','말하기'],['expr','句','표현'],['prac','練','연습']];

function ringSvg(pct,done,goal){
  const r=40,c=2*Math.PI*r;
  return '<div class="ring"><svg viewBox="0 0 92 92"><circle class="bg" cx="46" cy="46" r="'+r+'"/><circle class="fg" cx="46" cy="46" r="'+r+'" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+(c*(1-pct/100)).toFixed(1)+'"/></svg><div><b>'+done+'</b><span>/ '+goal+'번</span></div></div>';
}
function srWarn(){
  if(KC.srOk)return '';
  const e=KC.env();
  let t='이 브라우저는 음성인식을 지원하지 않아요',b='크롬 앱에서 이 주소를 열어 주세요. 지금은 문장을 골라서 답하는 방식으로 쓸 수 있어요.',btn='';
  if(e.inapp){
    t='이 안에서는 음성인식이 안 돼요';
    b='카톡·네이버 같은 앱 안의 화면이라 마이크 기능이 막혀 있어요. 크롬으로 열면 말하기가 돼요.';
    btn='<div class="row" style="gap:.5rem;margin-top:.6rem">'
      +(e.android?'<a class="btn sm pri grow" href="'+esc(KC.chromeUrl())+'">크롬으로 열기</a>':'')
      +(e.kakao?'<a class="btn sm grow" href="'+esc(KC.kakaoUrl())+'">기본 브라우저로 열기</a>':'')
      +'<button class="btn sm grow" data-a="copy-url">주소 복사</button></div>';
  }else if(e.ios&&e.standalone){
    t='홈 화면 앱에서는 음성인식이 안 돼요';b='아이폰은 사파리에서 주소를 직접 열면 말하기를 쓸 수 있어요.';
  }
  return '<div class="warn"><span>'+I.warn+'</span><div><b>'+esc(t)+'</b>'+esc(b)+btn+'</div></div>';
}
KA.srWarn=srWarn;
function nextScn(){
  const S=KA.S,L=TALK.filter(x=>!S.talk[x.id]);
  return L.length?L[0]:TALK[KC.rnd(TALK.length)];
}
KA.vHome=function(){
  const S=KA.S,d=KA.today(),lg=S.log[d]||{t:0,s:0,q:0};
  const goal=S.goal,done=lg.t,pct=Math.min(100,Math.round(done/goal*100));
  const st=(S.streak.last>=d-1)?S.streak.count:0;
  const total=Object.values(S.talk).reduce((a,x)=>a+(x.n||0),0);
  const title=done===0?'오늘 대화를 시작해 볼까요':(done<goal?'목표까지 '+(goal-done)+'번 남았어요':'오늘 목표를 채웠어요');
  const nx=nextScn(),ti=TALK.indexOf(nx);
  const ex=EXALL.length?EXALL[d%EXALL.length]:null;
  const nDone=TALK.filter(x=>S.talk[x.id]).length;
  const row=(t,g,ti2,sub)=>'<button class="lrow" data-a="tab" data-v="'+t+'"><span class="g">'+g+'</span><span class="grow"><div class="t">'+ti2+'</div><div class="s">'+sub+'</div></span>'+I.chev+'</button>';
  return srWarn()
   +'<div class="card"><div class="hero">'+ringSvg(pct,done,goal)+'<div class="grow"><h3>'+title+'</h3><div class="muted">말하면서 배우는 일본어 회화</div></div></div>'
   +'<div class="stats"><div><b>'+st+'</b><span>연속 일수</span></div><div><b>'+lg.s+'</b><span>오늘 말한 문장</span></div><div><b>'+total+'</b><span>누적 대화</span></div></div>'
   +'<button class="btn pri full" data-a="talk-open" data-i="'+ti+'">오늘의 대화 · '+esc(nx.t)+'</button>'
   +'<div class="btn2"><button class="btn sm" data-a="free-list">자유 대화</button><button class="btn sm" data-a="tab" data-v="speak">말하기 연습</button></div></div>'
   +(ex?'<h2>오늘의 표현</h2><button class="card todayx" style="display:block;width:100%;text-align:left" data-a="ex-open" data-k="'+ex.key+'"><div class="j">'+esc(ex.e)+'</div>'+(ex.r?'<div class="r">'+esc(ex.r)+'</div>':'')+'<div class="muted" style="margin-top:.2rem">'+esc(ex.m)+'</div></button>':'')
   +'<h2>연습 메뉴</h2><div class="lgroup">'
   +row('talk','話','대화 연습','역할을 맡아 일본어로 주고받기 · '+nDone+'/'+TALK.length+' 완료')
   +row('speak','声','말하기 연습','한→일 말하기 · 따라 말하기 · 자유 대화')
   +row('expr','句','표현 사전','구어체·경어·관용구 '+EXALL.length+'개와 경어표')
   +row('prac','練','연습 퀴즈','즉시 응답 · 경어 · 듣기')
   +'</div>';
};

/* ---------- 대화 목록 ---------- */
function talkFiltered(){
  return TALK.filter(x=>(UI.tlv==='all'||String(x.lv)===UI.tlv)&&(UI.tcat==='all'||x.cat===UI.tcat));
}
KA.vTalk=function(){
  const S=KA.S,list=talkFiltered();
  const done=TALK.filter(x=>S.talk[x.id]).length;
  return '<div class="card c-blue" style="margin-top:.4rem"><div class="px" style="margin-bottom:.15rem">대화 연습 · '+done+'/'+TALK.length+'</div><div class="muted">상대와 말을 주고받으며 연습해요. 내 차례에 마이크로 말하면 인식된 말에 맞춰 상대가 대답해요.</div></div>'
   +KA.srWarn()
   +KA.seg([['all','전체'],['2','N2'],['1','N1']],UI.tlv,'tlv')
   +KA.chips([['all','전체']].concat(Object.keys(CATS).map(k=>[k,CATS[k]])),UI.tcat,'tcat')
   +(list.length?list.map(x=>{
      const i=TALK.indexOf(x),r=S.talk[x.id];
      return '<button class="sitem'+(r?' done':'')+'" data-a="talk-open" data-i="'+i+'"><span class="n">'+(i+1)+'</span><span class="grow"><div class="t">'+esc(x.t)+'</div><div class="s">'+esc(x.k)+'</div>'
        +'<div class="tg">'+KA.lvTag(x.lv)+'<span class="tag" style="background:var(--ln2);color:var(--sub)">'+CATS[x.cat]+'</span>'+(r?'<span class="tag dn">'+r.n+'회'+(r.best?' · 최고 '+r.best+'%':'')+'</span>':'')+'</span></div></span>'+I.chev+'</button>';
    }).join(''):'<div class="empty">해당하는 대화가 없어요</div>');
};
function openTalkSheet(i){
  const x=TALK[i];if(!x)return;
  UI.lastTalk=i;
  const S=KA.S;
  KA.openSheet('<div class="hd"><span class="grow muted">'+KA.lvTag(x.lv)+' <span style="margin-left:.3rem">'+CATS[x.cat]+'</span></span><button class="ibtn" data-a="closeSheet">'+I.x+'</button></div>'
   +'<div class="big-w">'+esc(x.t)+'</div><div class="muted" style="margin-top:.2rem">'+esc(x.k)+'</div>'
   +'<div class="card" style="margin-top:.8rem"><div class="px" style="font-size:.9rem">상대 · <span class="jp">'+esc(x.g)+'</span> <span class="muted" style="font-weight:400">('+esc(x.gk)+')</span></div><div style="margin-top:.35rem;line-height:1.7;font-size:.86rem">'+esc(x.s)+'</div></div>'
   +'<h2>핵심 표현</h2><div class="kpl">'+x.kp.map(p=>'<button data-a="say" data-t="'+esc(p[0])+'">'+esc(p[0])+'<small>'+esc(p[1])+'</small></button>').join('')+'</div>'
   +'<h2>도움 수준</h2>'+KA.chips([['full','일본어+뜻'],['ko','뜻 먼저'],['free','자유 발화']],S.help,'set-help-sheet')
   +'<div class="muted" style="margin-bottom:.8rem">'+({full:'선택지 문장이 모두 보여요. 읽는 연습부터 시작하기 좋아요.',ko:'한국어 뜻을 보고 일본어를 떠올려요. 눌러서 일본어를 확인해요.',free:'상황 설명만 보고 직접 말해요. 가장 실전에 가까워요.'}[S.help])+'</div>'
   +'<button class="btn pri full" data-a="talk-go" data-i="'+i+'">대화 시작</button>');
}
KA.openTalkSheet=openTalkSheet;

H.tlv=el=>{UI.tlv=el.dataset.v;KA.render();};
H.tcat=el=>{UI.tcat=el.dataset.v;KA.render();};
H['talk-open']=el=>openTalkSheet(+el.dataset.i);
H['set-help-sheet']=el=>{KA.S.help=el.dataset.v;KA.save();openTalkSheet(UI.lastTalk!=null?UI.lastTalk:0);};
H['copy-url']=()=>{try{navigator.clipboard.writeText(location.href).then(()=>KA.toast('주소를 복사했어요. 크롬 주소창에 붙여넣어 주세요'),()=>KA.toast('주소를 복사하지 못했어요'));}catch(e){KA.toast('주소를 복사하지 못했어요');}};
})();
