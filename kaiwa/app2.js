/* 일어 회화 — 2) 탭 · 대화 목록 */
(function(){
'use strict';
const KC=window.KC,KA=window.KA,esc=KA.esc,$=KA.$,I=KA.I;
const H=KA.H=KA.H||{};
const UI=KA.UI={tab:'talk',tm:'sit',eg:null,eq:''};
const TALK=KA.TALK=window.TALK||[];
const FREE=KA.FREE=window.FREE||[];
const EXALL=KA.EXALL=[];
(window.EXPR||[]).forEach(g=>g.items.forEach((it,i)=>EXALL.push(Object.assign({gid:g.id,gt:g.t,key:g.id+':'+i},it))));
KA.tabs=[['talk','話','대화'],['speak','声','말하기'],['expr','句','표현']];

/* 마이크를 쓸 수 없는 환경(카톡 안 브라우저 등) 안내 */
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

/* 오늘의 대화: 아직 안 해 본 첫 대화, 다 했으면 아무거나 */
function nextScn(){
  const S=KA.S,L=TALK.filter(x=>!S.talk[x.id]);
  return L.length?L[0]:TALK[KC.rnd(TALK.length)];
}
function row(act,i,x,r){
  return '<button class="sitem" data-a="'+act+'" data-i="'+i+'"><span class="grow"><div class="t">'+esc(x.t)+'</div><div class="s">'+esc(x.k)+'</div>'
    +'<div class="tg">'+KA.lvTag(x.lv)+(r?'<span class="tag dn">'+r.n+'회'+(r.best?' · '+r.best+'점':'')+'</span>':'')+'</div></span>'+I.chev+'</button>';
}

KA.vTalk=function(){
  const S=KA.S,nx=nextScn(),ti=TALK.indexOf(nx);
  let h=srWarn();
  h+='<div class="card c-blue today"><div class="lb">오늘의 대화 · N'+nx.lv+'</div><div class="tt jp">'+esc(nx.t)+'</div><div class="muted">'+esc(nx.k)+'</div>'
    +'<button class="btn pri full" data-a="talk-go" data-i="'+ti+'">시작하기</button></div>';
  h+=KA.seg([['sit','상황 대화'],['free','자유 대화']],UI.tm,'tm');
  if(UI.tm==='free'){
    h+='<div class="muted" style="margin:-.3rem .1rem .8rem">정해진 답 없이 생각나는 대로 이야기해요. 마이크가 어려우면 글자로 입력해도 돼요.</div>'
      +FREE.map((t,i)=>row('free-go',i,t,S.free[t.id])).join('');
  }else{
    h+='<div class="muted" style="margin:-.3rem .1rem .8rem">상대와 말을 주고받아요. 내 차례에 문장을 읽거나 비슷하게 말해 보세요.</div>'
      +TALK.map((x,i)=>row('talk-go',i,x,S.talk[x.id])).join('');
  }
  return h;
};

KA.H.tm=el=>{UI.tm=el.dataset.v;KA.render();};
KA.H['talk-go']=el=>{const sc=TALK[+el.dataset.i];if(sc)KA.startTalk(sc);};
KA.H['free-go']=el=>{const t=FREE[+el.dataset.i];if(t)KA.startFree(t);};
KA.H['copy-url']=()=>{try{navigator.clipboard.writeText(location.href).then(()=>KA.toast('주소를 복사했어요. 크롬 주소창에 붙여넣어 주세요'),()=>KA.toast('주소를 복사하지 못했어요'));}catch(e){KA.toast('주소를 복사하지 못했어요');}};
})();
