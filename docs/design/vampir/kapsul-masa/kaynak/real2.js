// skall Vampir Köylü: kapsül masa, gerçekçi kuş bakışı oda (canvas 2D, tam çözünürlük)
(function(){
const TAU=Math.PI*2;let S=3;
function rnd(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const PAL={
 night:{floor:'#3A2618',floor2:'#2C1C12',felt:'#18402E',tint:'#9399D4',tintA:1,lamp:1,win:'rgba(130,160,255,A)',winA:.10},
 dawn:{floor:'#4A3020',floor2:'#3A2416',felt:'#1E4632',tint:'#E8C0BC',tintA:1,lamp:.85,win:'rgba(255,170,130,A)',winA:.16},
 day:{floor:'#5A3A24',floor2:'#48301C',felt:'#235238',tint:null,lamp:.6,win:'rgba(255,236,190,A)',winA:.22},
 end:{floor:'#3A2018',floor2:'#2C1810',felt:'#3A1820',tint:'#C47888',tintA:1,lamp:1,win:'rgba(255,70,100,A)',winA:.12}};
const cache={};
function noise(w,h,amp,seed){const k=w+'x'+h+'x'+amp+'x'+seed;if(cache[k])return cache[k];const c=document.createElement('canvas');c.width=Math.ceil(w*S);c.height=Math.ceil(h*S);const x=c.getContext('2d');const id=x.createImageData(c.width,c.height),d=id.data,r=rnd(seed);
 for(let i=0;i<d.length;i+=4){const v=128+(r()-.5)*amp;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}x.putImageData(id,0,0);return cache[k]=c}
function tex(g,x,y,w,h,amp,a,seed,mode){g.save();g.globalCompositeOperation=mode||'overlay';g.globalAlpha=a;g.drawImage(noise(w,h,amp,seed),x,y,w,h);g.restore()}
function shadow(g,blur,col,dx,dy){g.shadowColor=col;g.shadowBlur=blur*S;g.shadowOffsetX=(dx||0)*S;g.shadowOffsetY=(dy||0)*S}
function noShadow(g){g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetX=0;g.shadowOffsetY=0}
function hex(h){const n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]}
function sh(h,t){const [r,g,b]=hex(h);const f=v=>Math.max(0,Math.min(255,Math.round(t>0?v*(1-t):v+(255-v)*-t)));return `rgb(${f(r)},${f(g)},${f(b)})`}
function glow(g,x,y,r,col,a){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col.replace('A',a));gr.addColorStop(.4,col.replace('A',a*.45));gr.addColorStop(1,col.replace('A',0));g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}
function stadium(g,cx,cy,a,h){g.beginPath();g.moveTo(cx-a,cy-h);g.arc(cx,cy-h,a,Math.PI,0);g.lineTo(cx+a,cy+h);g.arc(cx,cy+h,a,0,Math.PI);g.closePath()}
// damar: ince, uzun, dalgalı çizgiler (vektör, her çözünürlükte keskin)
function grain(g,x,y,w,h,seed,vertical,dens,dark,light){const r=rnd(seed);const n=Math.floor((vertical?w:h)*(dens||1.6));
 for(let i=0;i<n;i++){const a=.04+r()*.12;g.strokeStyle=`rgba(${dark||'24,10,2'},${a})`;g.lineWidth=.25+r()*.9;g.beginPath();const ph=r()*10,amp=.6+r()*2.2,fr=.01+r()*.03;
  if(vertical){const xx=x+r()*w;g.moveTo(xx,y);for(let t=0;t<=h;t+=4)g.lineTo(xx+Math.sin(t*fr+ph)*amp,y+t)}else{const yy=y+r()*h;g.moveTo(x,yy);for(let t=0;t<=w;t+=4)g.lineTo(x+t,yy+Math.sin(t*fr+ph)*amp)}g.stroke()}
 for(let i=0;i<n*.35;i++){g.strokeStyle=`rgba(${light||'255,224,180'},${r()*.07})`;g.lineWidth=.3+r()*.6;g.beginPath();if(vertical){const xx=x+r()*w;g.moveTo(xx,y);g.lineTo(xx+(r()-.5)*2,y+h)}else{const yy=y+r()*h;g.moveTo(x,yy);g.lineTo(x+w,yy+(r()-.5)*2)}g.stroke()}
 // budak
 for(let k=0;k<(w*h)/26000;k++){const kx=x+r()*w,ky=y+r()*h,rx=2+r()*4;for(let j=5;j>0;j--){g.strokeStyle=`rgba(24,10,2,${.08+.03*j})`;g.lineWidth=.6;g.beginPath();g.ellipse(kx,ky,rx+j*(vertical?1.2:2.6),rx*.6+j*(vertical?2.6:1.2),0,0,TAU);g.stroke()}g.fillStyle='rgba(30,12,4,.5)';g.beginPath();g.ellipse(kx,ky,rx*.6,rx*.4,0,0,TAU);g.fill()}}

function floor(g,W,H,P){const r=rnd(7);const PW=30;
 for(let x=-8,i=0;x<W;x+=PW,i++){let yy=-r()*240;while(yy<H){const len=180+r()*220;const base=r()<.5?P.floor:P.floor2;const t=(r()-.5)*.18;
   g.save();g.beginPath();g.rect(x,yy,PW,len);g.clip();g.fillStyle=sh(base,t);g.fillRect(x,yy,PW,len);
   const lg=g.createLinearGradient(x,0,x+PW,0);lg.addColorStop(0,'rgba(255,220,170,.05)');lg.addColorStop(.5,'rgba(0,0,0,0)');lg.addColorStop(1,'rgba(0,0,0,.18)');g.fillStyle=lg;g.fillRect(x,yy,PW,len);
   grain(g,x,yy,PW,len,i*97+yy|0,true,1.4);g.restore();
   g.fillStyle='rgba(6,2,0,.75)';g.fillRect(x,yy,PW,1);g.fillStyle='rgba(255,220,170,.06)';g.fillRect(x,yy+1,PW,.6);
   g.fillStyle='rgba(20,10,4,.9)';for(const dx of [5,PW-5]){g.beginPath();g.arc(x+dx,yy+6,1,0,TAU);g.fill()}
   yy+=len}
  g.fillStyle='rgba(6,2,0,.8)';g.fillRect(x,0,1.1,H);g.fillStyle='rgba(255,220,170,.05)';g.fillRect(x+1.1,0,.6,H)}
 tex(g,0,0,W,H,40,.35,11)}

function rug(g,cx,cy,a,h){g.save();shadow(g,10,'rgba(0,0,0,.5)',2,4);g.fillStyle='#4A1020';stadium(g,cx,cy,a,h);g.fill();noShadow(g);
 const L=[[0,'#4A1020'],[4,'#B88A48'],[7,'#2A0A14'],[22,'#B88A48'],[24,'#5E1626']];L.forEach(([d,c])=>{g.fillStyle=c;stadium(g,cx,cy,a-d,h);g.fill()});
 // kenar motifi: noktalı sıra + baklava
 g.save();stadium(g,cx,cy,a-7,h);stadium(g,cx,cy,a-22,h);g.clip('evenodd');const r=rnd(3);
 for(let k=0;k<180;k++){const t=k/180;const R=a-14.5,per=2*Math.PI*R+4*h;let s=t*per,x,y;
  if(s<Math.PI*R){const th=s/R;x=cx+R*Math.cos(th);y=cy+h+R*Math.sin(th)}else if((s-=Math.PI*R)<2*h){x=cx-R;y=cy+h-s}else if((s-=2*h)<Math.PI*R){const th=Math.PI+s/R;x=cx+R*Math.cos(th);y=cy-h+R*Math.sin(th)}else{s-=Math.PI*R;x=cx+R;y=cy-h+s}
  g.fillStyle=k%2?'#C89A52':'#7A2234';g.beginPath();g.moveTo(x-3.4,y);g.lineTo(x,y-3.4);g.lineTo(x+3.4,y);g.lineTo(x,y+3.4);g.fill()}g.restore();
 // yün havı
 g.save();stadium(g,cx,cy,a,h);g.clip();tex(g,cx-a,cy-h-a,a*2,(a+h)*2,90,.5,21);tex(g,cx-a,cy-h-a,a*2,(a+h)*2,60,.25,22,'multiply');g.restore();g.restore()}

function tableT(g,cx,cy,a,h,P){
 // yumuşak düşen gölge
 g.save();shadow(g,26,'rgba(0,0,0,.75)',8,14);g.fillStyle='#2A160A';stadium(g,cx,cy,a,h);g.fill();g.restore();
 // ceviz kenar
 g.save();stadium(g,cx,cy,a,h);g.clip();g.fillStyle='#6A3A1C';g.fillRect(cx-a,cy-h-a,a*2,(a+h)*2);grain(g,cx-a,cy-h-a,a*2,(a+h)*2,61,true,1.3);
 let gr=g.createLinearGradient(cx-a,cy-h-a,cx+a,cy+h+a);gr.addColorStop(0,'rgba(255,222,170,.22)');gr.addColorStop(.45,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=gr;g.fillRect(cx-a,cy-h-a,a*2,(a+h)*2);g.restore();
 // pah: dış parlama + iç gölge
 g.lineWidth=1.4;g.strokeStyle='rgba(255,226,180,.45)';stadium(g,cx-.6,cy-.6,a-1.6,h);g.stroke();g.strokeStyle='rgba(10,4,0,.8)';g.lineWidth=1.2;stadium(g,cx,cy,a-.4,h);g.stroke();
 // vernik yansıması
 g.save();stadium(g,cx,cy,a,h);g.clip();g.globalCompositeOperation='screen';const sp=g.createLinearGradient(cx-a,cy-h-a,cx-a*.2,cy-h);sp.addColorStop(0,'rgba(255,240,210,.0)');sp.addColorStop(.5,'rgba(255,240,210,.16)');sp.addColorStop(1,'rgba(255,240,210,0)');g.fillStyle=sp;g.beginPath();g.ellipse(cx-a*.45,cy-h-a*.2,a*.25,a*.9,-.5,0,TAU);g.fill();g.restore();
 // pirinç kakma
 const ai=a-16;const br=g.createLinearGradient(cx-a,cy-h-a,cx+a,cy+h+a);br.addColorStop(0,'#FFE6A0');br.addColorStop(.3,'#C8963E');br.addColorStop(.55,'#7A5418');br.addColorStop(.8,'#E8C26E');br.addColorStop(1,'#9A6A24');
 g.strokeStyle=br;g.lineWidth=2.4;stadium(g,cx,cy,ai+4.5,h);g.stroke();g.strokeStyle='rgba(20,8,0,.6)';g.lineWidth=.6;stadium(g,cx,cy,ai+6,h);g.stroke();
 // keçe
 g.save();stadium(g,cx,cy,ai,h);g.clip();g.fillStyle=P.felt;g.fillRect(cx-ai,cy-h-ai,ai*2,(ai+h)*2);
 tex(g,cx-ai,cy-h-ai,ai*2,(ai+h)*2,70,.55,31);tex(g,cx-ai,cy-h-ai,ai*2,(ai+h)*2,40,.25,32,'multiply');
 gr=g.createRadialGradient(cx,cy-20,10,cx,cy,h+ai+10);gr.addColorStop(0,'rgba(255,214,160,.16)');gr.addColorStop(.6,'rgba(0,0,0,.08)');gr.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=gr;g.fillRect(cx-ai,cy-h-ai,ai*2,(ai+h)*2);
 // kenarın keçeye düşen iç gölgesi
 shadow(g,10,'rgba(0,0,0,.85)',2,3);g.strokeStyle='rgba(0,0,0,1)';g.lineWidth=8;stadium(g,cx,cy,ai+4,h);g.stroke();noShadow(g);
 // ince yaldız çizgi
 g.strokeStyle='rgba(214,170,96,.42)';g.lineWidth=.8;stadium(g,cx,cy,ai-8,h);g.stroke();g.restore();
 g.strokeStyle='rgba(10,4,0,.7)';g.lineWidth=1;stadium(g,cx,cy,ai,h);g.stroke()}

function stool(g,x,y,R,seed,cush){
 g.save();shadow(g,9,'rgba(0,0,0,.7)',3,6);g.fillStyle='#3A2010';g.beginPath();g.arc(x,y,R,0,TAU);g.fill();g.restore();
 g.save();g.beginPath();g.arc(x,y,R,0,TAU);g.clip();g.fillStyle='#7A4826';g.fillRect(x-R,y-R,R*2,R*2);
 const r=rnd(seed);for(let k=0;k<26;k++){g.strokeStyle=`rgba(30,12,4,${.08+r()*.14})`;g.lineWidth=.4+r()*.6;g.beginPath();g.arc(x+(r()-.5)*3,y+(r()-.5)*3,R*(.3+r()*.7),0,TAU);g.stroke()}
 let gr=g.createRadialGradient(x-R*.45,y-R*.5,1,x,y,R);gr.addColorStop(0,'rgba(255,224,180,.35)');gr.addColorStop(.6,'rgba(0,0,0,.05)');gr.addColorStop(1,'rgba(0,0,0,.5)');g.fillStyle=gr;g.fillRect(x-R,y-R,R*2,R*2);g.restore();
 g.strokeStyle='rgba(255,220,170,.35)';g.lineWidth=.8;g.beginPath();g.arc(x-.4,y-.4,R-1,Math.PI*.9,Math.PI*1.7);g.stroke();
 // minder
 const Rc=R*.8;g.save();shadow(g,4,'rgba(0,0,0,.6)',1,2);gr=g.createRadialGradient(x-Rc*.35,y-Rc*.4,1,x,y,Rc);gr.addColorStop(0,sh(cush[0],-.25));gr.addColorStop(.55,cush[0]);gr.addColorStop(1,cush[1]);g.fillStyle=gr;g.beginPath();g.arc(x,y,Rc,0,TAU);g.fill();g.restore();
 g.save();g.beginPath();g.arc(x,y,Rc,0,TAU);g.clip();tex(g,x-Rc,y-Rc,Rc*2,Rc*2,80,.5,seed+5);
 // kapitone kıvrımları
 for(let k=0;k<6;k++){const a=k/6*TAU+.3;const bx=x+Math.cos(a)*Rc*.52,by=y+Math.sin(a)*Rc*.52;g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1.2;g.beginPath();g.moveTo(x,y);g.lineTo(bx,by);g.stroke();
  const bg=g.createRadialGradient(bx-.6,by-.6,0,bx,by,2.2);bg.addColorStop(0,sh(cush[0],-.3));bg.addColorStop(1,sh(cush[1],.3));g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.arc(bx+.5,by+.7,2.1,0,TAU);g.fill();g.fillStyle=bg;g.beginPath();g.arc(bx,by,1.8,0,TAU);g.fill()}
 g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.arc(x+.5,y+.7,2.3,0,TAU);g.fill();g.fillStyle=sh(cush[0],-.2);g.beginPath();g.arc(x,y,2,0,TAU);g.fill();g.restore();
 // biye
 g.strokeStyle=sh(cush[1],.35);g.lineWidth=1.2;g.beginPath();g.arc(x,y,Rc-.6,0,TAU);g.stroke()}

function candle(g,x,y,lit,warm,s){
 // pirinç tabak
 g.save();shadow(g,5,'rgba(0,0,0,.7)',2,3);let gr=g.createLinearGradient(x-11*s,y-11*s,x+11*s,y+11*s);gr.addColorStop(0,'#FFE7A8');gr.addColorStop(.35,'#C9963E');gr.addColorStop(.7,'#6A4614');gr.addColorStop(1,'#D8AE5E');g.fillStyle=gr;g.beginPath();g.arc(x,y,11*s,0,TAU);g.fill();g.restore();
 g.strokeStyle='rgba(60,36,6,.6)';g.lineWidth=.6;g.beginPath();g.arc(x,y,8.6*s,0,TAU);g.stroke();g.strokeStyle='rgba(255,236,190,.55)';g.beginPath();g.arc(x,y,10.4*s,Math.PI*1.05,Math.PI*1.6);g.stroke();
 // mum gövdesi + damlalar
 g.save();shadow(g,2.5,'rgba(60,30,0,.5)',.6,1);gr=g.createRadialGradient(x-2*s,y-2*s,.5,x,y,6.4*s);gr.addColorStop(0,'#FFFBF0');gr.addColorStop(.7,'#F0E4C8');gr.addColorStop(1,'#CDBB94');g.fillStyle=gr;g.beginPath();g.arc(x,y,6*s,0,TAU);
 const r=rnd((x*7+y*13)|0);for(let k=0;k<3;k++){const a=r()*TAU;g.moveTo(x+Math.cos(a)*7.6*s,y+Math.sin(a)*7.6*s);g.arc(x+Math.cos(a)*6.4*s,y+Math.sin(a)*6.4*s,1.5*s,0,TAU)}g.fill();g.restore();
 // eriyik çanak
 gr=g.createRadialGradient(x,y,0,x,y,4*s);gr.addColorStop(0,lit?'#FFF3D0':'#E8DCC0');gr.addColorStop(1,lit?'rgba(255,236,190,.0)':'rgba(200,184,150,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,4*s,0,TAU);g.fill();
 g.fillStyle='#1A1008';g.beginPath();g.arc(x,y,.9*s,0,TAU);g.fill();
}
function flame(g,x,y,lit,warm,s){
 if(lit){g.save();g.globalCompositeOperation='lighter';glow(g,x,y,36*s,'rgba(255,170,70,A)',.30*warm+.08);glow(g,x,y,10*s,'rgba(255,220,150,A)',.7);g.restore();
  const fl=g.createRadialGradient(x,y-2*s,0,x,y-2*s,5*s);fl.addColorStop(0,'#FFFFF4');fl.addColorStop(.35,'#FFE08A');fl.addColorStop(.75,'rgba(255,140,40,.8)');fl.addColorStop(1,'rgba(255,100,20,0)');g.fillStyle=fl;g.beginPath();g.moveTo(x,y-7.5*s);g.bezierCurveTo(x+3.4*s,y-3*s,x+2.6*s,y+1.6*s,x,y+1.6*s);g.bezierCurveTo(x-2.6*s,y+1.6*s,x-3.4*s,y-3*s,x,y-7.5*s);g.fill();
  g.fillStyle='rgba(120,160,255,.55)';g.beginPath();g.ellipse(x,y+.6*s,1.1*s,.8*s,0,0,TAU);g.fill()}
 else{g.lineCap='round';for(let k=0;k<2;k++){g.strokeStyle=`rgba(210,210,220,${.28-k*.12})`;g.lineWidth=(1.6+k*2.4)*s;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+7*s,y-5*s,x-4*s,y-13*s,x+5*s,y-20*s-k*8*s);g.stroke()}}}

function barrel(g,x,y,R,seed){g.save();shadow(g,12,'rgba(0,0,0,.7)',4,7);g.fillStyle='#2A1A10';g.beginPath();g.arc(x,y,R,0,TAU);g.fill();g.restore();
 // çıta uçları (kenar halkası)
 const r=rnd(seed);for(let k=0;k<22;k++){const a0=k/22*TAU,a1=(k+1)/22*TAU;g.fillStyle=sh('#6A3E20',(r()-.5)*.3);g.beginPath();g.arc(x,y,R,a0,a1);g.arc(x,y,R-5,a1,a0,true);g.fill();g.strokeStyle='rgba(10,4,0,.7)';g.lineWidth=.5;g.beginPath();g.moveTo(x+Math.cos(a0)*(R-5),y+Math.sin(a0)*(R-5));g.lineTo(x+Math.cos(a0)*R,y+Math.sin(a0)*R);g.stroke()}
 // demir çember
 let gr=g.createLinearGradient(x-R,y-R,x+R,y+R);gr.addColorStop(0,'#D8D2C6');gr.addColorStop(.3,'#6E6860');gr.addColorStop(.6,'#2E2A26');gr.addColorStop(1,'#9A948A');g.strokeStyle=gr;g.lineWidth=2.6;g.beginPath();g.arc(x,y,R-1.3,0,TAU);g.stroke();
 for(let k=0;k<10;k++){const a=k/10*TAU;g.fillStyle='#1A1612';g.beginPath();g.arc(x+Math.cos(a)*(R-1.3),y+Math.sin(a)*(R-1.3),.9,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.4)';g.beginPath();g.arc(x+Math.cos(a)*(R-1.3)-.3,y+Math.sin(a)*(R-1.3)-.3,.35,0,TAU);g.fill()}
 // kapak tahtaları
 const Ri=R-5;g.save();g.beginPath();g.arc(x,y,Ri,0,TAU);g.clip();const bw=Ri*2/5;for(let k=0;k<5;k++){const bx=x-Ri+k*bw;g.fillStyle=sh('#7A4A26',(r()-.5)*.25);g.fillRect(bx,y-Ri,bw,Ri*2);grain(g,bx,y-Ri,bw,Ri*2,seed+k*3,true,1.5);g.fillStyle='rgba(10,4,0,.8)';g.fillRect(bx,y-Ri,.8,Ri*2)}
 // kapak çıtası
 g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x-Ri,y-Ri*.55+1.5,Ri*2,6);g.fillStyle='#5E3418';g.fillRect(x-Ri,y-Ri*.55,Ri*2,5);grain(g,x-Ri,y-Ri*.55,Ri*2,5,seed+9,false,2);
 gr=g.createRadialGradient(x-Ri*.4,y-Ri*.45,1,x,y,Ri);gr.addColorStop(0,'rgba(255,224,180,.25)');gr.addColorStop(1,'rgba(0,0,0,.5)');g.fillStyle=gr;g.fillRect(x-Ri,y-Ri,Ri*2,Ri*2);
 g.fillStyle='#1A1008';g.beginPath();g.arc(x+Ri*.4,y+Ri*.3,2.4,0,TAU);g.fill();g.fillStyle='rgba(255,220,170,.2)';g.beginPath();g.arc(x+Ri*.4-.5,y+Ri*.3-.5,1,0,TAU);g.fill();g.restore()}

function bottle(g,x,y,col,seed){g.save();shadow(g,3,'rgba(0,0,0,.8)',1.5,2.5);let gr=g.createRadialGradient(x-2.4,y-2.4,.3,x,y,7);gr.addColorStop(0,sh(col,-.55));gr.addColorStop(.45,col);gr.addColorStop(1,sh(col,.6));g.fillStyle=gr;g.beginPath();g.arc(x,y,6.8,0,TAU);g.fill();g.restore();
 g.strokeStyle=sh(col,-.3);g.globalAlpha=.6;g.lineWidth=.6;g.beginPath();g.arc(x,y,4.6,0,TAU);g.stroke();g.globalAlpha=1;
 gr=g.createRadialGradient(x-.6,y-.6,0,x,y,2.6);gr.addColorStop(0,'#E2B886');gr.addColorStop(1,'#8A5E32');g.fillStyle=gr;g.beginPath();g.arc(x,y,2.6,0,TAU);g.fill();
 g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.ellipse(x-3.6,y-3,1.6,.7,-.8,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.25)';g.beginPath();g.ellipse(x+3.4,y+3.2,1.2,.5,-.8,0,TAU);g.fill()}
function crate(g,x,y,w,h,seed){g.save();shadow(g,10,'rgba(0,0,0,.7)',4,7);g.fillStyle='#3A2010';g.fillRect(x,y,w,h);g.restore();
 const r=rnd(seed);const th=6;[[x,y,w,th],[x,y+h-th,w,th],[x,y,th,h],[x+w-th,y,th,h]].forEach(([a,b,c,d],i)=>{g.save();g.beginPath();g.rect(a,b,c,d);g.clip();g.fillStyle=sh('#8A5A30',(r()-.5)*.2);g.fillRect(a,b,c,d);grain(g,a,b,c,d,seed+i,c<d,2.4);g.restore();g.strokeStyle='rgba(10,4,0,.7)';g.lineWidth=.6;g.strokeRect(a+.3,b+.3,c-.6,d-.6)});
 g.fillStyle='#1E1008';g.fillRect(x+th,y+th,w-2*th,h-2*th);let gr=g.createLinearGradient(x,y,x,y+h);gr.addColorStop(0,'rgba(0,0,0,.6)');gr.addColorStop(.3,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x+th,y+th,w-2*th,h-2*th);
 for(const [a,b] of [[x+2.5,y+2.5],[x+w-2.5,y+2.5],[x+2.5,y+h-2.5],[x+w-2.5,y+h-2.5]]){g.fillStyle='#2A2420';g.beginPath();g.arc(a,b,1,0,TAU);g.fill()}
 const cols=['#1E5A36','#6A1A2A','#4A3412','#1E3A62'];const nx=Math.floor((w-2*th)/15),ny=Math.floor((h-2*th)/15);for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){bottle(g,x+th+7.5+i*15+(w-2*th-nx*15)/2,y+th+7.5+j*15+(h-2*th-ny*15)/2,cols[(i*3+j*5+seed)%4],seed+i*9+j)}}
function plant(g,x,y,R,seed){const r=rnd(seed);
 g.save();shadow(g,10,'rgba(0,0,0,.7)',4,7);let gr=g.createRadialGradient(x-R*.25,y-R*.25,1,x,y,R*.6);gr.addColorStop(0,'#D27A48');gr.addColorStop(.8,'#9A4A22');gr.addColorStop(1,'#6A2E12');g.fillStyle=gr;g.beginPath();g.arc(x,y,R*.6,0,TAU);g.fill();g.restore();
 g.strokeStyle='rgba(255,210,170,.45)';g.lineWidth=1;g.beginPath();g.arc(x,y,R*.58,Math.PI*.95,Math.PI*1.65);g.stroke();
 gr=g.createRadialGradient(x,y,0,x,y,R*.5);gr.addColorStop(0,'#3A2618');gr.addColorStop(1,'#1A0E06');g.fillStyle=gr;g.beginPath();g.arc(x,y,R*.5,0,TAU);g.fill();g.save();g.beginPath();g.arc(x,y,R*.5,0,TAU);g.clip();tex(g,x-R*.5,y-R*.5,R,R,120,.6,seed);g.restore();
 const cols=['#173A1E','#215A2A','#2E7436','#46934A'];for(let L=0;L<4;L++){const n=7+L*2;for(let k=0;k<n;k++){const a=k/n*TAU+L*.5+r()*.3,len=R*(1.15-L*.2)*(0.85+r()*.3),wd=len*(.2+r()*.06);
  g.save();g.translate(x,y);g.rotate(a);shadow(g,4,'rgba(0,0,0,.55)',1.5,2.5);const lg=g.createLinearGradient(0,-wd,0,wd);lg.addColorStop(0,sh(cols[L],-.18));lg.addColorStop(.5,cols[L]);lg.addColorStop(1,sh(cols[L],.35));g.fillStyle=lg;
  g.beginPath();g.moveTo(len*.1,0);g.bezierCurveTo(len*.35,-wd*1.2,len*.8,-wd*.7,len,0);g.bezierCurveTo(len*.8,wd*.7,len*.35,wd*1.2,len*.1,0);g.fill();noShadow(g);
  g.strokeStyle='rgba(200,240,190,.35)';g.lineWidth=.6;g.beginPath();g.moveTo(len*.12,0);g.quadraticCurveTo(len*.55,-wd*.08,len*.95,0);g.stroke();
  g.strokeStyle='rgba(10,30,10,.35)';g.lineWidth=.4;for(let v=1;v<5;v++){const px=len*(.15+v*.17);g.beginPath();g.moveTo(px,0);g.lineTo(px+len*.07,-wd*.6);g.moveTo(px,0);g.lineTo(px+len*.07,wd*.6);g.stroke()}
  g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.ellipse(len*.5,-wd*.35,len*.25,wd*.18,0,0,TAU);g.fill();g.restore()}}}
function books(g,x,y,seed){const r=rnd(seed);const B=[['#5A1A22',62,44,-.12],['#1E3A52',56,40,.1],['#3A2A12',50,36,-.04]];
 B.forEach(([c,w,h,a],i)=>{g.save();g.translate(x+i*1.5,y-i*1.5);g.rotate(a);shadow(g,6-i,'rgba(0,0,0,.65)',2,3.5);g.fillStyle=sh(c,.2);g.beginPath();g.roundRect(-w/2,-h/2,w,h,2);g.fill();noShadow(g);
  // sayfalar
  g.fillStyle='#E8DCC0';g.fillRect(w/2-4,-h/2+2,3,h-4);g.strokeStyle='rgba(120,100,70,.35)';g.lineWidth=.3;for(let k=0;k<6;k++){g.beginPath();g.moveTo(w/2-4+k*.5,-h/2+2);g.lineTo(w/2-4+k*.5,h/2-2);g.stroke()}
  let gr=g.createLinearGradient(-w/2,-h/2,w/2,h/2);gr.addColorStop(0,sh(c,-.2));gr.addColorStop(1,sh(c,.25));g.fillStyle=gr;g.beginPath();g.roundRect(-w/2,-h/2,w-4,h,[2,0,0,2]);g.fill();
  g.save();g.beginPath();g.rect(-w/2,-h/2,w-4,h);g.clip();tex(g,-w/2,-h/2,w,h,70,.45,seed+i);g.restore();
  g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-w/2,-h/2,5,h);g.strokeStyle='#C8A050';g.lineWidth=.8;g.strokeRect(-w/2+9,-h/2+5,w-22,h-10);g.lineWidth=.4;g.strokeRect(-w/2+11,-h/2+7,w-26,h-14);
  g.fillStyle='rgba(214,170,90,.7)';g.beginPath();g.arc(-w/2+9+(w-22)/2,0,3.2,0,TAU);g.fill();g.restore()})}
function windowLight(g,W,H,P){g.save();g.globalCompositeOperation='lighter';g.filter=`blur(${4}px)`;
 const draw=(x0)=>{g.save();g.translate(x0,-30);g.transform(1,0,.5,1,0,0);const w=74,hh=170;const gr=g.createLinearGradient(0,0,0,hh);gr.addColorStop(0,P.win.replace('A',P.winA));gr.addColorStop(1,P.win.replace('A',0));g.fillStyle=gr;
  g.beginPath();for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])g.rect(a*(w/2+3),b*(hh/2+3),w/2-3,hh/2-3);g.fill();g.restore()};draw(-50);draw(214);g.filter='none';g.restore()}
function timerDial(g,x,y,R){g.save();shadow(g,8,'rgba(0,0,0,.7)',2,4);let br=g.createLinearGradient(x-R,y-R,x+R,y+R);br.addColorStop(0,'#FFE7A6');br.addColorStop(.35,'#C9963E');br.addColorStop(.7,'#6A4614');br.addColorStop(1,'#E0B866');g.fillStyle=br;g.beginPath();g.arc(x,y,R+4,0,TAU);g.fill();g.restore();
 g.strokeStyle='rgba(255,240,200,.6)';g.lineWidth=.7;g.beginPath();g.arc(x,y,R+3.2,Math.PI*1.0,Math.PI*1.6);g.stroke();
 let gr=g.createRadialGradient(x-R*.3,y-R*.3,2,x,y,R);gr.addColorStop(0,'#2E1E14');gr.addColorStop(1,'#0E0704');g.fillStyle=gr;g.beginPath();g.arc(x,y,R,0,TAU);g.fill();
 g.save();g.beginPath();g.arc(x,y,R,0,TAU);g.clip();shadow(g,5,'rgba(0,0,0,.9)',1,2);g.strokeStyle='#000';g.lineWidth=4;g.beginPath();g.arc(x,y,R+2,0,TAU);g.stroke();noShadow(g);
 const gl=g.createLinearGradient(x-R,y-R,x+R*.2,y+R*.2);gl.addColorStop(0,'rgba(255,255,255,.16)');gl.addColorStop(.5,'rgba(255,255,255,.02)');gl.addColorStop(.51,'rgba(255,255,255,0)');g.fillStyle=gl;g.beginPath();g.ellipse(x-R*.3,y-R*.45,R*.95,R*.5,-.55,0,TAU);g.fill();g.restore()}

window.__real={floor,rug,PAL,setS:v=>{S=v}};
window.__drawReal=function(canvas,cfg){const W=360,H=760;S=cfg.dpr||3;canvas.width=W*S;canvas.height=H*S;canvas.style.width=W+'px';canvas.style.height=H+'px';
 const g=canvas.getContext('2d',{willReadFrequently:true});g.scale(S,S);g.imageSmoothingQuality='high';const P=PAL[cfg.phase];const warm=P.lamp;const T=cfg.t;
 floor(g,W,H,P);rug(g,T.cx,T.cy,T.a+66,T.h);
 barrel(g,24,114,30,41);barrel(g,-4,176,25,42);crate(g,292,92,72,54,5);plant(g,344,220,30,8);plant(g,12,662,30,9);books(g,334,654,4);
 for(const s of cfg.seats)stool(g,s.x,s.y,cfg.stoolR,100+s.i,s.cush);
 tableT(g,T.cx,T.cy,T.a,T.h,P);
 for(const s of cfg.seats)candle(g,s.lx,s.ly,!s.dead,warm,cfg.cs);
 if(cfg.timer)timerDial(g,cfg.timer.x,cfg.timer.y,cfg.timer.r);
 windowLight(g,W,H,P);
 // faz rengi
 if(P.tint){g.save();g.globalCompositeOperation='multiply';g.fillStyle=P.tint;g.fillRect(0,0,W,H);g.restore()}
 for(const s of cfg.seats)flame(g,s.lx,s.ly,!s.dead,warm,cfg.cs);
 // asma lamba ışığı: masada sıcak havuz, kenarlar karanlık
 g.save();g.globalCompositeOperation='lighter';glow(g,T.cx,T.cy-10,230,'rgba(255,186,110,A)',.13*warm+.03);for(const s of cfg.seats)if(!s.dead)glow(g,s.lx,s.ly,46,'rgba(255,160,70,A)',.10*warm);g.restore();
 let gr=g.createRadialGradient(W/2,T.cy,T.h*.9,W/2,T.cy,H*.78);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.62)');g.fillStyle=gr;g.fillRect(0,0,W,H);
 // çok hafif film greni
 tex(g,0,0,W,H,14,.5,77,'soft-light')}
})();
