/* 일어 회화 — 4) 말하기 탭 (한국어 보고 일본어로 말하기) */
(function(){
'use strict';
const KC=window.KC,KA=window.KA,esc=KA.esc,$=KA.$,I=KA.I,H=KA.H;
const SPEAK=window.SPEAK||[];
const SPC=[['all','섞어서'],['daily','일상'],['travel','여행'],['life','생활'],['work','직장'],['opinion','의견']];
let SP=null;
(KA.hooks=KA.hooks||[]).push(()=>{if(SP&&SP.listening){SP.listening=false;SP.h=null;drawSP();}});

KA.vSpeak=function(){
  return KA.srWarn()
    +'<div class="card c-blue" style="margin-top:.4rem"><div class="px" style="margin-bottom:.15rem">한국어를 보고 일본어로 말해요</div><div class="muted">주제를 고르면 10문장이 나와요. 말하고 나면 정답과 비교해서 틀린 글자를 알려 줘요.</div></div>'
    +SPC.map(c=>{
      const n=c[0]==='all'?SPEAK.length:SPEAK.filter(x=>x.c===c[0]).length;
      return '<button class="sitem" data-a="sp-start" data-c="'+c[0]+'"><span class="grow"><div class="t">'+esc(c[1])+'</div><div class="s">총 '+n+'문장</div></span>'+I.chev+'</button>';
    }).join('');
};

function buildQ(c){
  const S=KA.S;
  let pool=SPEAK.filter(x=>c==='all'||x.c===c);
  if(!pool.length)pool=SPEAK;
  pool=KC.shuffle(pool).sort((a,b)=>(S.sp[a.id]||0)-(S.sp[b.id]||0));
  return pool.slice(0,10).map(x=>({id:x.id,ko:x.ko,ja:x.ja,alts:x.alts}));
}

function fbHtml(){
  const last=SP.i+1>=SP.q.length,nx=last?'결과 보기':'다음';
  const r=SP.rec,g=KC.grade(r.score);
  return '<div class="fbk g'+g.lv+'"><div class="vd"><b>'+g.t+'</b><span class="sc">'+Math.round(r.score*100)+'%</span></div><div class="df">'+KC.diffHtml(r.t,r,esc)+'</div>'
    +'<div class="hrd">인식된 말: <b>'+esc(SP.heard)+'</b></div>'
    +'<div class="fbtn"><button class="btn sm" data-a="sp-retry">다시 말하기</button><button class="btn sm pri" data-a="sp-next">'+nx+'</button></div></div>';
}
function drawSP(){
  if(!SP)return;
  const q=SP.q[SP.i],ja=KA.fill(q.ja),last=SP.i+1>=SP.q.length;
  const pct=Math.round(SP.i/SP.q.length*100);
  const showAns=SP.showAns||SP.phase==='fb';
  const card='<div class="pcard"><div class="lb">일본어로 말해 보세요</div><div class="ko">'+esc(q.ko)+'</div>'
    +(showAns?'<div class="ans"><div class="j">'+esc(ja)+'</div><div class="acts">'+KA.spBtn(ja)+'</div></div>':'<div class="acts"><button class="btn sm blue" data-a="sp-hint">정답 힌트 보기</button></div>')+'</div>';
  let mic='';
  if(KC.srOk){
    mic='<div class="say" style="'+((SP.listening||SP.heard)?'':'visibility:hidden')+'"><div class="l">내가 말한 것</div><div class="t" id="sp-t">'+esc(SP.listening?SP.interim:SP.heard)+'</div></div>'
      +(SP.phase==='fb'?fbHtml():'<div class="mrow" style="justify-content:center;flex-direction:column;gap:.5rem"><button class="mic'+(SP.listening?' on':'')+'" data-a="sp-mic" style="width:4.2rem;height:4.2rem" aria-label="말하기">'+(SP.listening?I.stop:I.mic)+'</button><div class="muted">'+(SP.listening?'듣고 있어요…':'눌러서 말하세요')+'</div></div>')
      +(SP.err?'<div class="hrd err tc" style="margin-top:.5rem">'+esc(SP.err)+'</div>':'');
  }else{
    mic=KA.srWarn()+(SP.phase==='fb'?'<button class="btn pri full" data-a="sp-next">'+(last?'결과 보기':'다음')+'</button>':'<button class="btn pri full" data-a="sp-reveal">정답 보기</button>');
  }
  KA.setOv('<div class="ov-top"><button class="ibtn" data-a="sp-close" aria-label="닫기">'+I.x+'</button><div class="grow"><div class="bar"><i style="width:'+pct+'%"></i></div></div><span class="muted">'+(SP.i+1)+'/'+SP.q.length+'</span></div>'
    +'<div class="ov-body">'+card+mic+'</div>');
}
function begin(){
  if(!SP)return;
  SP.phase='ask';SP.rec=null;SP.heard='';SP.err='';SP.interim='';SP.listening=false;SP.showAns=false;
  drawSP();
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
      KA.save();
      drawSP();
      if(S.voice)KA.say(KA.fill(q.ja));
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
  KA.setOv('<div class="ov-top"><b class="grow px" style="font-size:1.05rem">연습 결과</b><button class="ibtn" data-a="sp-close" aria-label="닫기">'+I.x+'</button></div>'
    +'<div class="ov-body"><div class="card">'+(avg!=null?'<div class="big">'+avg+'<small>점</small></div>':'<div class="big" style="font-size:1.6rem">—</div>')+'<div class="muted tc" style="margin-top:.3rem">'+msg+'</div></div>'
    +'<h2>이번에 연습한 문장</h2><div class="card">'+rows+'</div>'
    +'<div class="row" style="gap:.5rem;margin-top:.8rem"><button class="btn grow" data-a="sp-close">닫기</button><button class="btn pri grow" data-a="sp-again">한 번 더</button></div></div>');
}

function start(c){
  const q=buildQ(c);if(!q.length)return;
  KA.stopAudio();
  SP={c:c,q:q,i:0,res:[],tok:Date.now()+Math.random(),phase:'ask',h:null};
  begin();
  KA.onClose=()=>{if(SP)SP.tok=0;SP=null;KA.render(true);};
}
H['sp-start']=el=>start(el.dataset.c||'all');
H['sp-again']=()=>{if(SP)start(SP.c);};
H['sp-close']=()=>KA.closeOv();
H['sp-mic']=()=>{if(!SP)return;if(SP.listening){if(SP.h)SP.h.stop();return;}mic();};
H['sp-hint']=()=>{if(!SP)return;SP.showAns=true;drawSP();};
H['sp-reveal']=()=>{if(!SP)return;SP.phase='fb';SP.rec=null;SP.res[SP.i]={ja:KA.fill(SP.q[SP.i].ja),ko:SP.q[SP.i].ko,sc:null};drawSP();};
H['sp-retry']=()=>{if(!SP)return;KC.stopSay();SP.phase='ask';SP.rec=null;SP.heard='';SP.err='';drawSP();mic();};
H['sp-next']=()=>{
  if(!SP)return;
  KC.stopSay();KC.stopListen();
  if(SP.i+1>=SP.q.length){finish();return;}
  SP.i++;begin();
};
})();
