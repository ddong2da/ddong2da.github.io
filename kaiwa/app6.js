/* 일어 회화 — 6) 화면 그리기 · 이벤트 · 설정 처리 · 시작 */
(function(){
'use strict';
const KC=window.KC,KA=window.KA,$=KA.$,H=KA.H,UI=KA.UI;

function renderTabs(){
  $('#tabs').innerHTML=KA.tabs.map(t=>'<button class="'+(UI.tab===t[0]?'on':'')+'" data-a="tab" data-v="'+t[0]+'"><b>'+t[1]+'</b><span>'+t[2]+'</span></button>').join('');
}
KA.render=function(keep){
  const main=$('#view'),st=main.scrollTop;
  const fn={talk:KA.vTalk,speak:KA.vSpeak,expr:KA.vExpr}[UI.tab]||KA.vTalk;
  main.innerHTML=fn();
  main.scrollTop=keep?st:0;
  renderTabs();
};
function reopen(){
  const sh=KA.sheetEl(),top=sh&&sh.firstChild?sh.firstChild.scrollTop:0;
  KA.openSettings();
  const n=KA.sheetEl();if(n&&n.firstChild)n.firstChild.scrollTop=top;
}

H.tab=el=>{
  const v=el.dataset.v;
  if(UI.tab===v&&v==='expr')UI.eg=null;
  UI.tab=v;KA.render();
};
H.say=el=>{KA.say(el.dataset.t);};
H.settings=()=>KA.openSettings();
H.closeSheet=()=>KA.closeSheet();
H['set-scale']=el=>{KA.S.scale=el.dataset.v;KA.save();KA.applyLook();reopen();};
H['set-rate']=el=>{
  const v=el.dataset.v;
  if(v==='off'){KA.S.voice=false;}
  else{KA.S.voice=true;KA.S.rate=+v;}
  KA.save();reopen();
  if(KA.S.voice)KA.say('こんにちは。');
};
H['set-voice']=el=>{KA.S.vuri=el.dataset.v;KA.save();reopen();KA.say('こんにちは。');};
H.more=()=>{KA.toggleMore();reopen();};
H.font=el=>{
  KA.S[el.dataset.k]=el.dataset.v;KA.save();KA.applyLook();
  el.parentElement.querySelectorAll('.fopt').forEach(b=>b.classList.toggle('on',b===el));
};
H['tts-test']=()=>{KA.say('こんにちは。今日もよろしくお願いします。');};
H['mic-test']=()=>{
  const box=$('#mt'),t=$('#mt-t');
  if(!KC.srOk){KA.toast(KC.errText('unsupported'));return;}
  if(box)box.style.display='block';
  if(t)t.textContent='듣고 있어요… 아무 말이나 해 보세요';
  KC.stopSay();
  KC.listen({
    interim:s=>{const e=$('#mt-t');if(e)e.textContent=s;},
    end:(alts,err)=>{const e=$('#mt-t');if(e)e.textContent=alts.length?alts[0]:KC.errText(err);}
  });
};
H['bk-sel']=()=>{const t=$('#bk');if(t){t.focus();t.select();}};
H['bk-copy']=()=>{
  const t=$('#bk');
  try{navigator.clipboard.writeText(t.value).then(()=>KA.toast('복사했어요'),()=>{t.select();KA.toast('길게 눌러서 복사해 주세요');});}
  catch(e){t.select();KA.toast('길게 눌러서 복사해 주세요');}
};
H['bk-load']=()=>{
  const t=$('#bk-in');
  if(t&&KA.importCode(t.value)){KA.closeSheet();KA.applyLook();KA.render();KA.toast('복원했어요');}
  else KA.toast('코드가 올바르지 않아요');
};
H.reset=el=>{
  if(el.dataset.c!=='1'){el.dataset.c='1';el.textContent='정말 지울까요? 한 번 더 누르면 지워져요';return;}
  KA.resetAll();KA.closeSheet();KA.applyLook();KA.render();KA.toast('초기화했어요');
};

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]');if(!el)return;
  const f=H[el.dataset.a];if(f)f(el);
});
document.addEventListener('input',e=>{
  if(e.target.id==='nm'){KA.S.name=e.target.value;KA.save();}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.id==='fr-in'){e.preventDefault();if(H['fr-send'])H['fr-send']();}
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){KA.stopAudio();(KA.hooks||[]).forEach(f=>{try{f();}catch(e){}});}
});

KA.applyLook();
KA.render();
})();
