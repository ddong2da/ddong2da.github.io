(function(){
'use strict';
const C=window.CORE,V=C.VOCAB,K=C.KANJI,CATS=C.CATS;
const G={n5:window.G5,n4:window.G4};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=(s,r)=>(r||document).querySelector(s);
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const hasKanji=s=>/[一-鿿]/.test(s);
const I={
  x:'<svg class="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  sp:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  chev:'<svg class="ic" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>'
};
const FONTS_UI=[
 {id:'Noto Sans KR',l:'노토 산스 KR',t:'깔끔한 기본 고딕',spec:':wght@400;500;700'},
 {id:'IBM Plex Sans KR',l:'플렉스 산스 KR',t:'단정하고 또렷한 고딕',spec:':wght@400;500;700'},
 {id:'Gowun Dodum',l:'고운돋움',t:'부드럽고 편안한 돋움',spec:''},
 {id:'Gowun Batang',l:'고운바탕',t:'책 같은 명조',spec:''},
 {id:'Noto Serif KR',l:'노토 세리프 KR',t:'단정한 명조',spec:':wght@400;600;700'},
 {id:'Nanum Myeongjo',l:'나눔명조',t:'클래식 명조',spec:''},
 {id:'Sunflower',l:'해바라기',t:'둥글고 선명한 고딕',spec:''},
 {id:'Jua',l:'주아',t:'통통하고 귀여운 글씨',spec:''},
 {id:'Do Hyeon',l:'도현',t:'굵고 또렷한 제목체',spec:''},
 {id:'Hi Melody',l:'하이멜로디',t:'손글씨 느낌',spec:''},
 {id:'Gaegu',l:'개구',t:'낙서 같은 손글씨',spec:''},
 {id:'sys',l:'시스템 기본',t:'기기 기본 글꼴',fam:"-apple-system,'Apple SD Gothic Neo',system-ui"}
];
const FONTS_JP=[
 {id:'Noto Sans JP',l:'노토 산스 JP',t:'깔끔한 기본 고딕',spec:':wght@400;500;700'},
 {id:'Zen Kaku Gothic New',l:'젠 가쿠 고딕',t:'교과서 같은 고딕',spec:':wght@400;500;700'},
 {id:'Zen Maru Gothic',l:'젠 마루 고딕',t:'둥근 고딕',spec:':wght@400;500;700'},
 {id:'M PLUS Rounded 1c',l:'M+ 라운드',t:'둥글고 귀여운 고딕',spec:':wght@400;500;700'},
 {id:'Kosugi Maru',l:'코스기 마루',t:'둥근 교과서체',spec:''},
 {id:'Noto Serif JP',l:'노토 세리프 JP',t:'단정한 명조',spec:':wght@400;600;700'},
 {id:'Shippori Mincho',l:'시포리 명조',t:'소설책 같은 명조',spec:''},
 {id:'Klee One',l:'클레 원',t:'일본 교과서 손글씨체',spec:''},
 {id:'Yusei Magic',l:'유세이 매직',t:'매직펜 손글씨',spec:''},
 {id:'DotGothic16',l:'도트 고딕16',t:'도트(픽셀) 글씨',spec:''},
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
function applyFonts(){
  const root=document.documentElement;
  [['--f-ui',FONTS_UI,S.fUI],['--f-jp',FONTS_JP,S.fJP]].forEach(a=>{
    const f=a[1].find(x=>x.id===a[2])||a[1][0];
    ensureFont(f);root.style.setProperty(a[0],f.fam||("'"+f.id+"'"));
  });
}

/* ---------- 저장 ---------- */
const KEY='jp-dokhak-v1';
let mem=null;
function load(){try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s);}catch(e){}return null;}
const DEF={fUI:'Noto Sans KR',fJP:'Noto Sans JP',cards:{},goal:20,newPerDay:10,rate:0.9,front:'mix',auto:false,log:{},streak:{last:0,count:0},kana:{},kj:{},gdone:{}};
let S=Object.assign({},DEF,load()||{});
function save(){mem=S;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
const today=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/864e5);
function bump(k,n){
  const d=today();S.log[d]=S.log[d]||{r:0,n:0,q:0};S.log[d][k]+=(n||1);
  if(S.streak.last!==d){S.streak.count=(S.streak.last===d-1)?S.streak.count+1:1;S.streak.last=d;}
  save();
}

/* ---------- 음성·토스트 ---------- */
let jaVoice=null,warned=false;
function pickVoice(){try{jaVoice=speechSynthesis.getVoices().find(v=>/^ja/i.test(v.lang))||null;}catch(e){}}
if('speechSynthesis' in window){pickVoice();try{speechSynthesis.onvoiceschanged=pickVoice;}catch(e){}}
function toast(t){
  const old=$('.toast');if(old)old.remove();
  const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);
  setTimeout(()=>d.remove(),2600);
}
function say(t){
  if(!('speechSynthesis' in window)){toast('이 브라우저는 음성을 지원하지 않아요');return;}
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=S.rate;
    if(jaVoice)u.voice=jaVoice;
    else if(!warned){warned=true;toast('일본어 음성이 설치돼 있어야 소리가 나요');}
    u.onerror=()=>{if(!warned){warned=true;toast('여기선 음성 재생이 막혀 있을 수 있어요');}};
    speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------- SRS 도우미 ---------- */
const cardOf=v=>S.cards[v.k];
const dueList=()=>V.filter(v=>S.cards[v.k]&&S.cards[v.k].d<=today());
const newPool=lv=>V.filter(v=>(lv==='all'||v.lv===lv)&&!S.cards[v.k]);
function stat(v){const c=S.cards[v.k];return !c?0:(c.b>=4?2:1);}
function dayLabel(n){return n<=0?'지금':n+'일';}

/* ---------- UI 상태 ---------- */
const UI={tab:'home',vlv:'n5',vcat:'all',vq:'',glv:'n5',kset:'h',ref:'phrase',
  pq:{vlv:'n5',vmode:'jk',ctype:'verb',cforms:['te','nai','ta','masu'],clv:'n5',kdir:'ka',ksets:['basic'],kscripts:['h'],kmode:'hun'}};
const TABS=[['home','家','홈'],['kana','あ','가나'],['vocab','語','단어'],['grammar','文','문법'],['kanji','字','한자'],['practice','練','연습']];

/* ---------- 레이어 ---------- */
const layer=$('#layer');
let ovEl=null,shEl=null;
function openOv(html){closeOv();ovEl=document.createElement('div');ovEl.className='ov';ovEl.innerHTML=html;layer.appendChild(ovEl);}
function setOv(html){if(!ovEl){openOv(html);return;}ovEl.innerHTML=html;const b=$('.ov-body',ovEl);if(b)b.scrollTop=0;}
function closeOv(){if(ovEl){ovEl.remove();ovEl=null;}try{speechSynthesis.cancel();}catch(e){}}
function openSheet(html){
  closeSheet();shEl=document.createElement('div');shEl.className='sheet-bg';
  shEl.innerHTML='<div class="sheet">'+html+'</div>';
  shEl.addEventListener('click',e=>{if(e.target===shEl)closeSheet();});
  layer.appendChild(shEl);
}
function closeSheet(){if(shEl){shEl.remove();shEl=null;}}

/* ---------- 공통 조각 ---------- */
const spBtn=t=>'<button class="sp" data-a="say" data-t="'+esc(t)+'" aria-label="듣기">'+I.sp+'</button>';
const chips=(items,cur,act,multi)=>'<div class="chips">'+items.map(([v,l])=>{
  const on=multi?cur.includes(v):cur===v;
  return '<button class="chip'+(on?' on':'')+'" data-a="'+act+'" data-v="'+esc(v)+'">'+esc(l)+'</button>';}).join('')+'</div>';
const seg=(items,cur,act)=>'<div class="seg">'+items.map(([v,l])=>'<button class="'+(cur===v?'on':'')+'" data-a="'+act+'" data-v="'+v+'">'+esc(l)+'</button>').join('')+'</div>';
const dot=v=>'<span class="mk '+(['','y','g'][stat(v)])+'"></span>';

/* ---------- 홈 ---------- */
function ringSvg(pct,done,goal){
  const r=38,c=2*Math.PI*r;
  return '<div class="ring"><svg viewBox="0 0 92 92"><circle class="bg" cx="46" cy="46" r="'+r+'"/><circle class="fg" cx="46" cy="46" r="'+r+'" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+(c*(1-pct/100)).toFixed(1)+'"/></svg><div><b>'+done+'</b><span>/ '+goal+'장</span></div></div>';
}
function vHome(){
  const d=today(),lg=S.log[d]||{r:0,n:0,q:0};
  const done=lg.r+lg.n,pct=Math.min(100,Math.round(done/S.goal*100));
  const st=(S.streak.last>=d-1)?S.streak.count:0;
  const due=dueList().length,newLeft=Math.max(0,S.newPerDay-lg.n);
  const title=done===0?'오늘 학습을 시작해요':(done<S.goal?'목표까지 '+(S.goal-done)+'장 남았어요':'오늘 목표를 채웠어요');
  let lv='';
  [['n5','N5'],['n4','N4']].forEach(a=>{
    const list=V.filter(v=>v.lv===a[0]),seen=list.filter(v=>S.cards[v.k]).length,mast=list.filter(v=>stat(v)===2).length;
    lv+='<div class="prog"><div class="row"><b class="grow">'+a[1]+' 단어</b><span class="muted">외움 '+mast+' · 학습 중 '+(seen-mast)+' · 전체 '+list.length+'</span></div>'
      +'<div class="bar"><i class="a" style="width:'+(seen/list.length*100).toFixed(1)+'%"></i><i class="g" style="width:'+(mast/list.length*100).toFixed(1)+'%"></i></div></div>';
  });
  const gdone=Object.keys(S.gdone).length,gtotal=G.n5.length+G.n4.length;
  const kd=K.filter(k=>S.kj[k.c]).length;
  const row=(t,g,ti,sub)=>'<button class="lrow" data-a="tab" data-v="'+t+'"><span class="g">'+g+'</span><span class="grow"><div class="t">'+ti+'</div><div class="s">'+sub+'</div></span>'+I.chev+'</button>';
  return '<div class="hero">'+ringSvg(pct,done,S.goal)+'<div class="grow"><h3>'+title+'</h3><div class="muted">'+(st>0?'연속 '+st+'일째 학습 중':'오늘이 첫 날이에요')+'</div></div></div>'
    +'<div class="stats"><div><b>'+due+'</b><span>복습할 카드</span></div><div><b>'+newLeft+'</b><span>오늘 새 단어</span></div><div><b>'+st+'일</b><span>연속 학습</span></div></div>'
    +'<button class="btn pri full" data-a="session" data-v="n5">카드 학습 시작</button>'
    +'<div class="btn2"><button class="btn sm" data-a="session" data-v="n5" data-x="1">N5 새 단어 +10</button><button class="btn sm" data-a="session" data-v="n4" data-x="1">N4 새 단어 +10</button></div>'
    +'<h2>단어 진도</h2><div class="card">'+lv+'</div>'
    +'<h2>학습 메뉴</h2><div class="lgroup">'
    +row('kana','あ','가나','히라가나·가타카나 표와 퀴즈')
    +row('grammar','文','문법 '+gdone+' / '+gtotal,'N5·N4 문법과 회화 표현')
    +row('kanji','字','한자 '+kd+' / '+K.length,'N5 한자 '+K.length+'자')
    +row('practice','練','연습','단어 퀴즈 · 활용 트레이너')
    +'</div><div class="muted" style="margin-top:18px;line-height:1.6">공부 기록은 이 기기의 브라우저에 저장돼요. 기기를 바꾸기 전에 설정에서 백업 코드를 복사해 두세요.</div>';
}

/* ---------- 가나 ---------- */
function kanaCells(src,type){
  return src.map(a=>a?{c:type==='k'?C.toKata(a[0]):a[0],r:a[1]}:null);
}
function kanaGrid(cells,cls){
  return '<div class="kgrid '+(cls||'')+'">'+cells.map(c=>c?
    '<button class="kcell'+((S.kana[c.c]||0)>=2?' ok':'')+'" data-a="say" data-t="'+esc(c.c)+'"><b class="jp">'+c.c+'</b><span>'+c.r+'</span></button>':'<div class="kcell e"></div>').join('')+'</div>';
}
function vKana(){
  const t=UI.kset;
  let h=seg([['h','히라가나 ひらがな'],['k','가타카나 カタカナ']],t,'kset');
  h+='<div class="note">탭하면 소리가 나요. 퀴즈에서 두 번 이상 맞힌 글자는 초록색으로 바뀌어요.</div>';
  h+='<h2>기본 46자</h2>'+kanaGrid(kanaCells(window.HIRA_BASIC,t));
  h+='<h2>탁음·반탁음 <small>゛ ゜ 이 붙은 글자</small></h2>'+kanaGrid(kanaCells(window.HIRA_DAKU,t));
  h+='<h2>요음 <small>작은 ゃゅょ가 붙어 한 박자로 읽어요</small></h2>'+kanaGrid(kanaCells(window.HIRA_YOON,t),'y');
  if(t==='k')h+='<h2>외래어용 확장</h2>'+kanaGrid(window.KATA_EXTRA.map(a=>({c:a[0],r:a[1]})));
  h+='<h2>꼭 알아둘 규칙</h2><div class="card" style="line-height:1.7;font-size:14px">'
    +'<b>っ (작은 つ)</b> : 다음 소리를 한 박자 막아 줘요. きって(우표), ざっし(잡지)<br>'
    +'<b>ー (장음)</b> : 가타카나에서 소리를 길게. コーヒー, ケーキ<br>'
    +'<b>장음 (히라가나)</b> : おかあさん(あ), おにいさん(い), ありがとう(う), おねえさん(え), おおきい(お)<br>'
    +'<b>は·へ·を</b> : 조사일 때만 は=[와], へ=[에], を=[오]로 읽어요<br>'
    +'<b>ん</b> : 뒤 소리에 따라 ㄴ/ㅁ/ㅇ처럼 들려요. ほん, さんぽ</div>'
    +'<div class="row" style="gap:8px;margin-bottom:6px"><button class="btn butter grow" data-a="kquiz" data-v="ka">가나 → 로마자</button><button class="btn pink grow" data-a="kquiz" data-v="ak">로마자 → 가나</button></div>';
  return h;
}

/* ---------- 단어 ---------- */
function vocabFiltered(){
  const q=UI.vq.trim().toLowerCase();
  return V.filter(v=>v.lv===UI.vlv&&(UI.vcat==='all'||v.c===UI.vcat)&&(!q||v.w.includes(q)||v.r.includes(q)||v.m.toLowerCase().includes(q)));
}
function vocabRows(){
  const l=vocabFiltered();
  if(!l.length)return '<div class="empty">찾는 단어가 없어요</div>';
  return l.map(v=>{const i=V.indexOf(v);
    return '<div class="vrow" data-a="vd" data-i="'+i+'">'+dot(v)+'<div class="grow"><div class="w">'+esc(v.w)+(v.w!==v.r?' <span class="r">'+esc(v.r)+'</span>':'')+'</div><div class="muted">'+esc(v.m)+'</div></div>'
      +'<button class="sp" data-a="say" data-t="'+esc(v.r)+'">'+I.sp+'</button></div>';}).join('');
}
function vVocab(){
  const lv=UI.vlv,list=V.filter(v=>v.lv===lv),mast=list.filter(v=>stat(v)===2).length,seen=list.filter(v=>S.cards[v.k]).length;
  const cats=Object.keys(CATS).filter(c=>list.some(v=>v.c===c));
  return seg([['n5','N5 ('+V.filter(v=>v.lv==='n5').length+')'],['n4','N4 ('+V.filter(v=>v.lv==='n4').length+')']],lv,'vlv')
    +'<div class="card c-mint"><div class="row"><div class="grow"><b>'+list.length+'단어</b><div class="muted">외움 '+mast+' · 학습 중 '+(seen-mast)+' · 새 단어 '+(list.length-seen)+'</div></div>'
    +'<button class="btn pri sm" data-a="session" data-v="'+lv+'">카드 학습</button></div></div>'
    +'<input class="search" id="vsearch" placeholder="단어·읽기·뜻 검색" value="'+esc(UI.vq)+'">'
    +'<div class="chips" style="margin-top:10px"><button class="chip'+(UI.vcat==='all'?' on':'')+'" data-a="vcat" data-v="all">전체</button>'
    +cats.map(c=>'<button class="chip'+(UI.vcat===c?' on':'')+'" data-a="vcat" data-v="'+c+'">'+CATS[c]+'</button>').join('')+'</div>'
    +'<div id="vlist">'+vocabRows()+'</div>';
}
function conjTable(v){
  let rows='';
  if(v.c==='verb'){
    rows=Object.keys(C.VFORMS).map(f=>{const w=C.conjVerb(v.w,v.r,v.g,f),r=C.conjVerb(v.r,v.r,v.g,f);
      return '<tr><td>'+C.VFORMS[f]+'</td><td class="jp"><b>'+esc(w)+'</b>'+(w!==r?'<br><span class="muted">'+esc(r)+'</span>':'')+'</td></tr>';}).join('');
  }else if(v.c==='iadj'||v.c==='naadj'){
    rows=Object.keys(C.AFORMS).map(f=>{const w=C.conjAdj(v.w,v.c,f),r=C.conjAdj(v.r,v.c,f);
      return '<tr><td>'+C.AFORMS[f]+'</td><td class="jp"><b>'+esc(w)+'</b>'+(w!==r?'<br><span class="muted">'+esc(r)+'</span>':'')+'</td></tr>';}).join('');
  }
  return rows?'<h2>활용</h2><div class="tw"><table class="t"><tr><th>형태</th><th>'+esc(v.w)+'</th></tr>'+rows+'</table></div>':'';
}
function openWord(i){
  const v=V[i],c=S.cards[v.k];
  const gtxt=v.g?(' · '+v.g+'그룹 동사'):(v.c==='iadj'?' · い형용사':(v.c==='naadj'?' · な형용사':''));
  openSheet('<div class="hd"><span class="grow muted">'+(v.lv==='n5'?'N5':'N4')+' · '+CATS[v.c]+gtxt+'</span><button class="ibtn" data-a="closeSheet">'+I.x+'</button></div>'
    +'<div class="row"><div class="grow"><div class="big-w">'+esc(v.w)+'</div>'+(v.w!==v.r?'<div class="jp" style="font-size:20px;color:#3b6ea5">'+esc(v.r)+'</div>':'')+'<div style="font-size:20px;font-weight:700;margin-top:6px">'+esc(v.m)+'</div></div>'+spBtn(v.r)+'</div>'
    +'<div class="muted" style="margin-top:12px">'+(c?'카드 단계 '+c.b+'/7 · 다음 복습 '+(c.d<=today()?'오늘':(c.d-today())+'일 뒤'):'아직 학습 전')+'</div>'
    +'<div class="row" style="margin-top:10px;gap:8px">'+(c?'<button class="btn sm grow" data-a="cardreset" data-i="'+i+'">처음부터 다시</button>':'')+'<button class="btn sm butter grow" data-a="cardknown" data-i="'+i+'">이미 아는 단어 (외움 처리)</button></div>'
    +conjTable(v));
}

/* ---------- 문법 ---------- */
function vGrammar(){
  const g=UI.glv;
  let h=seg([['n5','N5 문법'],['n4','N4 문법'],['ref','표현·표']],g,'glv');
  if(g==='ref')return h+vRef();
  const list=G[g],done=list.filter(x=>S.gdone[g+':'+x.t]).length;
  h+='<div class="card c-butter"><b>'+list.length+'개 문법</b><div class="muted">이해 체크 '+done+'/'+list.length+' · 예문 옆 스피커 버튼으로 들어 보세요</div></div>';
  h+=list.map((x,i)=>'<button class="gitem'+(S.gdone[g+':'+x.t]?' done':'')+'" data-a="gd" data-i="'+i+'"><span class="n">'+(i+1)+'</span><div class="grow"><div class="t">'+esc(x.t)+'</div><div class="s">'+esc(x.m.length>46?x.m.slice(0,46)+'…':x.m)+'</div></div></button>').join('');
  return h;
}
function openGrammar(i){
  const g=UI.glv,x=G[g][i],key=g+':'+x.t,on=!!S.gdone[key];
  openSheet('<div class="hd"><span class="grow muted">'+g.toUpperCase()+' 문법 '+(i+1)+'/'+G[g].length+'</span><button class="ibtn" data-a="closeSheet">'+I.x+'</button></div>'
    +'<div class="jp" style="font-size:24px;font-weight:700">'+esc(x.t)+'</div>'
    +'<div class="card c-blue" style="margin-top:10px"><div class="muted">접속</div><div class="jp" style="font-weight:700">'+esc(x.f)+'</div></div>'
    +'<div style="line-height:1.65;font-size:15px">'+esc(x.m)+'</div>'
    +'<div class="note">'+esc(x.n)+'</div>'
    +'<h2>예문</h2>'+x.e.map(e=>'<div class="ex"><div class="row"><div class="grow"><div class="j">'+esc(e[0])+'</div><div class="y">'+esc(e[1])+'</div><div class="k">'+esc(e[2])+'</div></div>'+spBtn(e[1])+'</div></div>').join('')
    +'<button class="btn full '+(on?'':'mint')+'" style="margin-top:16px" data-a="gtoggle" data-i="'+i+'">'+(on?'✓ 이해했어요 (눌러서 해제)':'이해했어요 체크')+'</button>');
}

/* ---------- 표현 ---------- */
function vRef(){
  const items=window.REF.map(r=>[r.id,r.title]);
  const cur=window.REF.find(r=>r.id===UI.ref)||window.REF[0];
  let h=chips(items,UI.ref,'ref');
  if(cur.rows){
    cur.rows.forEach(g=>{
      h+='<h2>'+esc(g[1])+' <small class="jp">'+esc(g[0])+'</small></h2><div class="card" style="padding:4px 14px">'
        +g[2].map(p=>'<div class="ex"><div class="row"><div class="grow"><div class="j">'+esc(p[0])+'</div><div class="k">'+esc(p[1])+'</div></div>'+spBtn(p[0])+'</div></div>').join('')+'</div>';
    });
  }
  if(cur.tables){
    cur.tables.forEach(t=>{
      h+='<h2>'+esc(t.h)+'</h2><div class="tw"><table class="t"><tr>'+t.cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr>'
        +t.rows.map(r=>'<tr>'+r.map(c=>'<td class="jp">'+esc(c)+'</td>').join('')+'</tr>').join('')+'</table></div>';
    });
    if(cur.id==='num')h+='<div class="note">★ 표시는 읽는 법이 예외인 것들이에요. 4時는 よじ, 7時는 しちじ, 9時는 くじ, 4月는 しがつ, 7月는 しちがつ, 9月는 くがつ!</div>';
  }
  return h;
}

/* ---------- 한자 ---------- */
function vKanji(){
  const kd=K.filter(k=>S.kj[k.c]).length;
  return '<div class="card c-pink"><div class="row"><div class="grow"><b>N5 한자 '+K.length+'자</b><div class="muted">외웠어요 체크 '+kd+'/'+K.length+' · 한국 한자음을 같이 보여줘요</div></div></div>'
    +'<div class="row" style="gap:8px;margin-top:10px"><button class="btn sm grow" data-a="jquiz" data-v="hun">훈음 퀴즈</button><button class="btn sm grow" data-a="jquiz" data-v="read">읽기 퀴즈</button></div></div>'
    +'<div class="kanji-grid">'+K.map((k,i)=>'<button class="jp'+(S.kj[k.c]?' ok':'')+'" data-a="kd" data-i="'+i+'">'+k.c+'</button>').join('')+'</div>';
}
function openKanji(i){
  const k=K[i],on=!!S.kj[k.c];
  openSheet('<div class="hd"><span class="grow muted">한자 '+(i+1)+'/'+K.length+'</span><button class="ibtn" data-a="closeSheet">'+I.x+'</button></div>'
    +'<div class="row"><div class="big-w" style="font-size:84px">'+k.c+'</div><div class="grow" style="padding-left:8px"><div style="font-size:21px;font-weight:700">'+esc(k.h)+'</div>'
    +'<div class="muted" style="margin-top:6px">음독 <b class="jp" style="color:#23262d">'+esc(k.on||'-')+'</b></div><div class="muted">훈독 <b class="jp" style="color:#23262d">'+esc(k.kun||'-')+'</b></div></div></div>'
    +'<h2>이 한자가 들어간 단어</h2>'
    +k.ex.map(e=>'<div class="ex"><div class="row"><div class="grow"><div class="j">'+esc(e.w)+' <span class="y">'+esc(e.r)+'</span></div><div class="k">'+esc(e.m)+'</div></div>'+spBtn(e.r)+'</div></div>').join('')
    +'<button class="btn full '+(on?'':'mint')+'" style="margin-top:16px" data-a="ktoggle" data-i="'+i+'">'+(on?'✓ 외웠어요 (눌러서 해제)':'외웠어요 체크')+'</button>');
}

/* ---------- 연습 허브 ---------- */
function vPractice(){
  const q=UI.pq;
  const F=Object.keys(C.VFORMS).map(k=>[k,C.VFORMS[k]]);
  const AF=Object.keys(C.AFORMS).map(k=>[k,C.AFORMS[k].split(' ')[0]]);
  return '<h2 style="margin-top:6px">단어 퀴즈</h2><div class="card">'
    +'<div class="muted">범위</div>'+chips([['n5','N5'],['n4','N4'],['all','N5+N4']],q.vlv,'pq-vlv')
    +'<div class="muted">유형</div>'+chips([['jk','일본어 → 뜻'],['kj','뜻 → 일본어'],['read','한자 읽기'],['listen','듣기']],q.vmode,'pq-vmode')
    +'<button class="btn pri full" style="margin-top:6px" data-a="vquiz">10문제 시작</button></div>'
    +'<h2>동사·형용사 활용 트레이너</h2><div class="card">'
    +'<div class="muted">대상</div>'+chips([['verb','동사'],['adj','형용사']],q.ctype,'pq-ctype')
    +'<div class="muted">연습할 활용 (여러 개 선택)</div>'+chips(q.ctype==='verb'?F:AF,q.cforms.filter(f=>(q.ctype==='verb'?C.VFORMS:C.AFORMS)[f]),'pq-cform',true)
    +'<div class="muted">범위</div>'+chips([['n5','N5'],['n4','N4'],['all','N5+N4']],q.clv,'pq-clv')
    +'<button class="btn pri full" style="margin-top:6px" data-a="cquiz">10문제 시작</button>'
    +'<div class="muted" style="margin-top:8px;line-height:1.5">정답 뒤에 규칙 힌트가 나와요. 틀린 단어는 자동으로 복습 카드에 들어가요.</div></div>'
    +'<h2>가나 퀴즈</h2><div class="card">'
    +'<div class="muted">문자</div>'+chips([['h','히라가나'],['k','가타카나']],q.kscripts,'pq-ks',true)
    +'<div class="muted">범위</div>'+chips([['basic','기본'],['daku','탁음'],['yoon','요음']],q.ksets,'pq-kset',true)
    +'<div class="muted">방향</div>'+chips([['ka','가나 → 로마자'],['ak','로마자 → 가나']],q.kdir,'pq-kdir')
    +'<button class="btn pri full" style="margin-top:6px" data-a="kquiz" data-v="'+q.kdir+'">10문제 시작</button></div>'
    +'<h2>한자 퀴즈</h2><div class="card"><div class="row" style="gap:8px"><button class="btn butter grow" data-a="jquiz" data-v="hun">훈음 맞추기</button><button class="btn pink grow" data-a="jquiz" data-v="read">단어 읽기</button></div></div>';
}

/* ---------- 플래시카드 ---------- */
let FC=null;
function startSession(lv,extra){
  const d=today();
  const rev=dueList().sort((a,b)=>S.cards[a.k].d-S.cards[b.k].d).slice(0,40);
  const lg=S.log[d]||{n:0};
  const cap=extra?10:Math.max(0,S.newPerDay-lg.n);
  const news=newPool(lv).slice(0,cap);
  const q=rev.concat(news);
  if(!q.length){toast('오늘 할 카드를 다 끝냈어요! 새 단어 +10 버튼으로 더 할 수 있어요');return;}
  FC={q:q,i:0,flip:false,st:[0,0,0,0],sides:{}};
  q.forEach(v=>{FC.sides[v.k]=S.front==='jp'?'jp':(S.front==='ko'?'ko':(Math.random()<.5?'jp':'ko'));});
  drawFC();
}
function drawFC(){
  if(FC.i>=FC.q.length){
    setOv('<div class="ov-top"><b class="grow px" style="font-size:18px">학습 완료</b><button class="ibtn" data-a="closeOv">'+I.x+'</button></div><div class="ov-body">'
      +'<div class="card c-mint" style="text-align:center"><div class="sc">'+FC.q.length+'장</div><div class="muted">오늘 이 세션에서 본 카드</div></div>'
      +'<div class="card"><div class="row"><span class="grow">다시</span><b>'+FC.st[0]+'</b></div><div class="row"><span class="grow">어려움</span><b>'+FC.st[1]+'</b></div><div class="row"><span class="grow">알아요</span><b>'+FC.st[2]+'</b></div><div class="row"><span class="grow">쉬워요</span><b>'+FC.st[3]+'</b></div></div>'
      +'<button class="btn pri full" data-a="closeOv" data-r="1">홈으로</button></div>');
    return;
  }
  const v=FC.q[FC.i],side=FC.sides[v.k],c=S.cards[v.k];
  const kn=v.w===v.r;
  let face;
  if(!FC.flip){
    face=side==='jp'?'<div class="front">'+esc(v.w)+'</div>':'<div class="front ko">'+esc(v.m)+'</div>';
    face+='<div class="hint">탭해서 뒷면 보기</div>';
  }else{
    face='<div class="front">'+esc(v.w)+'</div>'+(kn?'':'<div class="rd">'+esc(v.r)+'</div>')+'<div class="mn">'+esc(v.m)+'</div>';
  }
  let btns='';
  if(FC.flip){
    const lab=['다시','어려움','알아요','쉬워요'];
    btns='<div class="grades">'+lab.map((l,q)=>{const nb=C.srsNext(c,q);return '<button class="g'+q+'" data-a="grade" data-v="'+q+'">'+l+'<small>'+dayLabel(C.srsDays(nb,q))+'</small></button>';}).join('')+'</div>';
  }else btns='<button class="btn pri full" data-a="flip">뒷면 보기</button>';
  setOv('<div class="ov-top"><button class="ibtn" data-a="closeOv">'+I.x+'</button><div class="grow"><div class="bar"><i style="width:'+Math.round(FC.i/FC.q.length*100)+'%"></i></div></div><span class="muted">'+(FC.i+1)+'/'+FC.q.length+'</span></div>'
    +'<div class="ov-body"><div class="fc" data-a="flip"><div class="tag">'+(c?'복습 · '+c.b+'단계':'새 단어')+' · '+CATS[v.c]+'</div>'+face
    +(FC.flip?'<div style="margin-top:18px">'+spBtn(v.r)+'</div>':'')+'</div>'+btns+'</div>');
}

/* ---------- 퀴즈 엔진 ---------- */
let QZ=null;
function startQuiz(title,qs){
  if(!qs.length){toast('문제를 만들 수 없어요');return;}
  QZ={title:title,qs:qs,i:0,score:0,wrong:[],done:false,pick:-1};
  drawQ();
  const q=qs[0];if(q.speak)say(q.speak);
}
function drawQ(){
  if(QZ.i>=QZ.qs.length){
    const n=QZ.qs.length;
    setOv('<div class="ov-top"><b class="grow px" style="font-size:18px">'+esc(QZ.title)+' 결과</b><button class="ibtn" data-a="closeOv">'+I.x+'</button></div><div class="ov-body">'
      +'<div class="card '+(QZ.score>=n*0.8?'c-mint':'c-butter')+'" style="text-align:center"><div class="sc">'+QZ.score+' / '+n+'</div><div class="muted">'+(QZ.score===n?'전부 정답!':(QZ.score>=n*0.8?'좋아요, 거의 다 맞혔어요':'틀린 건 복습 카드에 넣어 뒀어요'))+'</div></div>'
      +(QZ.wrong.length?'<h2>틀린 문제</h2>'+QZ.wrong.map(q=>'<div class="card" style="padding:10px 14px"><div class="jp" style="font-weight:700">'+esc(q.big)+'</div><div class="muted">'+esc(q.ex)+'</div></div>').join(''):'')
      +'<div class="row" style="gap:8px;margin-top:6px"><button class="btn grow" data-a="closeOv">닫기</button><button class="btn pri grow" data-a="qagain">다시 하기</button></div></div>');
    return;
  }
  const q=QZ.qs[QZ.i],ans=QZ.pick>=0;
  const ch=q.ch.map((c,i)=>{
    let cls='choice'+(q.jpCh?' jp-ch':'');
    if(ans){if(i===q.a)cls+=' right';else if(i===QZ.pick)cls+=' wrong';}
    return '<button class="'+cls+'" data-a="pick" data-v="'+i+'"'+(ans?' disabled':'')+'><span class="no">'+(i+1)+'</span><span class="tx"><span>'+esc(c.t)+'</span>'+(c.s?'<small>'+esc(c.s)+'</small>':'')+'</span></button>';}).join('');
  setOv('<div class="ov-top"><button class="ibtn" data-a="closeOv">'+I.x+'</button><div class="grow"><div class="bar"><i style="width:'+Math.round(QZ.i/QZ.qs.length*100)+'%"></i></div></div><span class="muted">'+(QZ.i+1)+'/'+QZ.qs.length+'</span></div>'
    +'<div class="ov-body"><div class="q-prompt"><div class="big'+(q.ko?' ko':'')+'">'+esc(q.big)+'</div>'+(q.sub?'<div class="sub">'+esc(q.sub)+'</div>':'')
    +(q.speak?'<div style="margin-top:10px">'+spBtn(q.speak)+'</div>':'')+'</div><div class="choices">'+ch+'</div>'
    +(ans?'<div class="fb">'+(QZ.pick===q.a?'<b>정답!</b> ':'<b>아쉬워요.</b> ')+esc(q.ex)+(q.hint?'<div class="muted" style="margin-top:6px">'+esc(q.hint)+'</div>':'')+'</div><button class="btn pri full" style="margin-top:14px" data-a="qnext">'+(QZ.i+1>=QZ.qs.length?'결과 보기':'다음')+'</button>':'')+'</div>');
}
function answerQ(i){
  if(QZ.pick>=0)return;
  const q=QZ.qs[QZ.i];QZ.pick=i;
  if(i===q.a){QZ.score++;if(q.kana)S.kana[q.kana]=(S.kana[q.kana]||0)+1;}
  else{QZ.wrong.push(q);if(q.vk){S.cards[q.vk]={b:0,d:today()};}if(q.kana)S.kana[q.kana]=0;}
  bump('q');save();drawQ();
}
function pickDistractors(correct,pool,keyFn,n){
  const used=new Set([keyFn(correct)]),out=[];
  for(const x of shuffle(pool)){const k=keyFn(x);if(used.has(k))continue;used.add(k);out.push(x);if(out.length>=n)break;}
  return out;
}
function mkChoices(correctObj,distObjs){
  const all=shuffle([correctObj].concat(distObjs));
  return {ch:all,a:all.indexOf(correctObj)};
}

/* 단어 퀴즈 */
function buildVocabQuiz(lv,mode){
  let pool=V.filter(v=>lv==='all'||v.lv===lv);
  if(mode==='read')pool=pool.filter(v=>hasKanji(v.w)&&v.c!=='num');
  const items=shuffle(pool).slice(0,10);
  return items.map(v=>{
    const same=V.filter(x=>x.k!==v.k&&x.c===v.c),rest=V.filter(x=>x.k!==v.k&&x.c!==v.c);
    const cand=same.length>=8?same:same.concat(shuffle(rest).slice(0,20));
    const ex=v.w+(v.w!==v.r?'('+v.r+')':'')+' = '+v.m;
    if(mode==='jk'||mode==='listen'){
      const d=pickDistractors(v,cand,x=>x.m,3).map(x=>({t:x.m})),m=mkChoices({t:v.m},d);
      return {big:mode==='listen'?'듣기':v.w,sub:mode==='listen'?'들리는 단어의 뜻은?':'뜻은?',speak:mode==='listen'?v.r:null,ch:m.ch,a:m.a,ex:ex,vk:v.k};
    }
    if(mode==='kj'){
      const d=pickDistractors(v,cand,x=>x.w,3).map(x=>({t:x.w,s:x.w!==x.r?x.r:''})),m=mkChoices({t:v.w,s:v.w!==v.r?v.r:''},d);
      return {big:v.m,ko:true,sub:'일본어로 하면?',ch:m.ch,a:m.a,ex:ex,vk:v.k,jpCh:true};
    }
    const kc=V.filter(x=>x.k!==v.k&&hasKanji(x.w)&&x.r!==v.r);
    kc.sort((p,q)=>Math.abs(p.r.length-v.r.length)-Math.abs(q.r.length-v.r.length)+(Math.random()-.5));
    const d=pickDistractors(v,kc.slice(0,14),x=>x.r,3).map(x=>({t:x.r})),m=mkChoices({t:v.r},d);
    return {big:v.w,sub:'읽는 법은? (뜻: '+v.m+')',ch:m.ch,a:m.a,ex:ex,vk:v.k,jpCh:true};
  });
}
/* 활용 퀴즈 */
function buildConjQuiz(type,forms,lv){
  const pool=V.filter(v=>(lv==='all'||v.lv===lv)&&(type==='verb'?v.c==='verb':(v.c==='iadj'||v.c==='naadj')));
  const valid=forms.filter(f=>(type==='verb'?C.VFORMS:C.AFORMS)[f]);
  if(!valid.length){toast('활용을 하나 이상 골라 주세요');return [];}
  return shuffle(pool).slice(0,10).map(v=>{
    const f=valid[rnd(valid.length)];
    const aw=type==='verb'?C.conjVerb(v.w,v.r,v.g,f):C.conjAdj(v.w,v.c,f);
    const ar=type==='verb'?C.conjVerb(v.r,v.r,v.g,f):C.conjAdj(v.r,v.c,f);
    const wr=C.wrongPairs(v,f,aw),d=shuffle(wr).slice(0,3).map(x=>({t:x.t,s:x.t!==x.s?x.s:''}));
    const m=mkChoices({t:aw,s:aw!==ar?ar:''},d);
    const lbl=type==='verb'?C.VFORMS[f]:C.AFORMS[f];
    const gr=type==='verb'?(v.g===3?'3그룹(불규칙)':v.g+'그룹'):(v.c==='iadj'?'い형용사':'な형용사');
    const hint=type==='verb'?C.HINT[f][v.g]:C.AHINT[v.c][f];
    return {big:v.w,sub:(v.w!==v.r?v.r+' · ':'')+v.m+' ('+gr+') → '+lbl+'은?',ch:m.ch,a:m.a,jpCh:true,
      ex:v.w+' → '+aw+(aw!==ar?' ('+ar+')':''),hint:'규칙: '+hint,vk:v.k};
  });
}
/* 가나 퀴즈 */
function buildKanaQuiz(dir,scripts,sets){
  const bad=['ぢ','づ','ヂ','ヅ'];
  let pool=[];
  scripts.forEach(sc=>sets.forEach(st=>{const src=st==='basic'?window.HIRA_BASIC:(st==='daku'?window.HIRA_DAKU:window.HIRA_YOON);
    src.filter(Boolean).forEach(a=>pool.push({c:sc==='k'?C.toKata(a[0]):a[0],r:a[1]}));}));
  pool=pool.filter(x=>!bad.includes(x.c));
  if(pool.length<5){toast('범위를 더 골라 주세요');return [];}
  return shuffle(pool).slice(0,10).map(x=>{
    const cand=pool.filter(p=>p.c!==x.c&&p.r!==x.r);
    if(dir==='ka'){
      const d=pickDistractors(x,cand,p=>p.r,3).map(p=>({t:p.r})),m=mkChoices({t:x.r},d);
      return {big:x.c,sub:'로마자로는?',speak:x.c,ch:m.ch,a:m.a,ex:x.c+' = '+x.r,kana:x.c};
    }
    const d=pickDistractors(x,cand,p=>p.c,3).map(p=>({t:p.c})),m=mkChoices({t:x.c},d);
    return {big:x.r,sub:'알맞은 가나는?',ch:m.ch,a:m.a,ex:x.c+' = '+x.r,jpCh:true,kana:x.c};
  });
}
/* 한자 퀴즈 */
function buildKanjiQuiz(mode){
  return shuffle(K).slice(0,10).map(k=>{
    if(mode==='hun'){
      const d=pickDistractors(k,K.filter(x=>x.c!==k.c),x=>x.h,3).map(x=>({t:x.h})),m=mkChoices({t:k.h},d);
      return {big:k.c,sub:'훈음은?',ch:m.ch,a:m.a,ex:k.c+' = '+k.h+' (음독 '+k.on+' / 훈독 '+(k.kun||'-')+')'};
    }
    const e=k.ex[rnd(k.ex.length)];
    const rd=[];K.forEach(x=>x.ex.forEach(y=>{if(y.r!==e.r&&y.w!==e.w)rd.push(y);}));
    rd.sort((p,q)=>Math.abs(p.r.length-e.r.length)-Math.abs(q.r.length-e.r.length)+(Math.random()-.5));
    const d=pickDistractors(e,rd.slice(0,16),y=>y.r,3).map(y=>({t:y.r})),m=mkChoices({t:e.r},d);
    return {big:e.w,sub:'읽는 법은? (뜻: '+e.m+')',ch:m.ch,a:m.a,jpCh:true,ex:e.w+'('+e.r+') = '+e.m+' · '+k.c+' '+k.h};
  });
}

/* ---------- 설정 ---------- */
function fontList(list,key,sample){
  return list.map(f=>'<button class="fopt'+((S[key]===f.id||(!list.some(x=>x.id===S[key])&&f===list[0]))?' on':'')+'" data-a="font" data-k="'+key+'" data-v="'+f.id+'"><span class="grow"><div class="sp-t" style="font-family:'+(f.fam||("'"+f.id+"'"))+',sans-serif">'+sample+'</div><div class="sm">'+esc(f.l)+' · '+esc(f.t)+'</div></span><span class="ck"></span></button>').join('');
}
function openSettings(){
  FONTS_UI.concat(FONTS_JP).forEach(ensureFont);
  openSheet('<div class="hd"><b class="grow px" style="font-size:18px">설정</b><button class="ibtn" data-a="closeSheet">'+I.x+'</button></div>'
    +'<div class="muted">하루 새 단어 수</div>'+chips([[5,'5'],[10,'10'],[15,'15'],[20,'20'],[30,'30']].map(x=>[String(x[0]),x[1]+'개']),String(S.newPerDay),'set-new')
    +'<div class="muted">하루 목표 카드 수</div>'+chips([['10','10장'],['20','20장'],['30','30장'],['50','50장']],String(S.goal),'set-goal')
    +'<div class="muted">카드 앞면</div>'+chips([['jp','일본어'],['ko','한국어'],['mix','섞기']],S.front,'set-front')
    +'<div class="muted">음성 속도</div>'+chips([['0.7','느리게'],['0.9','보통'],['1.1','빠르게']],String(S.rate),'set-rate')
    +'<h2>글꼴</h2><div class="muted">화면 글꼴 (한국어)</div><div style="margin-top:8px">'+fontList(FONTS_UI,'fUI','일어 독학 · 오늘의 학습 12/20')+'</div>'
    +'<div class="muted" style="margin-top:14px">일본어 글꼴 (단어·예문)</div><div style="margin-top:8px">'+fontList(FONTS_JP,'fJP','日本語 ひらがな カタカナ 勉強')+'</div>'
    +'<h2>백업·복원</h2><div class="muted" style="line-height:1.5">아래 코드를 복사해 메모장 등에 저장해 두면, 다른 기기나 새 브라우저에서 붙여넣어 복원할 수 있어요.</div>'
    +'<textarea class="bk" id="bk" readonly>'+esc(exportCode())+'</textarea>'
    +'<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm grow" data-a="bk-copy">코드 복사</button><button class="btn sm grow" data-a="bk-sel">전체 선택</button></div>'
    +'<div class="muted" style="margin-top:12px">복원할 코드 붙여넣기</div><textarea class="bk" id="bk-in" placeholder="여기에 붙여넣기"></textarea>'
    +'<button class="btn sm butter full" style="margin-top:8px" data-a="bk-load">복원하기</button>'
    +'<h2>초기화</h2><button class="btn red full" data-a="reset">공부 기록 전부 지우기</button>');
}
function exportCode(){try{return btoa(unescape(encodeURIComponent(JSON.stringify(S))));}catch(e){return '';}}
function importCode(s){
  try{
    const o=JSON.parse(decodeURIComponent(escape(atob(s.trim()))));
    if(!o||typeof o.cards!=='object')throw 0;
    S=Object.assign({},DEF,o);save();return true;
  }catch(e){return false;}
}

/* ---------- 렌더 ---------- */
function renderTabs(){
  $('#tabs').innerHTML=TABS.map(t=>'<button class="'+(UI.tab===t[0]?'on':'')+'" data-a="tab" data-v="'+t[0]+'"><b>'+t[1]+'</b><span>'+t[2]+'</span></button>').join('');
}
function render(keepScroll){
  const main=$('#view'),st=main.scrollTop;
  const fn={home:vHome,kana:vKana,vocab:vVocab,grammar:vGrammar,kanji:vKanji,practice:vPractice}[UI.tab];
  main.innerHTML=fn();
  main.scrollTop=keepScroll?st:0;
  renderTabs();
}

/* ---------- 이벤트 ---------- */
const H={
 tab(el){UI.tab=el.dataset.v;render();},
 say(el){say(el.dataset.t);},
 settings(){openSettings();},
 closeSheet(){closeSheet();},
 closeOv(el){closeOv();FC=null;QZ=null;render(true);},
 kset(el){UI.kset=el.dataset.v;render(true);},
 vlv(el){UI.vlv=el.dataset.v;UI.vcat='all';render();},
 vcat(el){UI.vcat=el.dataset.v;render(true);},
 vd(el){openWord(+el.dataset.i);},
 cardreset(el){const v=V[+el.dataset.i];delete S.cards[v.k];save();closeSheet();render(true);toast('초기화했어요');},
 cardknown(el){const v=V[+el.dataset.i];S.cards[v.k]={b:5,d:today()+14};save();closeSheet();render(true);toast('외운 단어로 표시했어요');},
 session(el){startSession(el.dataset.v,!!el.dataset.x);},
 flip(){if(!FC)return;FC.flip=!FC.flip;drawFC();if(FC.flip&&S.auto)say(FC.q[FC.i].r);},
 grade(el){
   const q=+el.dataset.v,v=FC.q[FC.i],c=S.cards[v.k],isNew=!c;
   const b=C.srsNext(c,q);S.cards[v.k]={b:b,d:today()+C.srsDays(b,q)};
   FC.st[q]++;bump(isNew?'n':'r');
   if(q===0)FC.q.push(v);
   FC.i++;FC.flip=false;drawFC();
 },
 glv(el){UI.glv=el.dataset.v;render();},
 gd(el){openGrammar(+el.dataset.i);},
 gtoggle(el){const g=UI.glv,x=G[g][+el.dataset.i],k=g+':'+x.t;if(S.gdone[k])delete S.gdone[k];else S.gdone[k]=1;save();openGrammar(+el.dataset.i);render(true);},
 ref(el){UI.ref=el.dataset.v;render(true);},
 kd(el){openKanji(+el.dataset.i);},
 ktoggle(el){const k=K[+el.dataset.i];if(S.kj[k.c])delete S.kj[k.c];else S.kj[k.c]=1;save();openKanji(+el.dataset.i);render(true);},
 'pq-vlv'(el){UI.pq.vlv=el.dataset.v;render(true);},
 'pq-vmode'(el){UI.pq.vmode=el.dataset.v;render(true);},
 'pq-ctype'(el){UI.pq.ctype=el.dataset.v;UI.pq.cforms=el.dataset.v==='verb'?['te','nai','ta','masu']:['neg','past','te'];render(true);},
 'pq-cform'(el){const a=UI.pq.cforms,v=el.dataset.v,i=a.indexOf(v);if(i>=0)a.splice(i,1);else a.push(v);render(true);},
 'pq-clv'(el){UI.pq.clv=el.dataset.v;render(true);},
 'pq-ks'(el){const a=UI.pq.kscripts,v=el.dataset.v,i=a.indexOf(v);if(i>=0){if(a.length>1)a.splice(i,1);}else a.push(v);render(true);},
 'pq-kset'(el){const a=UI.pq.ksets,v=el.dataset.v,i=a.indexOf(v);if(i>=0){if(a.length>1)a.splice(i,1);}else a.push(v);render(true);},
 'pq-kdir'(el){UI.pq.kdir=el.dataset.v;render(true);},
 vquiz(){const q=UI.pq;QZ_CFG=['v'];startQuiz('단어 퀴즈',buildVocabQuiz(q.vlv,q.vmode));},
 cquiz(){const q=UI.pq;QZ_CFG=['c'];startQuiz('활용 트레이너',buildConjQuiz(q.ctype,q.cforms,q.clv));},
 kquiz(el){const q=UI.pq;QZ_CFG=['k',el.dataset.v];startQuiz('가나 퀴즈',buildKanaQuiz(el.dataset.v||q.kdir,UI.tab==='kana'?[UI.kset]:q.kscripts,UI.tab==='kana'?['basic','daku']:q.ksets));},
 jquiz(el){QZ_CFG=['j',el.dataset.v];startQuiz('한자 퀴즈',buildKanjiQuiz(el.dataset.v));},
 pick(el){answerQ(+el.dataset.v);},
 qnext(){QZ.i++;QZ.pick=-1;drawQ();if(QZ.i<QZ.qs.length){const q=QZ.qs[QZ.i];if(q.speak)say(q.speak);}},
 qagain(){const c=QZ_CFG,q=UI.pq;
   if(c[0]==='v')startQuiz('단어 퀴즈',buildVocabQuiz(q.vlv,q.vmode));
   else if(c[0]==='c')startQuiz('활용 트레이너',buildConjQuiz(q.ctype,q.cforms,q.clv));
   else if(c[0]==='k')startQuiz('가나 퀴즈',buildKanaQuiz(c[1]||q.kdir,UI.tab==='kana'?[UI.kset]:q.kscripts,UI.tab==='kana'?['basic','daku']:q.ksets));
   else startQuiz('한자 퀴즈',buildKanjiQuiz(c[1]));},
 font(el){S[el.dataset.k]=el.dataset.v;save();applyFonts();el.parentElement.querySelectorAll('.fopt').forEach(b=>b.classList.toggle('on',b===el));},
 'set-new'(el){S.newPerDay=+el.dataset.v;save();openSettings();render(true);},
 'set-goal'(el){S.goal=+el.dataset.v;save();openSettings();render(true);},
 'set-front'(el){S.front=el.dataset.v;save();openSettings();},
 'set-rate'(el){S.rate=+el.dataset.v;save();openSettings();say('こんにちは');},
 'bk-sel'(){const t=$('#bk');if(t){t.focus();t.select();}},
 'bk-copy'(){const t=$('#bk');try{navigator.clipboard.writeText(t.value).then(()=>toast('복사했어요'),()=>{t.select();toast('길게 눌러서 복사해 주세요');});}catch(e){t.select();toast('길게 눌러서 복사해 주세요');}},
 'bk-load'(){const t=$('#bk-in');if(t&&importCode(t.value)){closeSheet();render();toast('복원했어요');}else toast('코드가 올바르지 않아요');},
 reset(el){
   if(el.dataset.c!=='1'){el.dataset.c='1';el.textContent='정말 지울까요? 한 번 더 누르면 지워져요';return;}
   S=Object.assign({},DEF,{cards:{},log:{},streak:{last:0,count:0},kana:{},kj:{},gdone:{}});save();closeSheet();render();toast('초기화했어요');
 }
};
let QZ_CFG=['v'];
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]');if(!el)return;
  const f=H[el.dataset.a];if(f)f(el);
});
document.addEventListener('input',e=>{
  if(e.target.id==='vsearch'){UI.vq=e.target.value;const l=$('#vlist');if(l)l.innerHTML=vocabRows();}
});
applyFonts();
render();
})();
