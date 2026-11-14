(function(W){
'use strict';
const CATS={greet:'인사·표현',pron:'대명사·의문사',people:'사람·가족',time:'시간·날짜',num:'숫자·수량',food:'음식',nature:'자연·동물',place:'장소',trans:'탈것·길',body:'몸·건강',thing:'물건',school:'학교·일·활동',verb:'동사',iadj:'い형용사',naadj:'な형용사',adv:'부사·접속',pos:'위치·방향'};

function parseV(raw,lv){
  return raw.trim().split('\n').filter(l=>l&&!l.startsWith('//')).map(l=>{
    const p=l.split('|');
    return {w:p[0],r:p[1],m:p[2],c:p[3],g:p[4]?+p[4]:0,lv:lv,k:p[0]+'|'+p[1]};
  });
}
const seen=new Set();
const VOCAB=[].concat(parseV(W.V5||'','n5'),parseV(W.V4||'','n4')).filter(x=>{
  if(seen.has(x.k))return false; seen.add(x.k); return true;});

function parseK(raw){
  return raw.trim().split('\n').filter(l=>l&&!l.startsWith('//')).map(l=>{
    const p=l.split('|');
    return {c:p[0],h:p[1],on:p[2],kun:p[3],ex:p[4].split('/').map(e=>{const q=e.split(';');return {w:q[0],r:q[1],m:q[2]};})};
  });
}
const KANJI=parseK(W.K5||'');

// ---------- 가나 ----------
const toKata=s=>s.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
function kset(list,type){
  return list.filter(Boolean).map(a=>({c:type==='k'?toKata(a[0]):a[0],r:a[1],t:type}));
}
const KANA={
  basic:{h:kset(W.HIRA_BASIC||[],'h'),k:kset(W.HIRA_BASIC||[],'k')},
  daku:{h:kset(W.HIRA_DAKU||[],'h'),k:kset(W.HIRA_DAKU||[],'k')},
  yoon:{h:kset(W.HIRA_YOON||[],'h'),k:kset(W.HIRA_YOON||[],'k')},
  extra:{k:kset([],'k').concat((W.KATA_EXTRA||[]).map(a=>({c:a[0],r:a[1],t:'k'})))}
};

// ---------- 활용 ----------
const GODAN={
 'う':{a:'わ',i:'い',e:'え',o:'お',te:'って'},
 'つ':{a:'た',i:'ち',e:'て',o:'と',te:'って'},
 'る':{a:'ら',i:'り',e:'れ',o:'ろ',te:'って'},
 'く':{a:'か',i:'き',e:'け',o:'こ',te:'いて'},
 'ぐ':{a:'が',i:'ぎ',e:'げ',o:'ご',te:'いで'},
 'す':{a:'さ',i:'し',e:'せ',o:'そ',te:'して'},
 'む':{a:'ま',i:'み',e:'め',o:'も',te:'んで'},
 'ぶ':{a:'ば',i:'び',e:'べ',o:'ぼ',te:'んで'},
 'ぬ':{a:'な',i:'に',e:'ね',o:'の',te:'んで'}
};
const VFORMS={masu:'ます형',nai:'ない형',te:'て형',ta:'た형',pot:'가능형',vol:'의지형',ba:'ば형',imp:'명령형',pass:'수동형',caus:'사역형'};
const AFORMS={neg:'부정 (~くない/じゃない)',past:'과거',pastneg:'과거 부정',te:'て형',adv:'부사형 (~く/に)'};

function teToTa(te){return te.replace(/って$/,'った').replace(/んで$/,'んだ').replace(/いて$/,'いた').replace(/いで$/,'いだ').replace(/して$/,'した');}

// str: 활용할 문자열(한자 포함 가능), kana: 같은 단어의 히라가나 읽기, g: 그룹
function conjVerb(str,kana,g,f,forceG){
  g=forceG||g;
  if(f==='dict')return str;
  if(g===3){
    if(kana.endsWith('くる')){
      const m={masu:'きます',nai:'こない',te:'きて',ta:'きた',pot:'こられる',vol:'こよう',ba:'くれば',imp:'こい',pass:'こられる',caus:'こさせる'}[f];
      return str.endsWith('来る')?str.slice(0,-2)+'来'+m.slice(1):str.slice(0,-2)+m;
    }
    const m={masu:'します',nai:'しない',te:'して',ta:'した',pot:'できる',vol:'しよう',ba:'すれば',imp:'しろ',pass:'される',caus:'させる'}[f];
    return str.slice(0,-2)+m;
  }
  if(g===2){
    const s=str.slice(0,-1);
    const m={masu:'ます',nai:'ない',te:'て',ta:'た',pot:'られる',vol:'よう',ba:'れば',imp:'ろ',pass:'られる',caus:'させる'}[f];
    return s+m;
  }
  const last=str.slice(-1), base=str.slice(0,-1), t=GODAN[last];
  if(!t)return str;
  const iku=/いく$/.test(kana)||/^行く$/.test(str)||/行く$/.test(str);
  const te=(last==='く'&&iku)?'って':t.te;
  switch(f){
    case 'masu':return base+t.i+'ます';
    case 'nai':return (kana==='ある')?'ない':base+t.a+'ない';
    case 'te':return base+te;
    case 'ta':return base+teToTa(te);
    case 'pot':return base+t.e+'る';
    case 'vol':return base+t.o+'う';
    case 'ba':return base+t.e+'ば';
    case 'imp':return base+t.e;
    case 'pass':return base+t.a+'れる';
    case 'caus':return base+t.a+'せる';
  }
  return str;
}
function iStem(s){return s.endsWith('いい')?s.slice(0,-2)+'よ':s.slice(0,-1);}
function conjAdj(str,type,f){
  if(type==='iadj'){
    const b=iStem(str);
    return {neg:b+'くない',past:b+'かった',pastneg:b+'くなかった',te:b+'くて',adv:b+'く'}[f];
  }
  return {neg:str+'じゃない',past:str+'だった',pastneg:str+'じゃなかった',te:str+'で',adv:str+'に'}[f];
}
// 오답 후보 (한자 표기 t + 읽기 s 쌍)
function wrongPairs(item,f,answerW){
  const gen=(s)=>{
    const out=[];
    if(item.c==='verb'){
      const g=item.g;
      ['masu','nai','te','ta','pot','vol','ba','imp','pass','caus'].forEach(o=>{if(o!==f)out.push(conjVerb(s,item.r,g,o));});
      if(g===1){
        const base=s.slice(0,-1);
        out.push(conjVerb(s,item.r,2,f));
        if(f==='te'||f==='ta'){['って','んで','いて','いで','して'].forEach(te=>out.push(base+(f==='ta'?teToTa(te):te)));}
        if(f==='nai'){['ら','わ','り','か','ま'].forEach(a=>out.push(base+a+'ない'));}
      }else if(g===2){
        out.push(conjVerb(s,item.r,1,f));
      }
    }else{
      const other=item.c==='iadj'?'naadj':'iadj';
      if(item.c==='naadj')out.push(s+({neg:'くない',past:'かった',pastneg:'くなかった',te:'くて',adv:'く'})[f]);
      else out.push(conjAdj(s,other,f));
      ['neg','past','pastneg','te','adv'].forEach(o=>{if(o!==f)out.push(conjAdj(s,item.c,o));});
    }
    return out;
  };
  const A=gen(item.w),B=gen(item.r),seenS=new Set([answerW]),pairs=[];
  for(let i=0;i<A.length;i++){if(A[i]&&!seenS.has(A[i])){seenS.add(A[i]);pairs.push({t:A[i],s:B[i]});}}
  return pairs;
}
const HINT={
 masu:{1:'어미를 い단으로 바꾸고 ます (飲む→飲みます)',2:'る를 떼고 ます (食べる→食べます)',3:'する→します / 来る→来ます(きます)'},
 nai:{1:'어미를 あ단으로 바꾸고 ない (う→わ: 買う→買わない)',2:'る를 떼고 ない',3:'する→しない / 来る→来ない(こない)'},
 te:{1:'う·つ·る→って / む·ぶ·ぬ→んで / く→いて / ぐ→いで / す→して (行く는 行って!)',2:'る를 떼고 て',3:'する→して / 来る→来て(きて)'},
 ta:{1:'て형의 て→た, で→だ로 (って→った, んで→んだ, いて→いた)',2:'る를 떼고 た',3:'する→した / 来る→来た(きた)'},
 pot:{1:'어미를 え단으로 바꾸고 る (飲む→飲める)',2:'る를 떼고 られる (食べる→食べられる)',3:'する→できる / 来る→来られる'},
 vol:{1:'어미를 お단으로 바꾸고 う (飲む→飲もう)',2:'る를 떼고 よう (食べる→食べよう)',3:'する→しよう / 来る→来よう(こよう)'},
 ba:{1:'어미를 え단으로 바꾸고 ば (飲む→飲めば)',2:'る를 떼고 れば',3:'する→すれば / 来る→来れば(くれば)'},
 imp:{1:'어미를 え단으로 (飲む→飲め)',2:'る를 ろ로 (食べる→食べろ)',3:'する→しろ / 来る→来い(こい)'},
 pass:{1:'어미를 あ단으로 바꾸고 れる (飲む→飲まれる)',2:'る를 떼고 られる',3:'する→される / 来る→来られる'},
 caus:{1:'어미를 あ단으로 바꾸고 せる (飲む→飲ませる)',2:'る를 떼고 させる',3:'する→させる / 来る→来させる'}
};
const AHINT={
 iadj:{neg:'い를 떼고 くない (高い→高くない) ※いい→よくない',past:'い를 떼고 かった',pastneg:'い를 떼고 くなかった',te:'い를 떼고 くて',adv:'い를 떼고 く'},
 naadj:{neg:'~じゃない (ではない)',past:'~だった',pastneg:'~じゃなかった',te:'~で',adv:'~に'}
};

// ---------- SRS ----------
const INTERVALS=[0,1,2,4,7,14,30,60];
function srsNext(card,q){
  // q: 0 다시, 1 어려움, 2 알아요, 3 쉬워요
  let b=card?card.b:0;
  if(q===0)b=0; else if(q===1)b=Math.max(1,b); else if(q===2)b=Math.min(7,b+1); else b=Math.min(7,b+2);
  if(q>=2&&b<1)b=1;
  return b;
}
function srsDays(b,q){
  if(q===0)return 0;
  if(q===1)return 1;
  return INTERVALS[b];
}

W.CORE={CATS,VOCAB,KANJI,KANA,VFORMS,AFORMS,conjVerb,conjAdj,wrongPairs,HINT,AHINT,srsNext,srsDays,INTERVALS,toKata,teToTa};
if(typeof module!=='undefined')module.exports=W.CORE;
})(typeof window!=='undefined'?window:globalThis);
