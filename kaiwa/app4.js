/* 일어 회화 — 4) 말하기 탭 · 한→일 말하기 · 따라 말하기 */
(function(){
'use strict';
const KC=window.KC,KA=window.KA,esc=KA.esc,$=KA.$,I=KA.I,H=KA.H,UI=KA.UI;
const SPEAK=window.SPEAK||[],FREE=KA.FREE=window.FREE||[];
UI.smode='ko';UI.scat='all';UI.slv='all';UI.shsrc='expr';
let SP=null;
(KA.hooks=KA.hooks||[]).push(()=>{if(SP&&SP.listening){SP.listening=false;SP.h=null;drawSP();}});

KA.vSpeak=function(){
  const S=KA.S;
  let h=KA.seg([['ko','한→일 말하기'],['shadow','따라 말하기'],['free','자유 대화']],UI.smode,'smode')+KA.srWarn();
  if(UI.smode==='ko'){
    const cats=[['all','전체'],['daily','일상'],['travel','여행'],['life','생활'],['work','직장'],['opinion','의견']];
    const learned=SPEAK.filter(x=>(S.sp[x.id]||0)>=70).length;
    h+='<div class="card c-blue"><div class="px" style="margin-bottom:.15rem">한국어를 보고 일본어로 말해요</div><div class="muted">상황에 맞는 문장을 직접 말해 보는 연습이에요. 말한 뒤 정답과 비교해 빠뜨린 글자를 알려 줘요. 익힌 문장 '+learned+'/'+SPEAK.length+'</div></div>'
      +KA.chips(cats,UI.scat,'scat')+KA.seg([['all','전체'],['2','N2'],['1','N1']],UI.slv,'slv')
      +'<button class="btn pri full" data-a="sp-start">10문장 시작</button>';
  }else if(UI.smode==='shadow'){
    h+='<div class="card c-blue"><div class="px" style="margin-bottom:.15rem">듣고 따라 말해요 (섀도잉)</div><div class="muted">원어민 억양을 들은 뒤 그대로 따라 말해요. 말투와 리듬이 자연스러워져요. 글자를 가리고 하면 더 좋은 연습이 돼요.</div></div>'
      +KA.chips([['expr','표현 예문'],['talk','대화 상대 대사']],UI.shsrc,'shsrc')+KA.seg([['all','N2·N1'],['2','N2'],['1','N1']],UI.slv,'slv')
      +'<button class="btn pri full" data-a="sp-start">10문장 시작</button>';
  }else{
    h+='<div class="card c-blue"><div class="px" style="margin-bottom:.15rem">정해진 답 없이 자유롭게</div><div class="muted">상대가 질문하면 내 생각대로 대답해요. 점수 대신 대화를 이어 가는 데 집중해요. 마이크가 어려우면 글자로 입력해도 돼요.</div></div>'
      +FREE.map((t,i)=>{const r=S.free[t.id];return '<button class="sitem'+(r?' done':'')+'" data-a="free-open" data-i="'+i+'"><span class="n jp">話</span><span class="grow"><div class="t">'+esc(t.t)+'</div><div class="s">'+esc(t.k)+'</div><div class="tg">'+KA.lvTag(t.lv)+(r?'<span class="tag dn">'+r.n+'회</span>':'')+'</div></span>'+I.chev+'</button>';}).join('');
  }
  return h;
};

function buildQ(){
  const n=10,S=KA.S;
  if(UI.smode==='ko'){
    let pool=SPEAK.filter(x=>(UI.scat==='all'||x.c===UI.scat)&&(UI.slv==='all'||String(x.lv)===UI.slv));
    if(!pool.length)pool=SPEAK;
    pool=KC.shuffle(pool).sort((a,b)=>(S.sp[a.id]||0)-(S.sp[b.id]||0));
    return pool.slice(0,n).map(x=>({id:x.id,ko:x.ko,ja:x.ja,alts:x.alts}));
  }
  let pool=[];
  if(UI.shsrc==='talk'){
    KA.TALK.forEach(sc=>{if(UI.slv!=='all'&&String(sc.lv)!==UI.slv)return;sc.T.forEach(e=>{if(e[0]==='P')pool.push({ja:e[1],ko:e[2]});});});
  }else{
    KA.EXALL.forEach(it=>{if(UI.slv!=='all'&&String(it.lv)!==UI.slv)return;const x=it.ex[KC.rnd(it.ex.length)];pool.push({ja:x[0],ko:x[1]});});
  }
  return KC.shuffle(pool).slice(0,n);
}

function fbHtml(){
  const last=SP.i+1>=SP.q.length;
  if(!SP.rec)return '<div class="fbtn"><button class="btn pri" data-a="sp-next">'+(last?'결과 보기':'다음')+'</button></div>';
  const r=SP.rec,g=KC.grade(r.score);
  return '<div class="fbk g'+g.lv+'"><div class="vd"><b>'+g.t+'</b><span class="sc">'+Math.round(r.score*100)+'%</span></div><div class="df">'+KC.diffHtml(r.t,r,esc)+'</div>'
    +'<div class="hrd">인식된 말: <b>'+esc(SP.heard)+'</b></div>'
    +'<div class="fbtn"><button class="btn sm" data-a="sp-retry">다시 말하기</button><button class="btn sm pri" data-a="sp-next">'+(last?'결과 보기':'다음')+'</button></div></div>';
}
function drawSP(){
  if(!SP)return;
  const q=SP.q[SP.i],ja=KA.fill(q.ja),ko=SP.mode==='ko',last=SP.i+1>=SP.q.length;
  const pct=Math.round(SP.i/SP.q.length*100);
  let card;
  if(ko){
    card='<div class="pcard"><div class="lb">일본어로 말해 보세요</div><div class="ko">'+esc(q.ko)+'</div>'
      +((SP.showAns||SP.phase==='fb')?'<div class="ans"><div class="j">'+esc(ja)+'</div><div class="acts">'+KA.spBtn(ja)+'</div></div>':'<div class="acts"><button class="btn sm blue" data-a="sp-hint">힌트 보기</button></div>')+'</div>';
  }else{
    card='<div class="pcard"><div class="lb">듣고 따라 말해 보세요</div>'+((SP.hide&&SP.phase!=='fb')?'<div class="ja" style="color:var(--sub);letter-spacing:.3em">・・・</div>':'<div class="ja">'+esc(ja)+'</div>')
      +(q.ko?'<div class="sub">'+esc(q.ko)+'</div>':'')
      +'<div class="acts">'+KA.spBtn(ja)+'<button class="btn sm" data-a="sp-hide">'+(SP.hide?'글자 보기':'글자 가리기')+'</button></div></div>';
  }
  let mic='';
  if(KC.srOk){
    mic='<div class="say" style="'+((SP.listening||SP.heard)?'':'visibility:hidden')+'"><div class="l">내가 말한 것</div><div class="t" id="sp-t">'+esc(SP.listening?SP.interim:SP.heard)+'</div></div>'
      +(SP.phase==='fb'?fbHtml():'<div class="mrow" style="justify-content:center;flex-direction:column;gap:.5rem"><button class="mic'+(SP.listening?' on':'')+'" data-a="sp-mic" style="width:4.2rem;height:4.2rem" aria-label="말하기">'+(SP.listening?I.stop:I.mic)+'</button><div class="muted">'+(SP.listening?'듣고 있어요…':'눌러서 말하세요')+'</div></div>')
      +(SP.err?'<div class="hrd" style="color:var(--rd);text-align:center;margin-top:.5rem">'+esc(SP.err)+'</div>':'');
  }else{
    mic=KA.srWarn()+(SP.phase==='fb'||!ko?'<button class="btn pri full" data-a="sp-next">'+(last?'결과 보기':'다음')+'</button>':'<button class="btn pri full" data-a="sp-reveal">정답 보기</button>');
  }
  KA.setOv('<div class="ov-top"><button class="ibtn" data-a="sp-close" aria-label="닫기">'+I.x+'</button><div class="grow"><div class="bar"><i style="width:'+pct+'%"></i></div></div><span class="muted">'+(SP.i+1)+'/'+SP.q.length+'</span></div>'
    +'<div class="ov-body">'+card+mic+'</div>');
}
function begin(){
  if(!SP)return;
  const my=SP.tok,idx=SP.i,q=SP.q[idx];
  SP.phase='ask';SP.rec=null;SP.heard='';SP.err='';SP.interim='';SP.listening=false;SP.showAns=false;
  drawSP();
  if(SP.mode==='shadow'&&KA.S.voice){
    KA.say(q.ja).then(()=>{if(SP&&SP.tok===my&&SP.i===idx&&SP.phase==='ask'&&KA.S.auto&&KC.srOk)mic();});
  }else if(KA.S.auto&&KC.srOk&&SP.mode==='ko')setTimeout(()=>{if(SP&&SP.tok===my&&SP.i===idx&&SP.phase==='ask')mic();},300);
}
function mic(){
  if(!SP||SP.phase!=='ask'||!KC.srOk)return;
  KC.stopSay();
  const my=SP.tok,idx=SP.i;
  SP.listening=true;SP.interim='';SP.heard='';SP.err='';drawSP();
  SP.h=KC.listen({
    interim:t=>{if(!SP||SP.tok!==my)return;SP.interim=t;const el=$('#sp-t');if(el){el.textContent=t;const w=el.parentNode;if(w)w.style.visibility='visible';}},
    end:(alts,err)=>{
      if(!SP||SP.tok!==my||SP.i!==idx)return;
      SP.listening=false;SP.h=null;
      if(!alts.length){SP.err=KC.errText(err);drawSP();return;}
      const q=SP.q[idx];
      const r=KC.score([KA.fill(q.ja)].concat((q.alts||[]).map(KA.fill)),alts);
      SP.rec=r;SP.heard=alts[0];SP.phase='fb';
      SP.res[idx]={ja:KA.fill(q.ja),ko:q.ko,sc:r.score};
      const S=KA.S,pc=Math.round(r.score*100);
      if(q.id&&pc>(S.sp[q.id]||0))S.sp[q.id]=pc;
      KA.bump('s');
      drawSP();
      if(SP.mode==='ko'&&S.voice)KA.say(KA.fill(q.ja));
    }
  });
}
function finish(){
  const rs=SP.res.filter(r=>r&&r.sc!=null).map(r=>r.sc);
  const avg=rs.length?Math.round(KA.avg(rs)*100):null;
  const msg=avg==null?'정답을 확인했어요. 마이크로 말하면 점수가 나와요.':avg>=85?'정말 훌륭해요.':avg>=70?'좋아요! 이대로 꾸준히 해요.':avg>=55?'잘하고 있어요. 틀린 문장은 한 번 더 해 보세요.':'천천히 다시 도전해 봐요.';
  const rows=SP.q.map((q,i)=>{
    const r=SP.res[i],lv=r&&r.sc!=null?KC.grade(r.sc).lv:-1,ja=KA.fill(q.ja);
    return '<div class="rrow"><span class="dt'+(lv>=0?' g'+lv:'')+'"></span><div class="grow"><div class="j">'+esc(ja)+'</div><div class="k">'+esc(q.ko||'')+'</div></div>'+KA.spBtn(ja,'sm')+'</div>';
  }).join('');
  SP.phase='end';
  KA.save();
  KA.setOv('<div class="ov-top"><b class="grow px" style="font-size:1.05rem">연습 결과</b><button class="ibtn" data-a="sp-close">'+I.x+'</button></div>'
    +'<div class="ov-body"><div class="card">'+(avg!=null?'<div class="big">'+avg+'<small>점</small></div>':'<div class="big" style="font-size:1.6rem">—</div>')+'<div class="muted" style="text-align:center;margin-top:.3rem">'+msg+'</div></div>'
    +'<h2>이번에 연습한 문장</h2><div class="card">'+rows+'</div>'
    +'<div class="row" style="gap:.5rem;margin-top:.8rem"><button class="btn grow" data-a="sp-close">닫기</button><button class="btn pri grow" data-a="sp-start">한 번 더</button></div></div>');
}

H.smode=el=>{UI.smode=el.dataset.v;KA.render();};
H.scat=el=>{UI.scat=el.dataset.v;KA.render(true);};
H.slv=el=>{UI.slv=el.dataset.v;KA.render(true);};
H.shsrc=el=>{UI.shsrc=el.dataset.v;KA.render(true);};
H['free-list']=()=>{UI.tab='speak';UI.smode='free';KA.render();};
KA.startSession=function(mode,q){
  if(!q||!q.length)return;
  KA.stopAudio();
  SP={mode:mode,q:q,i:0,res:[],tok:Date.now()+Math.random(),phase:'ask',hide:false,h:null};
  begin();
  KA.onClose=()=>{if(SP)SP.tok=0;SP=null;KA.render(true);};
};
H['sp-start']=()=>{KA.startSession(UI.smode,buildQ());};
H['sp-close']=()=>KA.closeOv();
H['sp-mic']=()=>{if(!SP)return;if(SP.listening){if(SP.h)SP.h.stop();return;}mic();};
H['sp-hint']=()=>{if(!SP)return;SP.showAns=true;drawSP();};
H['sp-hide']=()=>{if(!SP)return;SP.hide=!SP.hide;drawSP();};
H['sp-reveal']=()=>{if(!SP)return;SP.phase='fb';SP.rec=null;SP.res[SP.i]={ja:KA.fill(SP.q[SP.i].ja),ko:SP.q[SP.i].ko,sc:null};drawSP();};
H['sp-retry']=()=>{if(!SP)return;KC.stopSay();SP.phase='ask';SP.rec=null;SP.heard='';SP.err='';drawSP();mic();};
H['sp-next']=()=>{
  if(!SP)return;
  KC.stopSay();KC.stopListen();
  if(SP.i+1>=SP.q.length){finish();return;}
  SP.i++;begin();
};
})();
