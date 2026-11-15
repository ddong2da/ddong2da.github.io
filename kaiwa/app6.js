/* 일어 회화 — 6) 연습 탭 · 퀴즈 (즉시 응답 / 경어 / 표현 뜻 / 듣기) */
(function(){
'use strict';
const KC=window.KC,KA=window.KA,esc=KA.esc,$=KA.$,I=KA.I,H=KA.H,UI=KA.UI;
const RESP=window.RESP||[],KQ=window.KQ||[],EXALL=KA.EXALL;
const shuffle=KC.shuffle;
let QZ=null;
const KINDS={resp:'즉시 응답',keigo:'경어 빈칸',expr:'표현 뜻',listen:'듣고 뜻 고르기'};
const speakable=e=>String(e).split(/[／\/]/)[0].replace(/[〜~]/g,'').replace(/\(.*?\)/g,'');

function mix(correct,others){
  const all=shuffle([correct].concat(others));
  return {ch:all,a:all.indexOf(correct)};
}
function buildResp(){
  const lv=UI.pq.rlv;
  const pool=RESP.filter(x=>lv==='all'||String(x.lv)===lv);
  return shuffle(pool.length?pool:RESP).slice(0,10).map(r=>{
    const order=shuffle([0,1,2]),ch=order.map(i=>r.c[i]);
    return {tag:r.t==='r'?'이럴 때 가장 자연스러운 대답은?':'이런 상황에서 할 말은?',big:r.p,kobig:r.t==='s',sub:r.t==='r'?r.k:'',speak:r.t==='r'?r.p:'',
      ch:ch,a:order.indexOf(0),jp:true,ex:'정답: '+r.c[0]+' — '+r.e};
  });
}
function buildKeigo(){
  const lv=UI.pq.klv;
  const pool=KQ.filter(x=>lv==='all'||String(x.lv)===lv);
  return shuffle(pool.length?pool:KQ).slice(0,10).map(q=>{
    const order=shuffle([0,1,2]),ch=order.map(i=>q.c[i]);
    return {tag:'빈칸에 알맞은 경어는?',big:q.s,ch:ch,a:order.indexOf(0),jp:true,ex:'정답: '+q.c[0]+' — '+q.e};
  });
}
function buildExpr(){
  const lv=UI.pq.elv;
  const pool=EXALL.filter(x=>lv==='all'||String(x.lv)===lv);
  return shuffle(pool).slice(0,10).map(it=>{
    let near=shuffle(EXALL.filter(x=>x.gid===it.gid&&x.key!==it.key&&x.m!==it.m));
    if(near.length<2)near=near.concat(shuffle(EXALL.filter(x=>x.key!==it.key&&x.m!==it.m)));
    const mx=mix(it,near.slice(0,2));
    return {tag:'이 표현의 뜻은?',big:it.e,sub:it.r||'',speak:speakable(it.e),ch:mx.ch.map(x=>x.m),a:mx.a,ex:it.e+' = '+it.m+'. '+it.n};
  });
}
function buildListen(){
  const lines=[];
  KA.TALK.forEach(sc=>sc.T.forEach(e=>{if(e[0]==='P')lines.push({ja:e[1],ko:e[2]});}));
  return shuffle(lines).slice(0,10).map(l=>{
    const mx=mix(l,shuffle(lines.filter(x=>x.ko!==l.ko)).slice(0,2));
    return {tag:'듣기 연습',big:'들려주는 말의 뜻은?',kobig:true,sub:'스피커를 눌러 다시 들을 수 있어요',speak:l.ja,ch:mx.ch.map(x=>x.ko),a:mx.a,ex:l.ja+' — '+l.ko};
  });
}
const BUILD={resp:buildResp,keigo:buildKeigo,expr:buildExpr,listen:buildListen};

KA.vPrac=function(){
  const S=KA.S,best=k=>S.quiz[k]?'<span class="tag dn">최고 '+S.quiz[k].best+'점</span>':'';
  const lvSeg=(key,cur)=>KA.seg([['all','N2·N1'],['2','N2'],['1','N1']],cur,key);
  return '<div class="card c-blue" style="margin-top:.4rem"><div class="px" style="margin-bottom:.15rem">연습 퀴즈</div><div class="muted">대화에서 자주 틀리는 포인트를 짧게 점검해요. 한 번에 10문제씩이에요.</div></div>'
   +'<div class="card"><div class="row"><div class="grow px">즉시 응답</div>'+best('resp')+'</div><div class="muted">상대의 말에 가장 자연스러운 대답을 골라요. 경어의 방향, 사양과 사과 같은 일본어다운 반응을 익혀요.</div>'
   +lvSeg('rlv',UI.pq.rlv)+'<button class="btn pri full" data-a="qstart" data-v="resp">10문제 시작</button></div>'
   +'<div class="card"><div class="row"><div class="grow px">경어 빈칸</div>'+best('keigo')+'</div><div class="muted">문장 속 빈칸에 알맞은 존경어·겸양어를 골라요.</div>'
   +lvSeg('klv',UI.pq.klv)+'<button class="btn pri full" data-a="qstart" data-v="keigo">10문제 시작</button></div>'
   +'<div class="card"><div class="row"><div class="grow px">표현 뜻 맞추기</div>'+best('expr')+'</div><div class="muted">구어체·완곡 표현·관용구의 뜻을 골라요.</div>'
   +lvSeg('elv',UI.pq.elv)+'<button class="btn pri full" data-a="qstart" data-v="expr">10문제 시작</button></div>'
   +'<div class="card"><div class="row"><div class="grow px">듣고 뜻 고르기</div>'+best('listen')+'</div><div class="muted">대화에 나오는 상대의 말을 듣고 한국어 뜻을 골라요. 글자 없이 귀로만 확인해요.</div>'
   +'<button class="btn pri full" style="margin-top:.5rem" data-a="qstart" data-v="listen">10문제 시작</button></div>';
};

function drawQ(){
  if(!QZ)return;
  if(QZ.i>=QZ.qs.length){finishQ();return;}
  const q=QZ.qs[QZ.i],ans=QZ.pick>=0,last=QZ.i+1>=QZ.qs.length;
  const chs=q.ch.map((c,i)=>{
    let cls='choice'+(q.jp?' jpc':'');
    if(ans){if(i===q.a)cls+=' right';else if(i===QZ.pick)cls+=' wrong';}
    return '<button class="'+cls+'" data-a="qpick" data-v="'+i+'"'+(ans?' disabled':'')+'><span class="no">'+(i+1)+'</span><span class="tx">'+esc(c)+'</span></button>';
  }).join('');
  KA.setOv('<div class="ov-top"><button class="ibtn" data-a="qclose" aria-label="닫기">'+I.x+'</button><div class="grow"><div class="bar"><i style="width:'+Math.round(QZ.i/QZ.qs.length*100)+'%"></i></div></div><span class="muted">'+(QZ.i+1)+'/'+QZ.qs.length+'</span></div>'
    +'<div class="ov-body"><div class="qp"><div class="muted" style="margin-bottom:.45rem">'+esc(q.tag)+'</div><div class="big2'+(q.kobig?' ko':'')+'">'+esc(q.big)+'</div>'
    +(q.sub?'<div class="sub">'+esc(q.sub)+'</div>':'')+(q.speak?KA.spBtn(q.speak):'')+'</div>'
    +'<div class="choices">'+chs+'</div>'
    +(ans?'<div class="fb">'+(QZ.pick===q.a?'<b>정답!</b> ':'<b>아쉬워요.</b> ')+'<span class="jx">'+esc(q.ex)+'</span></div><button class="btn pri full" style="margin-top:.8rem" data-a="qnext">'+(last?'결과 보기':'다음')+'</button>':'')+'</div>');
}
function finishQ(){
  const S=KA.S,n=QZ.qs.length,pc=Math.round(QZ.ok/n*100);
  const rec=S.quiz[QZ.kind]||{best:0,n:0};
  rec.n++;if(pc>rec.best)rec.best=pc;S.quiz[QZ.kind]=rec;KA.bump('q');KA.save();
  const msg=pc>=90?'아주 좋아요.':pc>=70?'잘하고 있어요.':pc>=50?'조금만 더 연습하면 돼요.':'틀린 문제를 다시 읽어 봐요.';
  const wr=QZ.wrong.map(w=>'<div class="rrow"><span class="dt g0"></span><div class="grow"><div class="j">'+esc(w.big)+'</div><div class="k">'+esc(w.ex)+'</div></div></div>').join('');
  KA.setOv('<div class="ov-top"><b class="grow px" style="font-size:1.05rem">'+esc(KINDS[QZ.kind])+' 결과</b><button class="ibtn" data-a="qclose">'+I.x+'</button></div>'
    +'<div class="ov-body"><div class="card"><div class="big">'+QZ.ok+'<small>/ '+n+'</small></div><div class="muted" style="text-align:center;margin-top:.3rem">'+msg+'</div></div>'
    +(wr?'<h2>다시 볼 문제</h2><div class="card">'+wr+'</div>':'')
    +'<div class="row" style="gap:.5rem;margin-top:.8rem"><button class="btn grow" data-a="qclose">닫기</button><button class="btn pri grow" data-a="qagain">다시 하기</button></div></div>');
}
function startQ(kind){
  const qs=BUILD[kind]();if(!qs.length)return;
  KA.stopAudio();
  QZ={kind:kind,qs:qs,i:0,pick:-1,ok:0,wrong:[]};
  drawQ();
  KA.onClose=()=>{QZ=null;KA.render(true);};
  if(qs[0].speak)KA.say(qs[0].speak);
}
H.qstart=el=>startQ(el.dataset.v);
H.qagain=()=>{if(QZ)startQ(QZ.kind);};
H.qclose=()=>KA.closeOv();
H.qpick=el=>{
  if(!QZ||QZ.pick>=0)return;
  const q=QZ.qs[QZ.i],i=+el.dataset.v;
  QZ.pick=i;
  if(i===q.a)QZ.ok++;else QZ.wrong.push(q);
  drawQ();
};
H.qnext=()=>{
  if(!QZ)return;
  QZ.i++;QZ.pick=-1;drawQ();
  if(QZ&&QZ.i<QZ.qs.length){const q=QZ.qs[QZ.i];if(q.speak)KA.say(q.speak);}
};
H.rlv=el=>{UI.pq.rlv=el.dataset.v;KA.render(true);};
H.klv=el=>{UI.pq.klv=el.dataset.v;KA.render(true);};
H.elv=el=>{UI.pq.elv=el.dataset.v;KA.render(true);};
})();
