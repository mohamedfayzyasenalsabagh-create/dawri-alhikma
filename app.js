import { firebaseConfig } from './config.js';
const V='10.12.2';
const IN_APP=/DawriAlhikmaApp/.test(navigator.userAgent);
(async function(){
var MODE=document.body.getAttribute('data-mode')||'public';
var app=document.getElementById('app');
var fb=null,user=null,remote=null,showPw=false,pwMsg='',S=null,pw='',admin=false,tab='table',open=null,draft=null,confirmDel=null,saving=false,msg='',msgKind='',loginErr='',loadErr=false;
try{tab=localStorage.getItem('hk_tab')||'table'}catch(e){}
var DAYS=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function team(id){for(var i=0;i<S.teams.length;i++)if(S.teams[i].id===id)return S.teams[i];return null}
function tname(m,side){if(m.special)return side==='a'?m.la:m.lb;var t=team(side==='a'?m.a:m.b);return t?t.name:'فريق محذوف'}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function isPlayed(m){return !!m.forfeit||(m.ga!=null&&m.gb!=null)}
function counts(m){return !m.special&&isPlayed(m)&&team(m.a)&&team(m.b)}
function score(m){if(m.forfeit==='a')return[0,3];if(m.forfeit==='b')return[3,0];return[m.ga,m.gb]}
function dLabel(d){var p=(d||'').split('-');if(p.length<3)return {day:'',short:d||''};var dt=new Date(+p[0],+p[1]-1,+p[2]);return {day:DAYS[dt.getDay()],short:(+p[2])+'/'+(+p[1])}}
function tLabel(t){if(!t)return '';var p=t.split(':');var h=+p[0],mm=p[1]||'00';var h12=h>12?h-12:(h===0?12:h);return h12+(mm==='00'?'':':'+mm)}
function standings(){
  var rows={};S.teams.forEach(function(t){rows[t.id]={id:t.id,name:t.name,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}});
  var lm=S.matches.filter(counts);
  lm.forEach(function(m){var A=rows[m.a],B=rows[m.b],s=score(m),x=s[0],y=s[1];
    A.p++;B.p++;A.gf+=x;A.ga+=y;B.gf+=y;B.ga+=x;
    if(x>y){A.w++;B.l++;A.pts+=3}else if(x<y){B.w++;A.l++;B.pts+=3}else{A.d++;B.d++;A.pts++;B.pts++}});
  function h2h(a,b){var pa=0,pb=0;lm.forEach(function(m){var ab=m.a===a.id&&m.b===b.id,ba=m.a===b.id&&m.b===a.id;if(!ab&&!ba)return;var s=score(m),ga=ab?s[0]:s[1],gb=ab?s[1]:s[0];if(ga>gb)pa+=3;else if(gb>ga)pb+=3;else{pa++;pb++}});return pb-pa}
  return Object.keys(rows).map(function(k){return rows[k]}).sort(function(a,b){return b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||h2h(a,b)||a.name.localeCompare(b.name,'ar')});
}
function fairplay(){
  var rows={};S.teams.forEach(function(t){rows[t.id]={name:t.name,y:0,r:0,p:0}});
  S.matches.forEach(function(m){if(m.special)return;if(rows[m.a]){rows[m.a].y+=m.ya||0;rows[m.a].r+=m.ra||0}if(rows[m.b]){rows[m.b].y+=m.yb||0;rows[m.b].r+=m.rb||0}});
  return Object.keys(rows).map(function(k){var r=rows[k];r.p=r.y+r.r*3;return r}).sort(function(a,b){return a.p-b.p||a.r-b.r||a.name.localeCompare(b.name,'ar')});
}
var TROPHY='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 6h20v10a10 10 0 0 1-20 0z" fill="#f0b43a"/><path d="M14 9H7a7 7 0 0 0 8 9M34 9h7a7 7 0 0 1-8 9" fill="none" stroke="#f0b43a" stroke-width="3"/><rect x="21" y="25" width="6" height="8" fill="#f0b43a"/><rect x="14" y="33" width="20" height="6" rx="2" fill="#f0b43a"/></svg>';
function cardDots(y,r){var s='';for(var i=0;i<(y||0);i++)s+='<i class="y"></i>';for(var j=0;j<(r||0);j++)s+='<i class="r"></i>';return s?'<span class="cards" aria-label="'+(y||0)+' أصفر، '+(r||0)+' أحمر">'+s+'</span>':''}
function headerHtml(){
  return '<header class="top"><div class="crest"><img src="logo.png" alt="ثانوية دار الحكمة"></div><div class="ttl"><h1>دوري الحكمة</h1><p class="sub">ثانوية دار الحكمة'+(S?' · '+S.teams.length+' فريق':'')+(MODE==='admin'?' · لوحة الإدارة':'')+'</p></div>'+
    (MODE==='admin'&&admin?'<button class="adminbtn" data-act="pwform">كلمة السر</button><button class="adminbtn" data-act="logout">خروج</button>':'')+'</header>';
}
function render(){
  if(MODE==='admin'&&!admin){renderLogin();return}
  if(!S){app.innerHTML=headerHtml()+'<section class="sheet"><div class="empty">'+(loadErr?'ما قدرنا نحمّل البيانات. تأكد من الإنترنت وحدّث الصفحة.':'جاري تحميل الدوري…')+'</div></section>';return}
  var st=standings(),league=S.matches.filter(function(m){return !m.special}),playedN=league.filter(isPlayed).length;
  var h=headerHtml();
  if(admin&&showPw)h+='<section class="sheet"><div class="hd"><h2>تغيير كلمة السر</h2></div><form class="form" data-form="newpw"><label>كلمة السر الجديدة<input type="password" id="np1" minlength="6" autocomplete="new-password" required></label><label>أعد كتابتها<input type="password" id="np2" minlength="6" autocomplete="new-password" required></label>'+(pwMsg?'<p class="full toast">'+esc(pwMsg)+'</p>':'')+'<div class="full btns"><button class="btn pri" type="submit">حفظ كلمة السر</button><button class="btn" type="button" data-act="pwclose">إلغاء</button></div></form></section>';
  if(msg)h+='<div class="toast'+(msgKind==='ok'?' ok':'')+'" role="status">'+esc(msg)+'</div>';
  if(MODE==='public'&&!IN_APP)h+='<a class="getapp" href="dawri-alhikma.apk" download><img src="logo.png" alt=""><span class="gt"><b>حمّل تطبيق دوري الحكمة</b><small>للأندرويد · النتائج والترتيب أول بأول</small></span><span class="dl">تنزيل</span></a>';
  var top=st[0];
  if(top&&top.p>0){var done=league.length>0&&playedN===league.length;
    h+='<section class="leader">'+TROPHY+'<div><div class="lab">'+(done?'بطل الدوري':'المتصدر حالياً')+'</div><div class="nm">'+esc(top.name)+'</div></div><div class="pts"><b>'+top.pts+'</b><span class="lab">نقطة</span></div></section>';}
  else h+='<section class="leader">'+TROPHY+'<div><div class="lab">انطلاق الدوري</div><div class="nm">بانتظار أول نتيجة</div></div></section>';
  h+='<div class="progress"><span>'+playedN+' من '+league.length+' مباراة انلعبت</span><div class="bar"><i style="width:'+(league.length?Math.round(playedN/league.length*100):0)+'%"></i></div></div>';
  var tabs=[['table','الترتيب'],['matches','المباريات'],['scorers','الهدافين'],['teams','الفرق'],['fair','اللعب النظيف'],['rules','القوانين']];
  h+='<nav class="tabs" role="tablist">'+tabs.map(function(t){return '<button role="tab" data-act="tab" data-v="'+t[0]+'" aria-selected="'+(tab===t[0])+'">'+t[1]+'</button>'}).join('')+'</nav>';
  if(admin)h+='<p class="adminhint">اضغط على أي مباراة لتسجيل نتيجتها. كل تعديل بينحفظ فوراً وبيبين عند الجمهور.'+(saving?' <b>جاري الحفظ…</b>':'')+'</p>';
  if(tab==='table')h+=vTable(st);else if(tab==='matches')h+=vMatches();else if(tab==='scorers')h+=vScorers();else if(tab==='teams')h+=vTeams();else if(tab==='fair')h+=vFair();else h+=vRules();
  h+='<footer>'+(MODE==='public'?'<a class="adminlink" href="admin.html">دخول المشرف</a> · ':'')+(S.updated?'آخر تحديث: '+esc(new Date(S.updated).toLocaleString('ar-SY',{weekday:'long',hour:'numeric',minute:'2-digit',day:'numeric',month:'numeric'})):'')+'</footer>';
  app.innerHTML=h;
}
function renderLogin(){
  app.innerHTML=headerHtml()+'<section class="sheet"><div class="hd"><h2>دخول المشرف</h2></div><form class="form" data-form="login"><label class="full">الإيميل<input type="email" id="em" autocomplete="username" dir="ltr" required></label><label class="full">كلمة السر<input type="password" id="pw" autocomplete="current-password" required></label>'+(loginErr?'<p class="full toast">'+esc(loginErr)+'</p>':'')+'<div class="full btns"><button class="btn pri" type="submit">دخول</button><button class="btn" type="button" data-act="reset">نسيت كلمة السر</button><a class="btn" href="./">صفحة الجمهور</a></div></form></section>';
}
function vTable(st){
  var h='<section class="sheet"><div class="hd"><h2>جدول الترتيب</h2><span class="note">فوز 3 · تعادل 1 · خسارة 0</span></div><div class="scroll"><table><thead><tr><th>#</th><th class="team">الفريق</th><th>لعب</th><th>ف</th><th>ت</th><th>خ</th><th>له:عليه</th><th>الفارق</th><th>نقاط</th></tr></thead><tbody>';
  var anyPlayed=st.some(function(r){return r.p>0}),cut=st.length>3&&anyPlayed?st.length-3:99;
  st.forEach(function(r,i){var gd=r.gf-r.ga;h+='<tr class="'+(i===0&&r.p>0?'first':'')+(i>=cut?' out':'')+'"><td class="rank">'+(i+1)+'</td><td class="team">'+esc(r.name)+'</td><td>'+r.p+'</td><td>'+r.w+'</td><td>'+r.d+'</td><td>'+r.l+'</td><td><span class="gg"><b>'+r.gf+'</b><i>:</i><b>'+r.ga+'</b></span></td><td style="direction:ltr">'+(gd>0?'+':'')+gd+'</td><td class="pts">'+r.pts+'</td></tr>'});
  if(!st.length)h+='<tr><td colspan="9" class="empty">ما في فرق بعد.</td></tr>';
  h+='</tbody></table></div><div class="hd" style="border-top:1px solid var(--line);border-bottom:0">'+(cut<99?'<span class="note out-note" style="margin:0"><i></i>آخر 3 فرق بالأحمر: خارج التأهيل</span>':'')+'<span class="note" style="margin:0">عند تساوي النقاط: فارق الأهداف، ثم الأهداف المسجلة، ثم المواجهة المباشرة</span></div></section>';
  if(admin){
    h+='<section class="sheet"><div class="hd"><h2>إدارة الفرق</h2></div><div class="list">';
    S.teams.forEach(function(t){var used=S.matches.some(function(m){return m.a===t.id||m.b===t.id});
      var taken={};S.teams.forEach(function(o){if(o.id!==t.id&&o.roster)taken[o.roster]=o.name});
      var ropts='<option value="">— اختار الصف والشعبة —</option>'+ROSTERS.map(function(r){return '<option value="'+r.id+'"'+(t.roster===r.id?' selected':'')+'>'+esc(rLabel(r))+(taken[r.id]?' · مربوط بـ '+esc(taken[r.id]):'')+'</option>'}).join('');
      h+='<div class="row tm"><div class="grow"><input type="text" id="tn-'+t.id+'" value="'+esc(t.name)+'" data-act="rename" data-id="'+t.id+'" aria-label="اسم الفريق">'+
      '<select id="tr-'+t.id+'" data-act="setroster" data-id="'+t.id+'" aria-label="الصف والشعبة">'+ropts+'</select>'+
      '<small>'+(t.players&&t.players.length?t.players.length+' لاعب'+(t.captain?' · الكابتن: '+esc(t.captain):''):'ما في لاعبين بعد')+'</small>'+
      '<div class="addp"><input type="text" id="np-'+t.id+'" placeholder="إضافة لاعب" aria-label="اسم لاعب جديد"><button class="btn sm" data-act="addplayer" data-id="'+t.id+'">إضافة</button></div>'+
      (t.players&&t.players.length?'<div class="chips">'+t.players.map(function(n,j){return '<span class="chip">'+esc(n)+'<button data-act="delplayer" data-id="'+t.id+'" data-k="'+j+'" aria-label="حذف '+esc(n)+'">×</button></span>'}).join('')+'</div>':'')+
      '</div>'+
      (used?'<span class="tag">له مباريات</span>':'<button class="btn sm dan" data-act="delteam" data-id="'+t.id+'">'+(confirmDel==='t'+t.id?'تأكيد الحذف':'حذف')+'</button>')+'</div>'});
    h+='</div><form class="form" data-form="team"><label class="full">فريق جديد<input type="text" id="newteam" placeholder="مثلاً: ابن الهيثم" required></label><div class="full btns"><button class="btn pri" type="submit">إضافة الفريق</button></div></form></section>';
  }
  return h;
}
function matchRow(m){
  var p=isPlayed(m),s=p?score(m):null,aw=p&&s[0]>s[1],bw=p&&s[1]>s[0];
  var h='<div class="match'+(admin?' tap':'')+'"'+(admin?' data-act="open" data-id="'+m.id+'" role="button" tabindex="0"':'')+'>'+
    '<span class="tm">'+tLabel(m.time)+'</span>'+
    '<span class="a'+(aw?' won':'')+'">'+esc(tname(m,'a'))+cardDots(m.ya,m.ra)+'</span>'+
    (p?'<span class="sc"><b>'+s[0]+'</b><i>-</i><b>'+s[1]+'</b></span>':'<span class="sc vs">VS</span>')+
    '<span class="b'+(bw?' won':'')+'">'+cardDots(m.yb,m.rb)+esc(tname(m,'b'))+'</span></div>';
  var gl=mGoals(m);if(gl.length&&!m.forfeit){var ga=gl.filter(function(g){return g.side==='a'}),gb=gl.filter(function(g){return g.side==='b'});
    h+='<div class="goals"><span class="gA">'+goalLine(ga)+'</span><span></span><span class="gB">'+goalLine(gb)+'</span></div>'}
  if(m.special||m.forfeit){h+='<div style="padding:0 14px 8px;text-align:center">'+(m.special?'<span class="tag sp">مباراة استعراضية · لا تحسب بالترتيب</span>':'')+(m.forfeit?'<span class="tag ff">خسارة إدارية 0/3 لـ '+esc(tname(m,m.forfeit))+' (تأخير)</span>':'')+'</div>'}
  if(admin&&open===m.id)h+=editor(m);
  return h;
}
function stepper(k,label,cls){return '<div class="step '+(cls||'')+'"><label>'+label+'</label><button type="button" data-act="dec" data-k="'+k+'" aria-label="إنقاص '+label+'">−</button><output>'+(draft[k]||0)+'</output><button type="button" data-act="inc" data-k="'+k+'" aria-label="زيادة '+label+'">+</button></div>'}
function editor(m){
  var h='<div class="editor"><div class="ed-row">';
  [['a','ya','ra'],['b','yb','rb']].forEach(function(x){var sd=x[0],tid=sd==='a'?m.a:m.b,pl=m.special?[]:teamPlayers(tid);
    var list=draft.goals.filter(function(g){return g.side===sd});
    h+='<div class="ed-col"><span class="nm">'+esc(tname(m,sd))+' <span class="gcount">'+list.length+'</span></span>';
    h+='<div class="glist">'+(list.length?draft.goals.map(function(g,j){if(g.side!==sd)return '';return '<div class="grow1"><span>⚽ '+(g.p?esc(g.p):'غير محدد')+(g.og?' (عكسي)':'')+(g.min?' · '+g.min+'\'':'')+'</span><button type="button" class="btn sm dan" data-act="delgoal" data-k="'+j+'" aria-label="حذف الهدف">×</button></div>'}).join(''):'<small class="muted">ما في أهداف</small>')+'</div>';
    h+='<div class="gadd"><select id="gp-'+sd+'" aria-label="مين سجل">'+pl.map(function(n){return '<option>'+esc(n)+'</option>'}).join('')+'<option value="">لاعب غير محدد</option><option value="__og">هدف عكسي</option></select>'+
      '<input type="number" id="gm-'+sd+'" min="1" max="120" inputmode="numeric" placeholder="الدقيقة" aria-label="الدقيقة">'+
      '<button type="button" class="btn sm pri" data-act="addgoal" data-k="'+sd+'">+ هدف</button></div>';
    h+=stepper(x[1],'أصفر')+stepper(x[2],'أحمر')+'</div>'});
  h+='</div>';
  if(!m.special)h+='<label style="font-size:.8rem;color:var(--muted);display:flex;flex-direction:column;gap:4px">خسارة إدارية (تأخير الفريق)<select id="ff-'+m.id+'" data-act="ff"><option value="">لا يوجد</option><option value="a"'+(draft.forfeit==='a'?' selected':'')+'>'+esc(tname(m,'a'))+' متأخر — يخسر 0/3</option><option value="b"'+(draft.forfeit==='b'?' selected':'')+'>'+esc(tname(m,'b'))+' متأخر — يخسر 0/3</option></select></label>';
  h+='<div class="btns"><button class="btn pri" data-act="save">حفظ النتيجة</button><button class="btn" data-act="clear">مسح النتيجة</button><button class="btn" data-act="close">إلغاء</button><button class="btn dan" data-act="delmatch" data-id="'+m.id+'">'+(confirmDel==='m'+m.id?'تأكيد حذف المباراة':'حذف المباراة')+'</button></div></div>';
  return h;
}
function vMatches(){
  var by={};S.matches.forEach(function(m){(by[m.date]=by[m.date]||[]).push(m)});
  var dates=Object.keys(by).sort(),h='';
  if(!dates.length)h+='<section class="sheet"><div class="empty">ما في مباريات بعد.</div></section>';
  dates.forEach(function(d){var L=dLabel(d);h+='<section class="day"><h3>'+L.day+' <span>'+L.short+'</span></h3><div class="sheet">';
    var fields={};by[d].forEach(function(m){(fields[m.field]=fields[m.field]||[]).push(m)});
    Object.keys(fields).sort().forEach(function(f){h+='<div class="fieldgrp"><div class="fl">الملعب '+(f==='1'?'الأول':f==='2'?'الثاني':esc(f))+'</div>';
      fields[f].sort(function(a,b){return (a.time||'').localeCompare(b.time||'')}).forEach(function(m){h+=matchRow(m)});h+='</div>'});
    h+='</div></section>'});
  if(admin){var opts=S.teams.map(function(t){return '<option value="'+t.id+'">'+esc(t.name)+'</option>'}).join('');
    var last=dates[dates.length-1]||'';
    h+='<section class="sheet"><div class="hd"><h2>إضافة مباراة</h2></div><form class="form" data-form="match"><label>الفريق الأول<select id="nm-a" required>'+opts+'</select></label><label>الفريق الثاني<select id="nm-b" required>'+opts+'</select></label><label>التاريخ<input type="date" id="nm-d" value="'+last+'" required></label><label>الساعة<input type="time" id="nm-t" value="19:00" required></label><label class="full">الملعب<select id="nm-f"><option value="1">الملعب الأول</option><option value="2">الملعب الثاني</option></select></label><div class="full btns"><button class="btn pri" type="submit">إضافة المباراة</button></div></form></section>';}
  return h;
}
function vScorers(){
  var list=goalScorers();
  var h='<section class="sheet"><div class="hd"><h2>هدافين الدوري</h2><span class="note">بيتحسبوا لحالهن من أهداف المباريات</span></div><div class="list">';
  if(!list.length)h+='<div class="empty">ما في أهداف مسجلة بأسماء اللاعبين بعد.'+(admin?' سجّل الهدف من داخل المباراة مع اسم اللاعب والدقيقة.':'')+'</div>';
  list.forEach(function(x,i){var t=team(x.team);h+='<div class="row"><span class="medal'+(i===0?' g':'')+'">'+(i+1)+'</span><div class="grow"><b>'+esc(x.name)+'</b><small>'+esc(t?t.name:'')+(t&&t.label?' · '+esc(t.label):'')+'</small></div><span class="big">'+x.goals+'</span></div>'});
  return h+'</div></section>';
}
function vTeams(){
  var h='<section class="teams">';
  S.teams.forEach(function(t){var pl=t.players||[];
    h+='<article class="sheet tcard"><div class="hd"><h2>'+esc(t.name)+'</h2>'+(t.label?'<span class="note">'+esc(t.label)+'</span>':'')+'</div>';
    if(!pl.length)h+='<div class="empty">قائمة اللاعبين لسا ما انضافت.</div>';
    else h+='<ol class="plist">'+pl.map(function(n){return '<li>'+esc(n)+(n===t.captain?' <span class="cap">الكابتن</span>':'')+'</li>'}).join('')+'</ol>';
    h+='</article>'});
  return h+'</section>';
}
function vFair(){
  var f=fairplay(),h='<section class="sheet"><div class="hd"><h2>جائزة أفضل أخلاق</h2><span class="note">الأصفر = نقطة · الأحمر = 3 نقاط · الأقل هو الأفضل</span></div><div class="list">';
  f.forEach(function(r,i){h+='<div class="row"><span class="medal'+(i===0?' g':'')+'">'+(i+1)+'</span><div class="grow"><b>'+esc(r.name)+'</b><small>'+r.y+' أصفر · '+r.r+' أحمر</small></div><span class="big">'+r.p+'</span></div>'});
  return h+'</div></section>';
}
function vRules(){
  return '<section class="sect"><h2>قوانين دوري الحكمة</h2>'+
  '<div class="rule"><span class="ic"></span><div><h3>نظام المباريات</h3><ul><li>كل فريق يلعب مباراتين بمعدل أربع مباريات بالحد الأدنى.</li><li>الفريق المتأخر عن المباراة يخسر 0/3.</li><li>يعتبر الفريق متأخراً بعد بداية المباراة بخمس دقائق إذا حضر 5 لاعبين فقط.</li></ul></div></div>'+
  '<div class="rule"><span class="ic y"></span><div><h3>الكرت الأصفر</h3><ul><li>الخطأ اللفظي</li><li>اللعب الخشن</li><li>لمسة اليد المتعمدة</li><li>الإساءة للمنظمين أو الحكم</li></ul></div></div>'+
  '<div class="rule"><span class="ic r"></span><div><h3>الكرت الأحمر</h3><ul><li>تكرار الكرت الأصفر مرتين</li><li>الإساءة اللفظية غير الأخلاقية</li><li>تعمد إيذاء الخصم</li><li>لمس اليد في الانفرادات</li></ul><p>الكرت الأحمر يعرّض صاحبه للطرد لمدة 10 دقائق.</p></div></div>'+
  '<div class="rule"><span class="ic"></span><div><h3>اللباس</h3><ul><li>يجب أن يكون اللباس تحت الركبة حصراً، ويُمنع ارتداء الملابس إلى الركبة أو فوقها.</li><li>يُمنع التغيير داخل أرضية الملعب نهائياً؛ على اللاعب الحضور بالزي الرياضي جاهزاً.</li></ul></div></div></section>';
}
var ROSTERS=window.ROSTERS||[];
function roster(id){for(var i=0;i<ROSTERS.length;i++)if(ROSTERS[i].id===id)return ROSTERS[i];return null}
function rLabel(r){return r.label+' (كابتن: '+r.captain+')'}
function teamPlayers(id){var t=team(id);return t&&t.players?t.players:[]}
function mGoals(m){return Array.isArray(m.goals)?m.goals:[]}
function goalScorers(){
  var map={};
  S.matches.forEach(function(m){if(m.special||m.forfeit)return;mGoals(m).forEach(function(g){
    if(!g.p||g.og)return;var tid=g.side==='a'?m.a:m.b;var k=tid+'|'+g.p;
    (map[k]=map[k]||{name:g.p,team:tid,goals:0}).goals++})});
  (S.scorers||[]).forEach(function(x){var k=x.team+'|'+x.name;(map[k]=map[k]||{name:x.name,team:x.team,goals:0}).goals+=x.goals||0});
  return Object.keys(map).map(function(k){return map[k]}).filter(function(x){return x.goals>0}).sort(function(a,b){return b.goals-a.goals||a.name.localeCompare(b.name,'ar')});
}
function goalLine(list){return list.map(function(g){return '<span class="gev">⚽ '+(g.p?esc(g.p):'غير محدد')+(g.og?' (عكسي)':'')+(g.min?' <b>'+g.min+'\'</b>':'')+'</span>'}).join('')}
function findM(id){for(var i=0;i<S.matches.length;i++)if(S.matches[i].id===id)return S.matches[i]}
function setMsg(t,k){msg=t;msgKind=k||'';clearTimeout(setMsg.t);if(k==='ok')setMsg.t=setTimeout(function(){msg='';render()},2500)}
var pending=false;
async function save(){
  if(!fb||!user)return;
  if(saving){pending=true;return}
  saving=true;render();
  try{S.updated=new Date().toISOString();await fb.setDoc(fb.ref,JSON.parse(JSON.stringify(S)));setMsg('تم الحفظ','ok')}
  catch(e){if(e&&e.code==='permission-denied')setMsg('هالحساب ما عندو صلاحية يعدّل.');else setMsg('ما انحفظ التعديل، تأكد من الإنترنت وجرب مرة تانية.')}
  saving=false;
  if(pending){pending=false;save();return}
  render();
}
function applyRemote(){if(remote&&!(admin&&(open||saving))){S=remote;remote=null;render()}}
function errAr(c){return ({'auth/invalid-credential':'الإيميل أو كلمة السر غلط.','auth/wrong-password':'كلمة السر غلط.','auth/user-not-found':'ما في حساب بهالإيميل.','auth/invalid-email':'الإيميل مو مكتوب صح.','auth/too-many-requests':'محاولات كتير، استنى شوي وجرب.','auth/network-request-failed':'ما في إنترنت.','auth/weak-password':'كلمة السر ضعيفة، لازم 6 أحرف على الأقل.','auth/requires-recent-login':'لأمانك، اطلع وادخل من جديد وبعدين غيّر كلمة السر.'})[c]||'صار خطأ، جرب مرة تانية.'}
app.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');if(!el||el.tagName==='SELECT'||el.tagName==='INPUT')return;
  var a=el.getAttribute('data-act'),id=el.getAttribute('data-id'),k=el.getAttribute('data-k'),ch=false;
  if(a!=='delteam'&&a!=='delmatch'&&a!=='sdel')confirmDel=null;
  if(a==='tab'){tab=el.getAttribute('data-v');open=null;try{localStorage.setItem('hk_tab',tab)}catch(_){}}
  else if(a==='pwform'){showPw=!showPw;pwMsg=''}
  else if(a==='pwclose'){showPw=false;pwMsg=''}
  else if(a==='logout'){if(fb)fb.signOut(fb.auth);loginErr=''}
  else if(a==='reset'){var em=(document.getElementById('em')||{}).value||'';if(!em){loginErr='اكتب الإيميل أول، وبعدين اضغط «نسيت كلمة السر».';render();return}
    if(fb)fb.sendPasswordResetEmail(fb.auth,em).then(function(){loginErr='بعتنا رابط تغيير كلمة السر على الإيميل.';render()}).catch(function(e){loginErr=errAr(e.code);render()});return}
  else if(a==='open'){if(open===id)return;var m=findM(id);open=id;var dg=mGoals(m).map(function(g){return {side:g.side,p:g.p||'',min:g.min||null,og:!!g.og}});
    if(!dg.length&&!m.forfeit){for(var q=0;q<(m.ga||0);q++)dg.push({side:'a',p:'',min:null});for(var q2=0;q2<(m.gb||0);q2++)dg.push({side:'b',p:'',min:null})}
    draft={goals:dg,played:isPlayed(m),ya:m.ya||0,ra:m.ra||0,yb:m.yb||0,rb:m.rb||0,forfeit:m.forfeit||''}}
  else if(a==='addgoal'){var ps=document.getElementById('gp-'+k),pm=document.getElementById('gm-'+k);var pv=ps?ps.value:'',mv=pm&&pm.value?Math.max(1,Math.min(120,parseInt(pm.value,10)||0)):null;
    draft.goals.push({side:k,p:pv==='__og'?'':pv,og:pv==='__og',min:mv||null});draft.goals.sort(function(x,y){return (x.min||999)-(y.min||999)})}
  else if(a==='delgoal'){draft.goals.splice(+k,1)}
  else if(a==='inc'){draft[k]=(draft[k]||0)+1}
  else if(a==='dec'){draft[k]=Math.max(0,(draft[k]||0)-1)}
  else if(a==='close'){open=null;setTimeout(applyRemote)}
  else if(a==='save'){var m2=findM(open);['ya','ra','yb','rb'].forEach(function(x){m2[x]=draft[x]});
    m2.goals=draft.goals.map(function(g){var o={side:g.side,p:g.p||''};if(g.min)o.min=g.min;if(g.og)o.og=true;return o});
    m2.ga=m2.goals.filter(function(g){return g.side==='a'}).length;m2.gb=m2.goals.filter(function(g){return g.side==='b'}).length;
    m2.forfeit=draft.forfeit||null;open=null;ch=true}
  else if(a==='clear'){var m3=findM(open);m3.ga=null;m3.gb=null;m3.goals=[];m3.forfeit=null;m3.ya=m3.ra=m3.yb=m3.rb=0;open=null;ch=true}
  else if(a==='delmatch'){if(confirmDel==='m'+id){S.matches=S.matches.filter(function(m){return m.id!==id});open=null;confirmDel=null;ch=true}else confirmDel='m'+id}
  else if(a==='delteam'){if(confirmDel==='t'+id){S.teams=S.teams.filter(function(t){return t.id!==id});S.scorers=S.scorers.filter(function(s){return s.team!==id});confirmDel=null;ch=true}else confirmDel='t'+id}
  else if(a==='addplayer'){var ip=document.getElementById('np-'+id),nv=ip?ip.value.trim():'',tt=team(id);if(!nv||!tt)return;tt.players=(tt.players||[]).concat([nv]);ch=true}
  else if(a==='delplayer'){var t2=team(id);if(!t2||!t2.players)return;t2.players=t2.players.filter(function(_,j){return j!==+k});ch=true}
  else if(a==='sinc'||a==='sdec'){S.scorers.forEach(function(s){if(s.id===id)s.goals=Math.max(0,s.goals+(a==='sinc'?1:-1))});ch=true}
  else if(a==='sdel'){if(confirmDel==='s'+id){S.scorers=S.scorers.filter(function(s){return s.id!==id});confirmDel=null;ch=true}else confirmDel='s'+id}
  else return;
  if(ch)save();else render();
});
app.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches('.match.tap')){e.preventDefault();e.target.click()}});
app.addEventListener('change',function(e){var el=e.target;
  if(el.getAttribute('data-act')==='ff'){draft.forfeit=el.value}
  else if(el.getAttribute('data-act')==='setroster'){var t3=team(el.getAttribute('data-id')),r=roster(el.value);if(!t3)return;
    if(r){t3.roster=r.id;t3.label=r.label;t3.captain=r.captain;t3.players=r.players.slice()}else{t3.roster='';t3.label='';t3.captain='';t3.players=[]}save()}
  else if(el.getAttribute('data-act')==='rename'){var v=el.value.trim(),t=team(el.getAttribute('data-id'));if(v&&t&&t.name!==v){t.name=v;save()}}
});
app.addEventListener('submit',function(e){e.preventDefault();var f=e.target.getAttribute('data-form');
  if(f==='login'){var em=document.getElementById('em').value.trim(),p=document.getElementById('pw').value;
    if(!fb){loginErr='الموقع لسا عم يتجهز.';render();return}
    fb.signInWithEmailAndPassword(fb.auth,em,p).then(function(){loginErr=''}).catch(function(e){loginErr=errAr(e.code);render()});return}
  if(f==='newpw'){var n1=document.getElementById('np1').value,n2=document.getElementById('np2').value;
    if(n1.length<6){pwMsg='لازم تكون 6 أحرف أو أرقام على الأقل.';render();return}
    if(n1!==n2){pwMsg='الكلمتين مو متطابقتين.';render();return}
    fb.updatePassword(user,n1).then(function(){showPw=false;pwMsg='';setMsg('تغيرت كلمة السر. استعمل الجديدة بالمرة الجاية.','ok');render()}).catch(function(e){pwMsg=errAr(e.code);render()});return}
  if(f==='team'){var n=document.getElementById('newteam').value.trim();if(!n)return;S.teams.push({id:'t'+uid(),name:n})}
  else if(f==='match'){var a=document.getElementById('nm-a').value,b=document.getElementById('nm-b').value;if(a===b){setMsg('اختار فريقين مختلفين.');render();return}
    S.matches.push({id:'m'+uid(),a:a,b:b,date:document.getElementById('nm-d').value,time:document.getElementById('nm-t').value,field:+document.getElementById('nm-f').value,ga:null,gb:null,forfeit:null,ya:0,ra:0,yb:0,rb:0})}
  else if(f==='scorer'){var nn=document.getElementById('ns-n').value.trim();if(!nn)return;S.scorers.push({id:'s'+uid(),name:nn,team:document.getElementById('ns-t').value,goals:1})}
  save();
});
S=window.SEED?JSON.parse(JSON.stringify(window.SEED)):null;
render();
if(!firebaseConfig){fb=false;return}
try{
  const [{initializeApp},fs,au]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/'+V+'/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/'+V+'/firebase-firestore.js'),
    import('https://www.gstatic.com/firebasejs/'+V+'/firebase-auth.js')]);
  const fapp=initializeApp(firebaseConfig);
  const db=fs.getFirestore(fapp),auth=au.getAuth(fapp);
  fb={ref:fs.doc(db,'league','state'),setDoc:fs.setDoc,auth:auth,signInWithEmailAndPassword:au.signInWithEmailAndPassword,signOut:au.signOut,sendPasswordResetEmail:au.sendPasswordResetEmail,updatePassword:au.updatePassword};
  fs.onSnapshot(fb.ref,function(snap){loadErr=false;if(snap.exists()){remote=snap.data();applyRemote()}else render()},function(){loadErr=true;render()});
  if(MODE==='admin')au.onAuthStateChanged(auth,function(u){user=u;admin=!!u;open=null;render()});
}catch(e){loadErr=true;render()}
})();
