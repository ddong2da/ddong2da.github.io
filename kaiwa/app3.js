/* 일어 회화 — 3) 대화 엔진 (상대와 말 주고받기) */
(function(){
'use strict';
const KC=window.KC,KA=window.KA,esc=KA.esc,$=KA.$,I=KA.I,H=KA.H;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let CV=null;
KA.cv=()=>CV;
(KA.hooks=KA.hooks||[]).push(()=>{if(CV&&CV.listening){CV.listening=false;CV.h=null;drawDock();}});

function msgHtml(m,i){
  if(m.who==='tip')return '<div class="scn" style="background:var(--am-s)"><b>표현 팁</b> · '+esc(m.ko)+'</div>';
  const showKo=CV.ko||CV.open[i];
  if(m.who==='pt'){
    return '<div class="msg pt"><div class="av jp">'+esc(CV.sc.g[0])+'</div><div class="bub"><div class="j">'+esc(KA.fill(m.ja))+'</div>'
      +(showKo?'<div class="k">'+esc(m.ko)+'</div>':'')
      +'<div class="acts">'+KA.spBtn(m.ja,'sm')+((!showKo&&KA.S.tr==='tap')?'<button class="lnk" data-a="cv-open" data-i="'+i+'">뜻 보기</button>':'')+'</div></div></div>';
  }
  return '<div class="msg me"><div class="bub"><div class="j">'+esc(KA.fill(m.ja))+'</div>'
    +(showKo&&m.ko?'<div class="k">'+esc(m.ko)+'</div>':'')
    +(m.heard&&!m.free&&m.heard!==m.ja?'<div class="hr">인식: '+esc(m.heard)+'</div>':'')+'</div></div>';
}
function typingHtml(){
  return '<div class="msg pt"><div class="av jp">'+esc(CV.sc.g[0])+'</div><div class="bub"><span class="typing"><i></i><i></i><i></i></span></div></div>';
}
function micRow(label,sub){
  const lis=CV.listening;
  return '<div class="mrow"><button class="mic'+(lis?' on':'')+'" data-a="cv-mic" aria-label="'+(lis?'멈추기':'말하기')+'">'+(lis?I.stop:I.mic)+'</button><div class="mtx"><div class="a">'+esc(label)+'</div><div class="b" id="itx">'+esc(sub||'')+'</div></div></div>';
}
function dockHtml(){
  if(!CV)return '';
  const S=KA.S;
  if(CV.phase==='run'){
    return '<div class="mrow"><div class="mtx"><div class="a">상대의 말을 듣고 있어요</div></div><button class="btn sm" data-a="cv-skip">소리 건너뛰기</button></div>';
  }
  const e=CV.sc.T[CV.idx];if(!e||e[0]!=='U')return '';
  const opts=e[2],vis=S.help!=='free'||CV.reveal||!KC.srOk;
  if(CV.phase==='fb'){
    let body;
    if(CV.rec){
      const r=CV.rec,g=KC.grade(r.score);
      body='<div class="fbk g'+g.lv+'"><div class="vd"><b>'+g.t+'</b><span class="sc">'+Math.round(r.score*100)+'%</span></div><div class="df">'+KC.diffHtml(r.t,r,esc)+'</div>'
        +'<div class="hrd">인식된 말: <b>'+esc(r.h)+'</b></div>'
        +'<div class="fbtn"><button class="btn sm" data-a="cv-retry">다시 말하기</button><button class="btn sm pri" data-a="cv-go">계속</button></div></div>';
    }else{
      body='<div class="fbk g2"><div class="vd"><b>잘 들었어요</b></div><div class="hrd" style="margin-top:0">인식된 말: <b>'+esc(CV.freeText)+'</b></div>'
        +'<div class="muted" style="margin-top:.5rem">이렇게도 말할 수 있어요</div><div class="df">'+esc(KA.fill(opts[0][0]))+'</div>'
        +'<div class="fbtn"><button class="btn sm" data-a="cv-retry">다시 말하기</button><button class="btn sm pri" data-a="cv-go">계속</button></div></div>';
    }
    return '<div class="dscroll">'+body+'</div>';
  }
  let h='<div class="dscroll"><div class="tip"><b>'+esc(e[1])+'</b></div>';
  if(vis){
    h+=opts.map((o,i)=>{
      const sel=CV.sel===i,showJa=S.help==='full'||sel||CV.shown[i];
      return '<div class="opt'+(sel?' sel':'')+'" data-a="cv-sel" data-i="'+i+'" role="button" tabindex="0"><span class="n">'+(i+1)+'</span><div class="tx">'
        +(showJa?'<div class="ja">'+esc(KA.fill(o[0]))+'</div>':'')
        +'<div class="ko">'+esc(o[1])+'</div>'
        +(!showJa?'<button class="rv" data-a="cv-show" data-i="'+i+'">일본어 보기</button>':'')
        +(sel?'<div class="fbtn"><button class="btn sm blue" data-a="cv-hear">듣기</button><button class="btn sm pri" data-a="cv-send">이 말로 답하기</button></div>':'')
        +'</div></div>';
    }).join('');
  }else h+='<button class="btn sm blue full" data-a="cv-reveal">추천 답변 보기</button>';
  if(CV.err)h+='<div class="hrd" style="color:var(--rd)">'+esc(CV.err)+(CV.heard?' <br>들린 말: <b>'+esc(CV.heard)+'</b>':'')+'</div>';
  h+='</div>';
  if(KC.srOk){
    const sub=CV.listening?CV.interim:(CV.sel!=null?'고른 문장을 소리 내어 읽어 보세요':(vis?'고른 문장이나 비슷한 말을 해 보세요':'상황에 맞게 자유롭게 말해 보세요'));
    h+=micRow(CV.listening?'듣고 있어요':'눌러서 말하세요',sub);
  }else h+='<div class="muted">이 브라우저에서는 마이크를 쓸 수 없어서 문장을 골라 답해요.</div>';
  return h;
}
function drawDock(){const d=$('.dock');if(d)d.innerHTML=dockHtml();}
function drawCV(){
  if(!CV)return;
  const sc=CV.sc,pct=Math.round(CV.idx/sc.T.length*100);
  const chat=CV.msgs.map(msgHtml).join('')+(CV.typing?typingHtml():'');
  KA.setOv('<div class="ov-top"><button class="ibtn" data-a="cv-close" aria-label="닫기">'+I.x+'</button><div class="grow"><div class="jp px" style="font-size:.95rem;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(sc.t)+'</div><div class="bar" style="margin-top:.35rem"><i style="width:'+pct+'%"></i></div></div>'
    +'<button class="ibtn" data-a="cv-ko" aria-label="번역"><b class="jp" style="font-size:1.05rem;'+(CV.ko?'color:var(--ac)':'')+'">訳</b></button></div>'
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
    CV.phase='user';CV.sel=null;CV.shown={};CV.reveal=false;CV.err='';CV.heard='';CV.interim='';CV.rec=null;CV.listening=false;
    drawCV();
    if(KA.S.auto&&KC.srOk)startMic();
    return;
  }
  if(CV&&CV.tok===my)finishCV();
}
async function commit(i,rec,freeText){
  const my=CV.tok,e=CV.sc.T[CV.idx],o=i>=0?e[2][i]:null;
  KC.stopListen();KC.stopSay();CV.listening=false;
  const m={who:'me',ja:o?o[0]:freeText,ko:o?o[1]:'',heard:rec?rec.h:'',free:!o};
  CV.msgs.push(m);
  CV.results.push({ja:KA.fill(m.ja),ko:m.ko,sc:rec?rec.score:null,free:!o});
  if(rec)KA.bump('s');
  CV.phase='run';CV.idx++;drawCV();
  const a=o?[o[3],o[4]]:KC.AIZ[KC.rnd(KC.AIZ.length)];
  await sleep(250);if(!CV||CV.tok!==my)return;
  await pushPartner(a[0],a[1],my);if(!CV||CV.tok!==my)return;
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
function handleHeard(alts){
  const e=CV.sc.T[CV.idx],S=KA.S;
  const fo=e[2].map(o=>[KA.fill(o[0]),o[1],(o[2]||[]).map(KA.fill)]);
  let best;
  if(CV.sel!=null){best=KC.pickOpt([fo[CV.sel]],alts)[0];best.i=CV.sel;}
  else best=KC.pickOpt(fo,alts)[0];
  const vis=S.help!=='free'||CV.reveal;
  CV.heard=alts[0];
  if(best&&best.score>=(vis?0.45:0.35)){CV.rec=best;CV.phase='fb';}
  else if(!vis){CV.rec=null;CV.freeText=alts[0];CV.phase='fb';}
  else{CV.err='잘 알아듣지 못했어요. 다시 말해 보거나 문장을 눌러 골라 보세요.';CV.phase='user';}
  drawDock();
  if(S.auto&&CV.phase==='fb'&&CV.rec&&CV.rec.score>=KC.PASS){
    const my=CV.tok,t=CV.idx;
    setTimeout(()=>{if(CV&&CV.tok===my&&CV.idx===t&&CV.phase==='fb')H['cv-go']();},1600);
  }
}
function finishCV(){
  const sc=CV.sc,S=KA.S;
  const rs=CV.results.filter(r=>r.sc!=null).map(r=>r.sc);
  const avg=rs.length?Math.round(KA.avg(rs)*100):null;
  const rec=S.talk[sc.id]||{n:0,best:0};
  rec.n=(rec.n||0)+1;rec.last=KA.today();if(avg!=null&&avg>(rec.best||0))rec.best=avg;
  S.talk[sc.id]=rec;KA.bump('t');KA.save();
  CV.phase='end';
  const msg=avg==null?'이번에는 문장을 골라서 답했어요. 마이크로 말하면 점수가 나와요.':avg>=85?'정말 자연스러워요.':avg>=70?'좋아요! 조금만 더 다듬어 볼까요.':avg>=55?'잘하고 있어요. 한 번 더 하면 더 좋아져요.':'천천히 다시 도전해 봐요.';
  const rows=CV.results.map(r=>{
    const lv=r.sc==null?-1:KC.grade(r.sc).lv;
    return '<div class="rrow"><span class="dt'+(lv>=0?' g'+lv:'')+'"></span><div class="grow"><div class="j">'+esc(r.ja)+'</div>'+(r.ko?'<div class="k">'+esc(r.ko)+'</div>':'<div class="k">자유 대답</div>')+'</div>'+KA.spBtn(r.ja,'sm')+'</div>';
  }).join('');
  KA.setOv('<div class="ov-top"><b class="grow px" style="font-size:1.05rem">대화 완료</b><button class="ibtn" data-a="cv-close">'+I.x+'</button></div>'
    +'<div class="ov-body"><div class="card"><div class="jp px" style="text-align:center;margin-bottom:.4rem">'+esc(sc.t)+'</div>'
    +(avg!=null?'<div class="big">'+avg+'<small>점</small></div>':'<div class="big" style="font-size:1.6rem">—</div>')
    +'<div class="muted" style="text-align:center;margin-top:.3rem">'+msg+'</div></div>'
    +'<h2>내가 한 말</h2><div class="card">'+rows+'</div>'
    +'<h2>핵심 표현</h2><div class="kpl">'+sc.kp.map(p=>'<button data-a="say" data-t="'+esc(p[0])+'">'+esc(p[0])+'<small>'+esc(p[1])+'</small></button>').join('')+'</div>'
    +'<div class="row" style="gap:.5rem;margin-top:1rem"><button class="btn grow" data-a="cv-close">닫기</button><button class="btn pri grow" data-a="cv-again">다시 하기</button></div></div>');
}

KA.startTalk=function(sc){
  CV={sc:sc,idx:0,msgs:[],tok:Date.now()+Math.random(),results:[],phase:'run',sel:null,shown:{},reveal:false,listening:false,interim:'',rec:null,err:'',heard:'',typing:false,ko:KA.S.tr==='on',open:{},h:null};
  drawCV();
  KA.onClose=()=>{if(CV)CV.tok=0;CV=null;KA.render(true);};
  runCV();
};

H['talk-go']=el=>{const sc=KA.TALK[+el.dataset.i];KA.closeSheet();if(sc)KA.startTalk(sc);};
H['cv-close']=()=>KA.closeOv();
H['cv-again']=()=>{if(CV){const sc=CV.sc;KA.startTalk(sc);}};
H['cv-ko']=()=>{if(!CV)return;CV.ko=!CV.ko;drawCV();};
H['cv-open']=el=>{if(!CV)return;CV.open[+el.dataset.i]=true;const lis=CV.listening;drawCV();};
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
H['cv-show']=el=>{if(!CV)return;CV.shown[+el.dataset.i]=true;drawDock();};
H['cv-reveal']=()=>{if(!CV)return;CV.reveal=true;drawDock();};
H['cv-hear']=()=>{if(!CV||CV.sel==null)return;KA.say(CV.sc.T[CV.idx][2][CV.sel][0]);};
H['cv-send']=()=>{if(!CV||CV.sel==null||CV.phase!=='user')return;commit(CV.sel,null);};
H['cv-retry']=()=>{if(!CV)return;CV.phase='user';CV.rec=null;CV.err='';CV.heard='';drawDock();startMic();};
H['cv-go']=()=>{
  if(!CV||CV.phase!=='fb')return;
  if(CV.rec)commit(CV.rec.i,CV.rec);else commit(-1,null,CV.freeText);
};
})();
