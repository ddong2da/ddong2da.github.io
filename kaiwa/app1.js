/* 일어 회화 — 1) 공용 도구 · 상태 · 레이어 · 설정 */
(function(){
'use strict';
const KC=window.KC,KA=window.KA={};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=(s,r)=>(r||document).querySelector(s);
KA.esc=esc;KA.$=$;
KA.I={
  x:'<svg class="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  sp:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  chev:'<svg class="ic" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  mic:'<svg class="ic" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
  stop:'<svg class="ic" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>',
  star:'<svg class="ic" viewBox="0 0 24 24"><path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8 6.9 19.5l1-5.7-4.1-4 5.7-.8z"/></svg>',
  warn:'<svg class="ic" viewBox="0 0 24 24"><path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.4v.1"/></svg>',
  back:'<svg class="ic" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>'
};

/* ---------- 글꼴 ---------- */
const FONTS_UI=[
 {id:'Noto Sans KR',l:'노토 산스 KR',t:'깔끔한 기본 고딕',spec:':wght@400;500;700'},
 {id:'IBM Plex Sans KR',l:'플렉스 산스 KR',t:'단정하고 또렷한 고딕',spec:':wght@400;500;700'},
 {id:'Gowun Dodum',l:'고운돋움',t:'부드럽고 편안한 돋움',spec:''},
 {id:'Gowun Batang',l:'고운바탕',t:'책 같은 명조',spec:''},
 {id:'Noto Serif KR',l:'노토 세리프 KR',t:'단정한 명조',spec:':wght@400;600;700'},
 {id:'Nanum Myeongjo',l:'나눔명조',t:'클래식 명조',spec:''},
 {id:'Sunflower',l:'해바라기',t:'둥글고 선명한 고딕',spec:''},
 {id:'sys',l:'시스템 기본',t:'기기 기본 글꼴',fam:"-apple-system,'Apple SD Gothic Neo',system-ui"}
];
const FONTS_JP=[
 {id:'Noto Sans JP',l:'노토 산스 JP',t:'깔끔한 기본 고딕',spec:':wght@400;500;700'},
 {id:'Zen Kaku Gothic New',l:'젠 가쿠 고딕',t:'교과서 같은 고딕',spec:':wght@400;500;700'},
 {id:'Zen Maru Gothic',l:'젠 마루 고딕',t:'둥근 고딕',spec:':wght@400;500;700'},
 {id:'Kosugi Maru',l:'코스기 마루',t:'둥근 교과서체',spec:''},
 {id:'Noto Serif JP',l:'노토 세리프 JP',t:'단정한 명조',spec:':wght@400;600;700'},
 {id:'Shippori Mincho',l:'시포리 명조',t:'소설책 같은 명조',spec:''},
 {id:'Klee One',l:'클레 원',t:'교과서 손글씨체',spec:''},
 {id:'sys',l:'시스템 기본',t:'기기 기본 글꼴',fam:"'Hiragino Sans','Yu Gothic',sans-serif"}
];
function ensureFont(f){
  if(!f||f.id==='sys')return;
  const id='fl-'+f.id.replace(/ /g,'-');
  if(document.getElementById(id))return;
  const l=document.createElement('link');l.id=id;l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family='+f.id.replace(/ /g,'+')+(f.spec||'')+'&display=swap';
  document.head.appendChild(l);
}

/* ---------- 저장 ---------- */
const KEY='jp-kaiwa-v1';
function load(){try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s);}catch(e){}return null;}
const DEF={fUI:'Noto Sans KR',fJP:'Noto Sans JP',scale:'lg',tr:'tap',help:'ko',voice:true,rate:1,vuri:'',auto:false,name:'田中',goal:2,
  talk:{},free:{},sp:{},fav:{},quiz:{},log:{},streak:{last:0,count:0}};
let S=KA.S=Object.assign({},DEF,load()||{});
KA.DEF=DEF;
KA.save=function(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};
KA.today=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/864e5);
KA.bump=function(k,n){
  const d=KA.today();S.log[d]=S.log[d]||{t:0,s:0,q:0};S.log[d][k]=(S.log[d][k]||0)+(n||1);
  if(S.streak.last!==d){S.streak.count=(S.streak.last===d-1)?S.streak.count+1:1;S.streak.last=d;}
  KA.save();
};
const SCALE={md:'16px',lg:'18px',xl:'20px'};
KA.applyLook=function(){
  const root=document.documentElement;
  root.style.fontSize=SCALE[S.scale]||SCALE.lg;
  [['--f-ui',FONTS_UI,S.fUI],['--f-jp',FONTS_JP,S.fJP]].forEach(a=>{
    const f=a[1].find(x=>x.id===a[2])||a[1][0];
    ensureFont(f);root.style.setProperty(a[0],f.fam||("'"+f.id+"'"));
  });
};
KA.name=()=>(S.name&&S.name.trim())||'田中';
KA.fill=s=>String(s==null?'':s).replace(/\{name\}/g,KA.name());

/* ---------- 알림 · 음성 ---------- */
KA.toast=function(t){
  const old=$('.toast');if(old)old.remove();
  const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);
  setTimeout(()=>d.remove(),2800);
};
let ttsWarned=false;
KA.say=function(t){
  if(!KC.ttsOk){KA.toast('이 브라우저는 음성 재생을 지원하지 않아요');return Promise.resolve(false);}
  if(!KC.voices().length&&!ttsWarned){ttsWarned=true;KA.toast('일본어 음성이 설치되어 있어야 소리가 나요');}
  return KC.say(KA.fill(t),{rate:S.rate,voice:S.vuri,name:KA.name()});
};
KA.stopAudio=function(){KC.stopSay();KC.stopListen();};

/* ---------- 레이어 ---------- */
const layer=$('#layer');
let ovEl=null,shEl=null;
KA.onClose=null;
KA.openOv=function(html){KA.closeOv(true);ovEl=document.createElement('div');ovEl.className='ov';ovEl.innerHTML=html;layer.appendChild(ovEl);};
KA.setOv=function(html){if(!ovEl){KA.openOv(html);return;}ovEl.innerHTML=html;};
KA.ovEl=()=>ovEl;
KA.closeOv=function(silent){
  KA.stopAudio();
  if(ovEl){ovEl.remove();ovEl=null;}
  if(!silent&&KA.onClose){const f=KA.onClose;KA.onClose=null;try{f();}catch(e){}}
  else if(silent)KA.onClose=null;
};
KA.openSheet=function(html){
  KA.closeSheet();shEl=document.createElement('div');shEl.className='sheet-bg';
  shEl.innerHTML='<div class="sheet">'+html+'</div>';
  shEl.addEventListener('click',e=>{if(e.target===shEl)KA.closeSheet();});
  layer.appendChild(shEl);
};
KA.closeSheet=function(){if(shEl){shEl.remove();shEl=null;}KC.stopListen();};
KA.sheetEl=()=>shEl;

/* ---------- 공통 조각 ---------- */
KA.spBtn=(t,cls)=>'<button class="sp'+(cls?' '+cls:'')+'" data-a="say" data-t="'+esc(t)+'" aria-label="듣기">'+KA.I.sp+'</button>';
KA.chips=(items,cur,act,multi)=>'<div class="chips">'+items.map(a=>{
  const on=multi?cur.includes(a[0]):cur===a[0];
  return '<button class="chip'+(on?' on':'')+'" data-a="'+act+'" data-v="'+esc(a[0])+'">'+esc(a[1])+'</button>';}).join('')+'</div>';
KA.seg=(items,cur,act)=>'<div class="seg">'+items.map(a=>'<button class="'+(cur===a[0]?'on':'')+'" data-a="'+act+'" data-v="'+a[0]+'">'+esc(a[1])+'</button>').join('')+'</div>';
KA.lvTag=lv=>'<span class="tag'+(lv===1?' n1':'')+'">N'+lv+'</span>';
KA.avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;

/* ---------- 백업 ---------- */
KA.exportCode=function(){try{return btoa(unescape(encodeURIComponent(JSON.stringify(S))));}catch(e){return '';}};
KA.importCode=function(s){
  try{
    const o=JSON.parse(decodeURIComponent(escape(atob(String(s).trim()))));
    if(!o||typeof o.talk!=='object')throw 0;
    S=KA.S=Object.assign({},DEF,o);KA.save();return true;
  }catch(e){return false;}
};
KA.resetAll=function(){S=KA.S=Object.assign({},DEF,{talk:{},free:{},sp:{},fav:{},quiz:{},log:{},streak:{last:0,count:0}});KA.save();};

/* ---------- 설정 ---------- */
function fontList(list,key,sample){
  return list.map(f=>'<button class="fopt'+((S[key]===f.id||(!list.some(x=>x.id===S[key])&&f===list[0]))?' on':'')+'" data-a="font" data-k="'+key+'" data-v="'+f.id+'"><span class="grow"><div class="sp-t" style="font-family:'+(f.fam||("'"+f.id+"'"))+',sans-serif">'+sample+'</div><div class="sm">'+esc(f.l)+' · '+esc(f.t)+'</div></span><span class="ck"></span></button>').join('');
}
KA.openSettings=function(){
  FONTS_UI.concat(FONTS_JP).forEach(ensureFont);
  const vs=KC.voices(),cur=KC.pickVoice(S.vuri);
  const vlist=vs.length?KA.chips(vs.map(v=>[v.voiceURI,v.name.replace(/^Google\s*/i,'G ').slice(0,18)]),cur?cur.voiceURI:'','set-voice'):'<div class="muted">설치된 일본어 음성이 없어요. 기기 설정에서 일본어 음성 데이터를 설치해 주세요.</div>';
  KA.openSheet('<div class="hd"><b class="grow px" style="font-size:1.05rem">설정</b><button class="ibtn" data-a="closeSheet">'+KA.I.x+'</button></div>'
    +'<div class="muted">글자 크기</div>'+KA.chips([['md','보통'],['lg','크게'],['xl','아주 크게']],S.scale,'set-scale')
    +'<div class="muted">한국어 번역 표시</div>'+KA.chips([['on','항상 보기'],['tap','눌러서 보기'],['off','숨기기']],S.tr,'set-tr')
    +'<div class="muted">대화 도움 수준</div>'+KA.chips([['full','일본어+뜻'],['ko','뜻 먼저'],['free','자유 발화']],S.help,'set-help')
    +'<div class="muted" style="line-height:1.55">일본어+뜻: 선택지 문장이 다 보여요 · 뜻 먼저: 한국어 뜻이 보이고 일본어는 눌러서 확인 · 자유 발화: 상황 설명만 보고 직접 말해요</div>'
    +'<h2>음성</h2>'
    +'<div class="muted">상대 말 자동 재생</div>'+KA.chips([['1','켜기'],['0','끄기']],S.voice?'1':'0','set-voice-on')
    +'<div class="muted">음성 속도</div>'+KA.chips([['0.8','느리게'],['1','보통'],['1.15','빠르게']],String(S.rate),'set-rate')
    +'<div class="muted">내 차례에 마이크 자동 시작</div>'+KA.chips([['1','켜기'],['0','끄기']],S.auto?'1':'0','set-auto')
    +'<div class="muted">일본어 목소리</div>'+vlist
    +'<div class="row" style="gap:.5rem;margin-top:.3rem"><button class="btn sm grow" data-a="tts-test">소리 들어 보기</button><button class="btn sm blue grow" data-a="mic-test">마이크 테스트</button></div>'
    +'<div class="say" id="mt" style="display:none"><div class="l">인식된 말</div><div class="t" id="mt-t"></div></div>'
    +'<h2>내 정보</h2><div class="muted">대화 속에서 쓸 내 이름 (일본어로)</div>'
    +'<input class="field" id="nm" value="'+esc(S.name)+'" maxlength="12" style="margin:.4rem 0 .2rem"><div class="muted">예: 田中 / キム — 자기소개 대화에서 이 이름으로 말해요</div>'
    +'<div class="muted" style="margin-top:.8rem">하루 목표 (대화 연습 횟수)</div>'+KA.chips([['1','1번'],['2','2번'],['3','3번'],['5','5번']],String(S.goal),'set-goal')
    +'<h2>글꼴</h2><div class="muted">화면 글꼴 (한국어)</div><div style="margin-top:.5rem">'+fontList(FONTS_UI,'fUI','일어 회화 · 오늘의 대화')+'</div>'
    +'<div class="muted" style="margin-top:.9rem">일본어 글꼴</div><div style="margin-top:.5rem">'+fontList(FONTS_JP,'fJP','日本語 ひらがな カタカナ 会話')+'</div>'
    +'<h2>백업·복원</h2><div class="muted">아래 코드를 복사해 메모장 등에 저장해 두면, 다른 기기나 새 브라우저에서 붙여넣어 복원할 수 있어요.</div>'
    +'<textarea class="bk" id="bk" readonly style="margin-top:.5rem">'+esc(KA.exportCode())+'</textarea>'
    +'<div class="row" style="gap:.5rem;margin-top:.5rem"><button class="btn sm grow" data-a="bk-copy">코드 복사</button><button class="btn sm grow" data-a="bk-sel">전체 선택</button></div>'
    +'<div class="muted" style="margin-top:.8rem">복원할 코드 붙여넣기</div><textarea class="bk" id="bk-in" placeholder="여기에 붙여넣기" style="margin-top:.4rem"></textarea>'
    +'<button class="btn sm blue full" style="margin-top:.5rem" data-a="bk-load">복원하기</button>'
    +'<h2>초기화</h2><button class="btn red full" data-a="reset">연습 기록 전부 지우기</button>');
};
})();
