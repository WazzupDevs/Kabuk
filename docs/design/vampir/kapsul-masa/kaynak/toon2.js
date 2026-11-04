// skall Vampir Köylü: kapsül masa, çizgi film oda (kapsül kanki dili: düz renk, tek gölge bandı, beyaz parlama hapı, koyu kontur, sert düşen gölge)
(function(){
const TAU=Math.PI*2;let S=3;
function rnd(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const PAL={
 night:{top:'#6E3A22',floor:'#5A3A26',floor2:'#4E3222',line:'#2A160C',felt:'#1F6A48',felt2:'#18573B',rug:'#8A2A48',rug2:'#6E1E38',tint:'#6C76C8',lamp:1.25,vig:.66,lift:0,win:'rgba(150,180,255,A)',winA:.20},
 dawn:{top:'#7A4228',floor:'#6A4430',floor2:'#5E3A28',line:'#2E180C',felt:'#24724C',felt2:'#1C5E3E',rug:'#9A3050',rug2:'#7A2440',tint:'#F2B09C',lamp:.8,vig:.42,lift:.03,win:'rgba(255,170,120,A)',winA:.24},
 day:{top:'#8A4C2C',floor:'#7A5034',floor2:'#6C462C',line:'#341C0E',felt:'#2A8052',felt2:'#216A43',rug:'#A8365A',rug2:'#86284A',tint:null,lamp:.35,vig:.16,lift:.12,win:'rgba(255,244,210,A)',winA:.36},
 end:{top:'#5E2A1E',floor:'#5A3426',floor2:'#4E2C20',line:'#2A120A',felt:'#7A2238',felt2:'#621A2C',rug:'#4A1A40',rug2:'#381230',tint:'#C8606E',lamp:1.1,vig:.58,lift:0,win:'rgba(255,80,110,A)',winA:.16}};
const INK='#141016';
function hex(h){const n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]}
function sh(h,t){const [r,g,b]=hex(h);const f=v=>Math.max(0,Math.min(255,Math.round(t>0?v*(1-t):v+(255-v)*-t)));return `rgb(${f(r)},${f(g)},${f(b)})`}
function glow(g,x,y,r,col,a){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col.replace('A',a));gr.addColorStop(.45,col.replace('A',a*.4));gr.addColorStop(1,col.replace('A',0));g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}
function stadium(g,cx,cy,a,h){g.beginPath();g.moveTo(cx-a,cy-h);g.arc(cx,cy-h,a,Math.PI,0);g.lineTo(cx+a,cy+h);g.arc(cx,cy+h,a,0,Math.PI);g.closePath()}
// sert düşen gölge (çizgi film)
function drop(g,path,dx,dy,a){g.save();g.translate(dx,dy);path();g.fillStyle=`rgba(10,4,0,${a||.38})`;g.fill();g.restore()}
function ink(g,w){g.strokeStyle=INK;g.lineWidth=(w||1.6)*1.45;g.lineJoin='round';g.lineCap='round';g.stroke()}
function circ(g,x,y,r){g.beginPath();g.arc(x,y,r,0,TAU)}
// kanki dili: dairede sağ-alt gölge hilali + sol-üst parlama hapı
function toonDisc(g,x,y,r,col,opts={}){circ(g,x,y,r);g.fillStyle=col;g.fill();
 g.save();circ(g,x,y,r);g.clip();const sg=g.createRadialGradient(x-r*.35,y-r*.4,r*.3,x,y,r*1.05);sg.addColorStop(0,'rgba(255,255,255,.10)');sg.addColorStop(.6,'rgba(0,0,0,0)');sg.addColorStop(1,'rgba(30,0,40,.28)');g.fillStyle=sg;g.fillRect(x-r,y-r,r*2,r*2);g.restore();
 if(false){g.fillStyle='rgba(255,255,255,.35)';g.save();g.translate(x-r*.45,y-r*.42);g.rotate(-.75);g.beginPath();g.roundRect(-r*.28,-r*.09,r*.56,r*.18,r*.09);g.fill();g.restore()}
 circ(g,x,y,r);ink(g,opts.w)}

function floor(g,W,H,P){const r=rnd(7);const PW=34;
 for(let x=-10,i=0;x<W;x+=PW,i++){let yy=-r()*200;while(yy<H){const len=170+r()*200;g.fillStyle=(i+Math.floor(yy/90))%2?P.floor:P.floor2;g.fillRect(x,yy,PW,len);
   // birkaç çizgi film damarı
   g.strokeStyle='rgba(20,8,2,.22)';g.lineWidth=1.1;g.lineCap='round';for(let k=0;k<2;k++){const gx=x+6+r()*(PW-12),gy=yy+20+r()*(len-60),gl=24+r()*40;g.beginPath();g.moveTo(gx,gy);g.quadraticCurveTo(gx+3,gy+gl/2,gx,gy+gl);g.stroke()}
   if(r()<.25){const kx=x+8+r()*(PW-16),ky=yy+30+r()*(len-60);g.beginPath();g.ellipse(kx,ky,3,5,0,0,TAU);g.stroke()}
   g.fillStyle='rgba(255,230,190,.08)';g.fillRect(x+1.5,yy,2,len);
   g.fillStyle=P.line;g.fillRect(x,yy,PW,1.6);yy+=len}
  g.fillStyle=P.line;g.fillRect(x,0,1.8,H)}}

function rug(g,cx,cy,a,h,P){drop(g,()=>stadium(g,cx,cy,a,h),2,4,.3);
 g.fillStyle=P.rug;stadium(g,cx,cy,a,h);g.fill();g.fillStyle='#F2C25A';stadium(g,cx,cy,a-6,h);g.fill();g.fillStyle=P.rug2;stadium(g,cx,cy,a-10,h);g.fill();g.fillStyle='#F2C25A';stadium(g,cx,cy,a-24,h);g.fill();g.fillStyle=P.rug;stadium(g,cx,cy,a-27,h);g.fill();
 // kenarda düz renk baklavalar
 g.save();const R=a-17,per=2*Math.PI*R+4*h;for(let k=0;k<64;k++){let s=k/64*per,x,y;
  if(s<Math.PI*R){const th=s/R;x=cx+R*Math.cos(th);y=cy+h+R*Math.sin(th)}else if((s-=Math.PI*R)<2*h){x=cx-R;y=cy+h-s}else if((s-=2*h)<Math.PI*R){const th=Math.PI+s/R;x=cx+R*Math.cos(th);y=cy-h+R*Math.sin(th)}else{s-=Math.PI*R;x=cx+R;y=cy-h+s}
  g.fillStyle=k%2?'#F2C25A':'#FF6FA5';g.beginPath();g.moveTo(x-4,y);g.lineTo(x,y-4);g.lineTo(x+4,y);g.lineTo(x,y+4);g.closePath();g.fill()}g.restore();
 stadium(g,cx,cy,a,h);ink(g,1.8)}

function tableT(g,cx,cy,a,h,P){
 drop(g,()=>stadium(g,cx,cy,a,h),6,10,.45);
 // ahşap kenar: düz renk + sağ-alt gölge bandı + sol-üst parlama
 g.fillStyle='#B8743E';stadium(g,cx,cy,a,h);g.fill();
 g.save();stadium(g,cx,cy,a,h);g.clip();g.fillStyle='#9A5C2E';stadium(g,cx+7,cy+9,a,h);g.rect(0,0,400,800);g.fill('evenodd');
 // birkaç damar fırça izi
 const r=rnd(61);g.strokeStyle='rgba(90,44,16,.45)';g.lineWidth=1.3;g.lineCap='round';for(let k=0;k<22;k++){const t=r()*TAU,R=a-7+(r()-.5)*6;const yy=cy+(r()-.5)*2*h;const x0=cx+Math.cos(t)*R,y0=(Math.abs(Math.sin(t))<.5?yy:cy+(Math.sin(t)>0?h:-h)+Math.sin(t)*R);g.beginPath();g.moveTo(x0,y0);g.lineTo(x0+Math.sin(t)*9,y0-Math.cos(t)*9);g.stroke()}
 g.restore();
 g.strokeStyle='rgba(255,236,200,.55)';g.lineWidth=2.4;g.lineCap='round';g.beginPath();g.arc(cx,cy-h,a-4,Math.PI*1.08,Math.PI*1.42);g.stroke();g.beginPath();g.moveTo(cx-a+4,cy-h+10);g.lineTo(cx-a+4,cy-h+60);g.stroke();
 stadium(g,cx,cy,a,h);ink(g,2.2);
 // altın şerit
 const ai=a-16;g.strokeStyle='#F2C25A';g.lineWidth=3;stadium(g,cx,cy,ai+5,h);g.stroke();g.strokeStyle=INK;g.lineWidth=1;stadium(g,cx,cy,ai+7,h);g.stroke();
 // tabla: koyu ceviz tahtalar (keçe yok)
 g.save();stadium(g,cx,cy,ai,h);g.clip();g.fillStyle=P.top;g.fillRect(cx-ai,cy-h-ai,ai*2,(ai+h)*2);
 const pw=ai*2/6,rr=rnd(9);for(let k=0;k<6;k++){const px=cx-ai+k*pw;g.fillStyle=k%2?'rgba(0,0,0,.06)':'rgba(255,220,180,.04)';g.fillRect(px,cy-h-ai,pw,(ai+h)*2);
  g.strokeStyle='rgba(30,12,4,.35)';g.lineWidth=1.1;g.lineCap='round';for(let j=0;j<4;j++){const gx=px+5+rr()*(pw-10),gy=cy-h-ai+rr()*(2*(ai+h)),gl=30+rr()*60;g.beginPath();g.moveTo(gx,gy);g.bezierCurveTo(gx+4,gy+gl*.3,gx-4,gy+gl*.7,gx,gy+gl);g.stroke()}
  if(k)g.fillStyle=INK,g.globalAlpha=.55,g.fillRect(px-.7,cy-h-ai,1.4,(ai+h)*2),g.globalAlpha=1}
 const gr=g.createRadialGradient(cx,cy-10,20,cx,cy,h+ai);gr.addColorStop(0,'rgba(255,214,150,.16)');gr.addColorStop(.7,'rgba(0,0,0,.05)');gr.addColorStop(1,'rgba(20,0,10,.38)');g.fillStyle=gr;g.fillRect(cx-ai,cy-h-ai,ai*2,(ai+h)*2);
 g.restore();
 stadium(g,cx,cy,ai,h);ink(g,1.8)}

function stool(g,x,y,R,seed,cush){drop(g,()=>circ(g,x,y,R+1.5),0,2.5,.4);
 toonDisc(g,x,y,R,'#C27A42',{hl:false,w:1.8});
 g.strokeStyle='rgba(90,44,16,.4)';g.lineWidth=1;circ(g,x,y,R-4);g.stroke();
 toonDisc(g,x,y,R*.76,cush[0],{w:1.4});
 g.fillStyle='rgba(0,0,0,.22)';for(let k=0;k<5;k++){const a=k/5*TAU-.4;circ(g,x+Math.cos(a)*R*.4,y+Math.sin(a)*R*.4,1.5);g.fill()}}

function candle(g,x,y,lit,warm,s){drop(g,()=>circ(g,x,y,10*s),2,3,.4);
 toonDisc(g,x,y,10*s,'#F2C25A',{hl:false,w:1.4});g.fillStyle='rgba(255,255,255,.45)';g.beginPath();g.arc(x,y,8*s,Math.PI*1.05,Math.PI*1.5);g.arc(x,y,6.6*s,Math.PI*1.5,Math.PI*1.05,true);g.fill();
 toonDisc(g,x,y,6*s,'#FFF6E4',{hl:false,w:1.3});
 // damla
 g.fillStyle='#FFF6E4';g.beginPath();g.ellipse(x+5.6*s,y+2.4*s,1.8*s,2.6*s,-.4,0,TAU);g.fill();ink(g,1);
 g.fillStyle=INK;circ(g,x,y,1*s);g.fill()}
function flame(g,x,y,lit,warm,s){
 if(lit){g.save();g.globalCompositeOperation='lighter';glow(g,x,y,32*s,'rgba(255,180,80,A)',.26*warm+.08);g.restore();
  g.beginPath();g.moveTo(x,y-9*s);g.bezierCurveTo(x+4*s,y-4*s,x+3.2*s,y+1.4*s,x,y+1.4*s);g.bezierCurveTo(x-3.2*s,y+1.4*s,x-4*s,y-4*s,x,y-9*s);g.fillStyle='#FF9A2A';g.fill();ink(g,1.1);
  g.beginPath();g.moveTo(x,y-5.4*s);g.bezierCurveTo(x+2*s,y-2.4*s,x+1.6*s,y+.6*s,x,y+.6*s);g.bezierCurveTo(x-1.6*s,y+.6*s,x-2*s,y-2.4*s,x,y-5.4*s);g.fillStyle='#FFE88A';g.fill()}
 else{g.lineCap='round';g.strokeStyle='rgba(230,230,240,.55)';g.lineWidth=2.2*s;g.beginPath();g.moveTo(x,y-1);g.bezierCurveTo(x+6*s,y-5*s,x-3*s,y-11*s,x+4*s,y-17*s);g.stroke();
  g.strokeStyle='rgba(230,230,240,.3)';g.lineWidth=3.6*s;g.beginPath();g.arc(x+5*s,y-21*s,2.6*s,0,TAU);g.stroke()}}

function barrel(g,x,y,R,seed){drop(g,()=>circ(g,x,y,R),4,6,.42);
 toonDisc(g,x,y,R,'#B06E3A',{hl:false,w:2});
 g.strokeStyle='#8C8A92';g.lineWidth=3.4;circ(g,x,y,R-2.4);g.stroke();g.strokeStyle=INK;g.lineWidth=1.1;circ(g,x,y,R-4.6);g.stroke();
 const Ri=R-4.6;g.save();circ(g,x,y,Ri);g.clip();g.strokeStyle='rgba(90,44,16,.6)';g.lineWidth=1.2;for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(x+k*Ri*.4,y-Ri);g.lineTo(x+k*Ri*.4,y+Ri);g.stroke()}
 g.fillStyle='rgba(0,0,0,.14)';circ(g,x+Ri*.3,y+Ri*.3,Ri);g.rect(x-Ri*2,y-Ri*2,Ri*4,Ri*4);g.fill('evenodd');g.restore();
 g.fillStyle='#D8D6DE';for(let k=0;k<8;k++){const a=k/8*TAU;circ(g,x+Math.cos(a)*(R-2.4),y+Math.sin(a)*(R-2.4),1);g.fill()}
 circ(g,x+Ri*.4,y+Ri*.25,2.6);g.fillStyle=INK;g.fill();
 g.fillStyle='rgba(255,255,255,.3)';g.save();g.translate(x-R*.45,y-R*.45);g.rotate(-.75);g.beginPath();g.roundRect(-R*.25,-2,R*.5,4,2);g.fill();g.restore()}

function bottle(g,x,y,col){drop(g,()=>circ(g,x,y,6.4),1.5,2.5,.45);toonDisc(g,x,y,6.4,col,{hl:false,w:1.2});
 circ(g,x,y,2.6);g.fillStyle='#E0A868';g.fill();ink(g,.9);g.fillStyle='rgba(255,255,255,.75)';g.save();g.translate(x-3.4,y-3);g.rotate(-.8);g.beginPath();g.roundRect(-1.8,-.7,3.6,1.4,.7);g.fill();g.restore()}
function crate(g,x,y,w,h,seed){drop(g,()=>{g.beginPath();g.rect(x,y,w,h)},4,6,.42);
 g.fillStyle='#C88A4E';g.fillRect(x,y,w,h);g.fillStyle='#5A3218';g.fillRect(x+6,y+6,w-12,h-12);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(x+6,y+6,w-12,5);
 g.fillStyle='rgba(0,0,0,.14)';g.fillRect(x+w-6,y,6,h);g.fillRect(x,y+h-6,w,6);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x+2,y+2,w*.4,1.6);
 g.beginPath();g.rect(x,y,w,h);ink(g,1.8);g.beginPath();g.rect(x+6,y+6,w-12,h-12);ink(g,1.2);
 const cols=['#3FB46A','#E0456A','#F2A03A','#4A8AE0'];const nx=Math.floor((w-12)/15),ny=Math.floor((h-12)/15);for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)bottle(g,x+6+7.5+i*15+(w-12-nx*15)/2,y+6+7.5+j*15+(h-12-ny*15)/2,cols[(i*3+j*5+seed)%4])}
function plant(g,x,y,R,seed){const r=rnd(seed);drop(g,()=>circ(g,x,y,R*.62),4,6,.42);
 toonDisc(g,x,y,R*.62,'#E4794A',{hl:false,w:1.8});circ(g,x,y,R*.5);g.fillStyle='#4A2A18';g.fill();ink(g,1.1);
 const cols=['#2E8A4A','#3FB060','#5ACB74'];for(let L=0;L<3;L++){const n=6+L*2;for(let k=0;k<n;k++){const a=k/n*TAU+L*.55+r()*.25,len=R*(1.12-L*.24),wd=len*.24;
  g.save();g.translate(x,y);g.rotate(a);const leaf=()=>{g.beginPath();g.moveTo(len*.08,0);g.bezierCurveTo(len*.35,-wd*1.3,len*.85,-wd*.7,len,0);g.bezierCurveTo(len*.85,wd*.7,len*.35,wd*1.3,len*.08,0);g.closePath()};
  drop(g,leaf,1.5,2.5,.3);leaf();g.fillStyle=cols[L];g.fill();g.save();leaf();g.clip();g.fillStyle='rgba(0,0,0,.13)';g.fillRect(0,0,len,wd*2);g.restore();leaf();ink(g,1.2);
  g.strokeStyle='rgba(20,60,30,.55)';g.lineWidth=1;g.beginPath();g.moveTo(len*.12,0);g.lineTo(len*.8,0);g.stroke();g.restore()}}}
function books(g,x,y){const B=[['#C2405A',62,44,-.12],['#3A7AC2',56,40,.12],['#F2A03A',48,34,-.04]];
 B.forEach(([c,w,h,a],i)=>{g.save();g.translate(x+i*1.5,y-i*2);g.rotate(a);const body=()=>{g.beginPath();g.roundRect(-w/2,-h/2,w,h,3)};drop(g,body,2.5,4,.4);
  body();g.fillStyle='#FFF4DC';g.fill();g.beginPath();g.roundRect(-w/2,-h/2,w-5,h,[3,0,0,3]);g.fillStyle=c;g.fill();g.fillStyle='rgba(0,0,0,.16)';g.fillRect(-w/2,-h/2,6,h);
  g.strokeStyle='#F2D27A';g.lineWidth=1.2;g.beginPath();g.roundRect(-w/2+11,-h/2+6,w-26,h-12,2);g.stroke();
  g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.roundRect(-w/2+12,-h/2+3,w*.35,2,1);g.fill();body();ink(g,1.5);g.restore()})}
function windowLight(g,W,H,P){g.save();g.globalCompositeOperation='lighter';g.filter='blur(7px)';g.globalAlpha=.6;
 const draw=(x0)=>{g.save();g.translate(x0,-30);g.transform(1,0,.5,1,0,0);const w=74,hh=170;g.fillStyle=P.win.replace('A',P.winA);
  g.beginPath();for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])g.roundRect(a*(w/2+4),b*(hh/2+4),w/2-4,hh/2-4,4);g.fill();g.restore()};draw(-50);draw(214);g.restore()}
function timerDial(g,x,y,R){drop(g,()=>circ(g,x,y,R+4),2,4,.45);toonDisc(g,x,y,R+4,'#F2C25A',{hl:false,w:1.8});circ(g,x,y,R);g.fillStyle='#2A1A12';g.fill();ink(g,1.3);
 g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1.6;g.lineCap='round';g.beginPath();g.arc(x,y,R+2,Math.PI*1.1,Math.PI*1.45);g.stroke()}

window.drawCap=function(canvas,cfg){const W=360,H=760;S=cfg.dpr||3;canvas.width=W*S;canvas.height=H*S;canvas.style.width=W+'px';canvas.style.height=H+'px';
 const g=canvas.getContext('2d');g.scale(S,S);const P=PAL[cfg.phase];const warm=P.lamp;const T=cfg.t;
 {const R=window.__real;R.setS(S);g.save();g.filter='blur(1.4px)';R.floor(g,W,H,R.PAL[cfg.phase]);R.rug(g,T.cx,T.cy,T.a+66,T.h);g.restore();g.save();stadium(g,T.cx,T.cy,T.a+66,T.h);ink(g,1.4);g.restore()}
 barrel(g,24,114,30,41);barrel(g,-4,176,25,42);crate(g,292,92,72,54,1);plant(g,344,220,30,8);plant(g,12,662,30,9);books(g,334,654);
 if(!window.__NOTABLE){for(const s of cfg.seats)stool(g,s.x,s.y,cfg.stoolR,100+s.i,s.cush);
 tableT(g,T.cx,T.cy,T.a,T.h,P);
 for(const s of cfg.seats)candle(g,s.lx,s.ly,!s.dead,warm,cfg.cs);
 if(cfg.timer)timerDial(g,cfg.timer.x,cfg.timer.y,cfg.timer.r);}
 windowLight(g,W,H,P);
 if(P.tint){g.save();g.globalCompositeOperation='multiply';g.fillStyle=P.tint;g.fillRect(0,0,W,H);g.restore()}
 if(!window.__NOTABLE)for(const s of cfg.seats)flame(g,s.lx,s.ly,!s.dead,warm,cfg.cs);
 g.save();g.globalCompositeOperation='lighter';glow(g,T.cx,T.cy-10,230,'rgba(255,196,130,A)',.10*warm+.02);g.restore();
 if(P.lift){g.save();g.globalCompositeOperation='screen';g.fillStyle=`rgba(255,248,228,${P.lift})`;g.fillRect(0,0,W,H);g.restore()}
 const gr=g.createRadialGradient(W/2,T.cy,T.h*1.1,W/2,T.cy,H*.8);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,`rgba(0,0,${P.tint==='#6C76C8'?20:0},${P.vig})`);g.fillStyle=gr;g.fillRect(0,0,W,H)}
})();
