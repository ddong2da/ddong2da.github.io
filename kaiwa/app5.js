/* 일어 회화 — 5) 자유 대화 · 표현 사전 */
(function(){
'use strict';
const KC=window.KC,KA=window.KA,esc=KA.esc,$=KA.$,I=KA.I,H=KA.H,UI=KA.UI;
const FREE=KA.FREE,EXPR=window.EXPR||[],EXALL=KA.EXALL;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BYKEY={};EXALL.forEach(x=>{BYKEY[x.key]=x;});
let FR=null;
(KA.hooks=KA.hooks||[]).push(()=>{if(FR&&FR.listening){FR.listening=false;FR.h=null;drawFRDock();}});

/* ---------- 자유 대화 ---------- */
function openFreeSheet(i){
  const t=FREE[i];if(!t)return;
  KA.openSheet('<div class="hd"><span class="grow muted">'+KA.lvTag(t.lv)+' <span style="margin-left:.3rem">자유 대화</span></span><button class="ibtn" data-a="closeSheet">'+I.x+'</button></div>'
   +'<div class="big-w">'+esc(t.t)+'</div><div class="muted" style="margin-top:.2rem">'+esc(t.k)+'</div>'
   +'<div class="note b">상대가 '+t.steps.length+'가지를 차례로 물어봐요. 정해진 정답은 없으니 생각나는 대로 대답해 보세요. 막히면 아래 표현을 써 보세요.</div>'
   +'<h2>쓸 만한 표현</h2><div class="kpl">'+t.kp.map(p=>'<button data-a="say" data-t="'+esc(p[0])+'">'+esc(p[0])+'<small>'+esc(p[1])+'</small></button>').join('')+'</div>'
   +'<button class="btn pri full" style="margin-top:1rem" data-a="free-go" data-i="'+i+'">대화 시작</button>');
}
function frMsg(m,i){
  const showKo=FR.ko||FR.open[i];
  if(m.who==='pt'){
    return '<div class="msg pt"><div class="av jp">話</div><div class="bub"><div class="j">'+esc(m.ja)+'</div>'+(showKo?'<div class="k">'+esc(m.ko)+'</div>':'')
      +'<div class="acts">'+KA.spBtn(m.ja,'sm')+((!showKo&&KA.S.tr==='tap')?'<button class="lnk" data-a="fr-open" data-i="'+i+'">뜻 보기</button>':'')+'</div></div></div>';
  }
  return '<div class="msg me"><div class="bub"><div class="j">'+esc(m.ja)+'</div></div></div>';
}
function frDock(){
  if(FR.phase==='run')return '<div class="mrow"><div class="mtx"><div class="a">상대의 말을 듣고 있어요</div></div><button class="btn sm" data-a="cv-skip">소리 건너뛰기</button></div>';
  if(FR.phase!=='user')return '';
  const st=FR.t.steps[FR.i];
  let h='<div class="dscroll"><div class="tip"><b>'+esc(st.hint)+'</b></div><div class="kpl">'+FR.t.kp.map(p=>'<button data-a="say" data-t="'+esc(p[0])+'">'+esc(p[0])+'<small>'+esc(p[1])+'</small></button>').join('')+'</div></div>';
  if(FR.typed||!KC.srOk){
    h+='<div class="row" style="gap:.5rem"><input class="field grow" id="fr-in" placeholder="일본어로 입력" autocomplete="off" autocapitalize="off"><button class="btn pri sm" data-a="fr-send">보내기</button></div>'
      +(KC.srOk?'<button class="btn sm" data-a="fr-type">마이크로 말하기</button>':'');
  }else{
    const lis=FR.listening;
    h+='<div class="mrow"><button class="mic'+(lis?' on':'')+'" data-a="fr-mic" aria-label="말하기">'+(lis?I.stop:I.mic)+'</button><div class="mtx"><div class="a">'+(lis?'듣고 있어요':'눌러서 말하세요')+'</div><div class="b" id="fr-itx">'+esc(lis?FR.interim:(FR.err||'생각나는 대로 자유롭게'))+'</div></div><button class="btn sm" data-a="fr-type">글자로 입력</button></div>';
  }
  return h;
}
function drawFR(keepInput){
  if(!FR)return;
  const pct=Math.round(FR.i/FR.t.steps.length*100);
  const chat=FR.msgs.map(frMsg).join('')+(FR.typing?'<div class="msg pt"><div class="av jp">話</div><div class="bub"><span class="typing"><i></i><i></i><i></i></span></div></div>':'');
  KA.setOv('<div class="ov-top"><button class="ibtn" data-a="fr-close" aria-label="닫기">'+I.x+'</button><div class="grow"><div class="jp px" style="font-size:.95rem;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(FR.t.t)+'</div><div class="bar" style="margin-top:.35rem"><i style="width:'+pct+'%"></i></div></div>'
    +'<button class="ibtn" data-a="fr-ko" aria-label="번역"><b class="jp" style="font-size:1.05rem;'+(FR.ko?'color:var(--ac)':'')+'">訳</b></button></div>'
    +'<div class="chat" id="chat">'+chat+'</div><div class="dock">'+frDock()+'</div>');
  const c=$('#chat');if(c)c.scrollTop=c.scrollHeight;
}
function drawFRDock(){const d=$('.dock');if(d)d.innerHTML=frDock();}
async function frPush(ja,ko,my){
  FR.typing=true;drawFR();await sleep(420);if(!FR||FR.tok!==my)return;
  FR.typing=false;FR.msgs.push({who:'pt',ja:ja,ko:ko});drawFR();
  if(KA.S.voice){const t0=Date.now();await KA.say(ja);if(Date.now()-t0<450)await sleep(450);}else await sleep(300);
}
async function runFR(){
  const my=FR.tok;
  if(FR.i>=FR.t.steps.length){
    FR.phase='run';await frPush(FR.t.end[0],FR.t.end[1],my);if(!FR||FR.tok!==my)return;
    finishFR();return;
  }
  const st=FR.t.steps[FR.i];
  FR.phase='run';await frPush(st.q[0],st.q[1],my);if(!FR||FR.tok!==my)return;
  FR.phase='user';FR.err='';FR.interim='';FR.listening=false;drawFR();
  if(KA.S.auto&&KC.srOk&&!FR.typed)frMic();
}
async function frAnswer(text){
  const my=FR.tok,st=FR.t.steps[FR.i];
  KC.stopListen();KC.stopSay();FR.listening=false;
  FR.msgs.push({who:'me',ja:text});FR.said.push(text);KA.bump('s');
  FR.phase='run';drawFR();
  let r=st.d;
  for(const k of st.kw){if(KC.hasKw(text,k[0])){r=[k[1],k[2]];break;}}
  await sleep(250);if(!FR||FR.tok!==my)return;
  await frPush(r[0],r[1],my);if(!FR||FR.tok!==my)return;
  FR.i++;runFR();
}
function frMic(){
  if(!FR||FR.phase!=='user'||!KC.srOk)return;
  KC.stopSay();
  const my=FR.tok,idx=FR.i;
  FR.listening=true;FR.interim='';FR.err='';drawFRDock();
  FR.h=KC.listen({
    interim:t=>{if(!FR||FR.tok!==my)return;FR.interim=t;const el=$('#fr-itx');if(el)el.textContent=t;},
    end:(alts,err)=>{
      if(!FR||FR.tok!==my||FR.i!==idx)return;
      FR.listening=false;FR.h=null;
      if(!alts.length){FR.err=KC.errText(err);drawFRDock();return;}
      frAnswer(alts[0]);
    }
  });
}
function finishFR(){
  const t=FR.t,S=KA.S,r=S.free[t.id]||{n:0};
  r.n++;r.last=KA.today();S.free[t.id]=r;KA.bump('t');KA.save();
  FR.phase='end';
  const rows=FR.said.map(s=>'<div class="rrow"><span class="dt g2"></span><div class="grow"><div class="j">'+esc(s)+'</div></div></div>').join('');
  KA.setOv('<div class="ov-top"><b class="grow px" style="font-size:1.05rem">대화 완료</b><button class="ibtn" data-a="fr-close">'+I.x+'</button></div>'
    +'<div class="ov-body"><div class="card c-blue"><div class="jp px" style="text-align:center">'+esc(t.t)+'</div><div class="muted" style="text-align:center;margin-top:.3rem">끝까지 이야기를 이어 갔어요. 수고하셨어요.</div></div>'
    +'<h2>내가 한 말</h2><div class="card">'+(rows||'<div class="muted">없음</div>')+'</div>'
    +'<h2>다음에 써 볼 표현</h2><div class="kpl">'+t.kp.map(p=>'<button data-a="say" data-t="'+esc(p[0])+'">'+esc(p[0])+'<small>'+esc(p[1])+'</small></button>').join('')+'</div>'
    +'<div class="row" style="gap:.5rem;margin-top:1rem"><button class="btn grow" data-a="fr-close">닫기</button><button class="btn pri grow" data-a="fr-again">다시 하기</button></div></div>');
}
function startFree(t){
  FR={t:t,i:0,msgs:[],said:[],tok:Date.now()+Math.random(),phase:'run',listening:false,interim:'',err:'',typed:false,typing:false,ko:KA.S.tr==='on',open:{},h:null};
  drawFR();
  KA.onClose=()=>{if(FR)FR.tok=0;FR=null;KA.render(true);};
  runFR();
}
H['free-open']=el=>openFreeSheet(+el.dataset.i);
H['free-go']=el=>{const t=FREE[+el.dataset.i];KA.closeSheet();if(t)startFree(t);};
H['fr-close']=()=>KA.closeOv();
H['fr-again']=()=>{if(FR)startFree(FR.t);};
H['fr-ko']=()=>{if(!FR)return;FR.ko=!FR.ko;drawFR();};
H['fr-open']=el=>{if(!FR)return;FR.open[+el.dataset.i]=true;drawFR();};
H['fr-mic']=()=>{if(!FR||FR.phase!=='user')return;if(FR.listening){if(FR.h)FR.h.stop();return;}frMic();};
H['fr-type']=()=>{if(!FR||FR.phase!=='user')return;KC.stopListen();FR.listening=false;FR.typed=!FR.typed;drawFRDock();const i=$('#fr-in');if(i)i.focus();};
H['fr-send']=()=>{
  if(!FR||FR.phase!=='user')return;
  const i=$('#fr-in'),v=i?i.value.trim():'';
  if(!v){KA.toast('내용을 입력해 주세요');return;}
  frAnswer(v);
};

/* ---------- 표현 사전 ---------- */
UI.eg=null;UI.eq='';
const speakable=e=>String(e).split(/[／\/]/)[0].replace(/[〜~]/g,'').replace(/\(.*?\)/g,'');
function back(title){
  return '<div class="row" style="margin:.2rem 0 .6rem"><button class="ibtn" data-a="eg" data-v="" aria-label="뒤로">'+I.back+'</button><b class="px grow" style="font-size:1.05rem">'+esc(title)+'</b></div>';
}
function eRow(it){
  const on=KA.S.fav[it.key];
  return '<div class="erow" data-a="ex-open" data-k="'+it.key+'" role="button"><div class="grow"><div class="w">'+esc(it.e)+(it.r?' <span class="rd">'+esc(it.r)+'</span>':'')+'</div><div class="m">'+esc(it.m)+'</div></div><span class="tg">'+KA.lvTag(it.lv)+'</span>'
    +'<button class="star'+(on?' on':'')+'" data-a="fav" data-k="'+it.key+'" aria-label="즐겨찾기">'+I.star+'</button></div>';
}
function searchRows(){
  const q=UI.eq.trim();if(!q)return '';
  const qf=KC.flat(q),ql=q.toLowerCase();
  const r=EXALL.filter(x=>(qf&&(KC.flat(x.e).indexOf(qf)>=0||KC.flat(x.r||'').indexOf(qf)>=0))||x.m.toLowerCase().indexOf(ql)>=0||(x.n||'').toLowerCase().indexOf(ql)>=0).slice(0,60);
  return r.length?r.map(eRow).join(''):'<div class="empty">찾는 표현이 없어요</div>';
}
function groupList(){
  const nf=Object.keys(KA.S.fav).length;
  return '<div class="btn2" style="margin:.7rem 0"><button class="btn blue" data-a="eg" data-v="keigo">경어표 · 敬語</button><button class="btn blue" data-a="eg" data-v="fav">내 표현 · '+nf+'</button></div>'
    +EXPR.map((g,i)=>'<button class="sitem" data-a="eg" data-v="'+g.id+'"><span class="n jp">'+(i+1)+'</span><span class="grow"><div class="t">'+esc(g.t)+'</div><div class="s">'+esc(g.k)+' · '+g.items.length+'개</div></span>'+I.chev+'</button>').join('');
}
function keigoView(){
  const K=window.KEIGO||[],P=window.KPAT||[];
  const kg=(l,v)=>v&&v!=='—'?'<div class="kgr"><span class="kl">'+l+'</span><button class="kv" data-a="say" data-t="'+esc(speakable(v))+'">'+esc(v)+'</button></div>':'';
  return back('경어표 · 敬語')
    +'<div class="note b">존경어는 상대의 동작을 높이고, 겸양어는 내 동작을 낮춰요. 말하는 사람이 누구의 행동인지만 구별하면 돼요. 일본어를 눌러서 소리를 들을 수 있어요.</div>'
    +'<h2>기본 틀</h2>'+P.map(p=>'<div class="card"><div class="px jp" style="font-size:1rem">'+esc(p.t)+'</div><div class="muted">'+esc(p.k)+'</div>'
      +'<div style="margin-top:.4rem">'+p.ex.map(x=>'<div class="ex" style="padding:.4rem 0"><div class="j">'+esc(x[0])+'</div><div class="k">'+esc(x[1])+'</div></div>').join('')+'</div><div class="muted" style="margin-top:.2rem">'+esc(p.n)+'</div></div>').join('')
    +'<h2>동사별 경어 <small>'+K.length+'개</small></h2>'+K.map(k=>'<div class="card"><div class="row"><div class="grow"><div class="px jp" style="font-size:1.05rem">'+esc(k.p)+'</div><div class="muted">'+esc(k.ko)+'</div></div>'+KA.lvTag(k.lv)+'</div>'
      +kg('존경',k.s)+kg('겸양',k.h)+kg('정중',k.t)+(k.n?'<div class="muted" style="margin-top:.4rem">'+esc(k.n)+'</div>':'')+'</div>').join('');
}
KA.vExpr=function(){
  const S=KA.S;
  if(UI.eg==='keigo')return keigoView();
  if(UI.eg==='fav'){
    const l=EXALL.filter(x=>S.fav[x.key]);
    return back('내 표현')+(l.length?l.map(eRow).join(''):'<div class="empty">별표를 누르면 여기에 모여요</div>');
  }
  if(UI.eg){
    const g=EXPR.find(x=>x.id===UI.eg);
    if(g)return back(g.t)+'<div class="muted" style="margin-bottom:.6rem;line-height:1.6">'+esc(g.d)+'</div>'+g.items.map((it,i)=>eRow(BYKEY[g.id+':'+i])).join('');
  }
  return '<input class="search" id="eq" placeholder="표현이나 뜻으로 찾기" value="'+esc(UI.eq)+'" autocomplete="off"><div id="eres">'+(UI.eq.trim()?searchRows():groupList())+'</div>';
};
function openExpr(key){
  const it=BYKEY[key];if(!it)return;
  const on=KA.S.fav[key];
  KA.openSheet('<div class="hd"><span class="grow muted">'+KA.lvTag(it.lv)+' <span style="margin-left:.3rem">'+esc(it.gt)+'</span></span><button class="ibtn" data-a="closeSheet">'+I.x+'</button></div>'
   +'<div class="row" style="align-items:flex-start"><div class="grow"><div class="big-w">'+esc(it.e)+'</div>'+(it.r?'<div class="rd">'+esc(it.r)+'</div>':'')+'</div>'+KA.spBtn(speakable(it.e))
   +'<button class="star'+(on?' on':'')+'" data-a="fav" data-k="'+key+'" aria-label="즐겨찾기">'+I.star+'</button></div>'
   +'<div style="font-weight:700;margin:.6rem 0 .2rem">'+esc(it.m)+'</div><div class="note b">'+esc(it.n)+'</div>'
   +'<h2>예문</h2>'+it.ex.map(x=>'<div class="ex"><div class="row"><div class="grow"><div class="j">'+esc(KA.fill(x[0]))+'</div><div class="k">'+esc(x[1])+'</div></div>'+KA.spBtn(x[0])+'</div></div>').join('')
   +'<button class="btn pri full" style="margin-top:.8rem" data-a="ex-shadow" data-k="'+key+'">예문 따라 말하기</button>');
}
H['ex-open']=el=>openExpr(el.dataset.k);
H['ex-shadow']=el=>{const it=BYKEY[el.dataset.k];if(!it)return;KA.closeSheet();KA.startSession('shadow',it.ex.map(x=>({ja:x[0],ko:x[1]})));};
H.eg=el=>{UI.eg=el.dataset.v||null;KA.render();};
H.fav=el=>{
  const k=el.dataset.k,S=KA.S;
  if(S.fav[k])delete S.fav[k];else S.fav[k]=1;
  KA.save();
  if(KA.sheetEl())openExpr(k);
  KA.render(true);
};
document.addEventListener('input',e=>{
  if(e.target.id==='eq'){UI.eq=e.target.value;const r=$('#eres');if(r)r.innerHTML=UI.eq.trim()?searchRows():groupList();}
});
})();
