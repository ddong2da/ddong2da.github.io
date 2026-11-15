/* 일어 회화 — 3) 대화 (상대와 말 주고받기) */
(function(){
'use strict';
const KC=window.KC,KA=window.KA,esc=KA.esc,$=KA.$,I=KA.I,H=KA.H;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let CV=null;
KA.cv=()=>CV;
(KA.hooks=KA.hooks||[]).push(()=>{if(CV&&CV.listening){CV.listening=false;CV.h=null;drawDock();}});

function msgHtml(m,i){
  if(m.who==='tip')return '<div class="scn amb"><b>표현 팁</b> · '+esc(m.ko)+'</div>';
  if(m.who==='pt'){
    const open=CV.open[i];
    return '<div class="msg pt"><div class="av jp">'+esc(CV.sc.g[0])+'</div><div class="bub"><div class="j">'+esc(KA.fill(m.ja))+'</div>'
      +(open?'<div class="k">'+esc(m.ko)+'</div>':'')
      +'<div class="acts">'+KA.spBtn(m.ja,'sm')+(!open?'<button class="lnk" data-a="cv-open" data-i="'+i+'">뜻 보기</button>':'')+'</div></div></div>';
  }
  return '<div class="msg me"><div class="bub"><div class="j">'+esc(KA.fill(m.ja))+'</div>'
    +(m.heard&&m.heard!==KA.fill(m.ja)?'<div class="hr">인식: '+esc(m.heard)+'</div>':'')+'</div></div>';
}
function typingHtml(){
  return '<div class="msg pt"><div class="av jp">'+esc(CV.sc.g[0])+'</div><div class="bub"><span class="typing"><i></i><i></i><i></i></span></div></div>';
}
function dockHtml(){
  if(!CV)return '';
  if(CV.phase==='run'){
    return '<div class="mrow"><div class="mtx"><div class="a">상대가 말하고 있어요</div></div><button class="btn sm" data-a="cv-skip">건너뛰기</button></div>';
  }
  const e=CV.sc.T[CV.idx];if(!e||e[0]!=='U')return '';
  if(CV.phase==='fb'){
    const r=CV.rec,g=KC.grade(r.score);
    return '<div class="dscroll"><div class="fbk g'+g.lv+'"><div class="vd"><b>'+g.t+'</b><span class="sc">'+Math.round(r.score*100)+'%</span></div><div class="df">'+KC.diffHtml(r.t,r,esc)+'</div>'
      +'<div class="hrd">인식된 말: <b>'+esc(r.h)+'</b></div>'
      +'<div class="fbtn"><button class="btn sm" data-a="cv-retry">다시 말하기</button><button class="btn sm pri" data-a="cv-go">계속</button></div></div></div>';
  }
  let h='<div class="dscroll"><div class="tip"><b>'+esc(e[1])+'</b></div>'
    +e[2].map((o,i)=>'<div class="opt'+(CV.sel===i?' sel':'')+'" data-a="cv-sel" data-i="'+i+'" role="button" tabindex="0"><div class="ja">'+esc(KA.fill(o[0]))+'</div><div class="ko">'+esc(o[1])+'</div></div>').join('');
  h+='</div>';
  if(KC.srOk){
    const lis=CV.listening,bad=!lis&&CV.err;
    const sub=lis?CV.interim:(bad?CV.err+(CV.heard?' (들린 말: '+CV.heard+')':''):(CV.sel!=null?'고른 문장을 읽어 보세요':'위 문장 중 하나를 말해 보세요'));
    h+='<div class="mrow"><button class="mic'+(lis?' on':'')+'" data-a="cv-mic" aria-label="'+(lis?'멈추기':'말하기')+'">'+(lis?I.stop:I.mic)+'</button>'
      +'<div class="mtx"><div class="a">'+(lis?'듣고 있어요':(bad?'다시 말해 보세요':'눌러서 말하세요'))+'</div><div class="b" id="itx">'+esc(sub)+'</div></div>'
      +((CV.sel!=null&&!lis)?'<button class="btn sm" data-a="cv-send">이 문장 보내기</button>':'')+'</div>';
  }else{
    h+=(CV.sel!=null?'<button class="btn pri full" data-a="cv-send">이 문장으로 답하기</button>':'<div class="muted tc">마이크를 쓸 수 없어서, 문장을 눌러 골라 답해요</div>');
  }
  return h;
}
function drawDock(){
  const d=$('.dock');if(!d)return;
  const c=$('#chat'),atBottom=!c||c.scrollHeight-c.scrollTop-c.clientHeight<48;
  const s=d.querySelector('.dscroll'),st=s?s.scrollTop:0;
  d.innerHTML=dockHtml();
  const n=d.querySelector('.dscroll');if(n&&CV&&CV.phase==='user')n.scrollTop=st;
  if(c&&atBottom)c.scrollTop=c.scrollHeight;
}
function drawCV(){
  if(!CV)return;
  const sc=CV.sc,pct=Math.round(CV.idx/sc.T.length*100);
  const chat=CV.msgs.map(msgHtml).join('')+(CV.typing?typingHtml():'');
  KA.setOv('<div class="ov-top"><button class="ibtn" data-a="cv-close" aria-label="닫기">'+I.x+'</button><div class="grow"><div class="jp px" style="font-size:.95rem;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(sc.t)+'</div><div class="bar" style="margin-top:.35rem"><i style="width:'+pct+'%"></i></div></div></div>'
    +'<div class="chat" id="chat"><div class="scn"><b>'+esc(sc.g)+'</b> · '+esc(sc.gk)+'<br>'+esc(sc.s)+'</div>'+chat+'</div>'
    +'<div class="dock">'+dockHtml()+'</div>');
  const c=$('#chat');if(c)c.scrollTop=c.scrollHeight;
}

async function pushPartner(ja,ko,my){
  CV.typing=true;drawCV();await sleep(420);if(!CV||CV.tok!==my)return;
  CV.typing=false;CV.msgs.push({who:'pt',ja:ja,ko:ko});drawCV();
  if(KA.S.voice){const t0=Date.now();await KA.say(ja);if(Date.now()-t0<450)await sleep(450);}
  else await sleep(300);
}
async function runCV(){
  const my=CV.tok;
  while(CV&&CV.tok===my&&CV.idx<CV.sc.T.length){
    const e=CV.sc.T[CV.idx];
    if(e[0]==='P'){
      CV.phase='run';
      await pushPartner(e[1],e[2],my);if(!CV||CV.tok!==my)return;
      CV.idx++;continue;
    }
    CV.phase='user';CV.sel=null;CV.err='';CV.heard='';CV.interim='';CV.rec=null;CV.listening=false;
    drawCV();
    return;
  }
  if(CV&&CV.tok===my)finishCV();
}
async function commit(i,rec){
  const my=CV.tok,e=CV.sc.T[CV.idx],o=e[2][i];
  KC.stopListen();KC.stopSay();CV.listening=false;
  CV.msgs.push({who:'me',ja:o[0],ko:o[1],heard:rec?rec.h:''});
  CV.results.push({ja:KA.fill(o[0]),ko:o[1],sc:rec?rec.score:null});
  CV.phase='run';CV.idx++;drawCV();
  await sleep(250);if(!CV||CV.tok!==my)return;
  await pushPartner(o[3],o[4],my);if(!CV||CV.tok!==my)return;
  if(e[3]){CV.msgs.push({who:'tip',ko:e[3]});drawCV();}
  runCV();
}
function startMic(){
  if(!CV||CV.phase!=='user')return;
  if(!KC.srOk){KA.toast(KC.errText('unsupported'));return;}
  KC.stopSay();
  const my=CV.tok,turn=CV.idx;
  CV.listening=true;CV.interim='';CV.err='';CV.heard='';CV.rec=null;drawDock();
  CV.h=KC.listen({
    interim:t=>{if(!CV||CV.tok!==my)return;CV.interim=t;const el=$('#itx');if(el)el.textContent=t;},
    end:(alts,err)=>{
      if(!CV||CV.tok!==my||CV.idx!==turn)return;
      CV.listening=false;CV.h=null;
      if(!alts.length){CV.err=KC.errText(err);drawDock();return;}
      handleHeard(alts);
    }
  });
}
/* 어느 문장을 말했는지는 모든 선택지와 비교해서 가장 비슷한 것으로 정해요.
   눌러 둔 문장이 거의 비슷하게 맞으면 그 문장을 우선해요. */
function handleHeard(alts){
  const e=CV.sc.T[CV.idx];
  const fo=e[2].map(o=>[KA.fill(o[0]),o[1],(o[2]||[]).map(KA.fill)]);
  const all=KC.pickOpt(fo,alts);
  let best=all[0];
  if(CV.sel!=null){const s=all.find(r=>r.i===CV.sel);if(s&&best&&s.score>=best.score-0.08)best=s;}
  CV.heard=alts[0];
  if(best&&best.score>=0.45){CV.rec=best;CV.phase='fb';}
  else{CV.err='잘 알아듣지 못했어요.';CV.phase='user';}
  drawDock();
}
function finishCV(){
  const sc=CV.sc,S=KA.S;
  const rs=CV.results.filter(r=>r.sc!=null).map(r=>r.sc);
  const avg=rs.length?Math.round(KA.avg(rs)*100):null;
  const rec=S.talk[sc.id]||{n:0,best:0};
  rec.n=(rec.n||0)+1;rec.last=KA.today();if(avg!=null&&avg>(rec.best||0))rec.best=avg;
  S.talk[sc.id]=rec;KA.save();
  CV.phase='end';
  const msg=avg==null?'이번에는 문장을 골라서 답했어요. 마이크로 말하면 점수가 나와요.':avg>=85?'정말 자연스러워요.':avg>=70?'좋아요! 조금만 더 다듬어 볼까요.':avg>=55?'잘하고 있어요. 한 번 더 하면 더 좋아져요.':'천천히 다시 도전해 봐요.';
  const rows=CV.results.map(r=>{
    const lv=r.sc==null?-1:KC.grade(r.sc).lv;
    return '<div class="rrow"><span class="dt'+(lv>=0?' g'+lv:'')+'"></span><div class="grow"><div class="j">'+esc(r.ja)+'</div><div class="k">'+esc(r.ko)+'</div></div>'+KA.spBtn(r.ja,'sm')+'</div>';
  }).join('');
  KA.setOv('<div class="ov-top"><b class="grow px" style="font-size:1.05rem">대화 완료</b><button class="ibtn" data-a="cv-close" aria-label="닫기">'+I.x+'</button></div>'
    +'<div class="ov-body"><div class="card"><div class="jp px" style="text-align:center;margin-bottom:.4rem">'+esc(sc.t)+'</div>'
    +(avg!=null?'<div class="big">'+avg+'<small>점</small></div>':'<div class="big" style="font-size:1.6rem">—</div>')
    +'<div class="muted tc" style="margin-top:.3rem">'+msg+'</div></div>'
    +'<h2>내가 한 말</h2><div class="card">'+rows+'</div>'
    +'<h2>오늘의 표현</h2><div class="kpl">'+sc.kp.map(p=>'<button data-a="say" data-t="'+esc(p[0])+'">'+esc(p[0])+'<small>'+esc(p[1])+'</small></button>').join('')+'</div>'
    +'<div class="row" style="gap:.5rem;margin-top:1rem"><button class="btn grow" data-a="cv-close">닫기</button><button class="btn pri grow" data-a="cv-again">다시 하기</button></div></div>');
}

KA.startTalk=function(sc){
  KA.stopAudio();
  CV={sc:sc,idx:0,msgs:[],tok:Date.now()+Math.random(),results:[],phase:'run',sel:null,listening:false,interim:'',rec:null,err:'',heard:'',typing:false,open:{},h:null};
  drawCV();
  KA.onClose=()=>{if(CV)CV.tok=0;CV=null;KA.render(true);};
  runCV();
};

H['cv-close']=()=>KA.closeOv();
H['cv-again']=()=>{if(CV){const sc=CV.sc;KA.startTalk(sc);}};
H['cv-open']=el=>{if(!CV)return;CV.open[+el.dataset.i]=true;drawCV();};
H['cv-skip']=()=>KC.stopSay();
H['cv-mic']=()=>{
  if(!CV||CV.phase!=='user')return;
  if(CV.listening){if(CV.h)CV.h.stop();return;}
  startMic();
};
H['cv-sel']=el=>{
  if(!CV||CV.phase!=='user')return;
  const i=+el.dataset.i,e=CV.sc.T[CV.idx];
  if(CV.listening){KC.stopListen();CV.listening=false;}
  CV.sel=i;CV.err='';drawDock();
  KA.say(e[2][i][0]);
};
H['cv-send']=()=>{if(!CV||CV.sel==null||CV.phase!=='user')return;commit(CV.sel,null);};
H['cv-retry']=()=>{if(!CV)return;CV.phase='user';CV.rec=null;CV.err='';CV.heard='';drawDock();startMic();};
H['cv-go']=()=>{if(!CV||CV.phase!=='fb'||!CV.rec)return;commit(CV.rec.i,CV.rec);};
})();
