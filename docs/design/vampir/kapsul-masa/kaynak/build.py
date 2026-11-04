import json, math, re, os, itertools
D=os.path.dirname(os.path.abspath(__file__)); A=json.load(open(D+'/assets.json')); FACES=A['faces']; CARDS=A['cards']
SCENE=open(D+'/real2.js').read()+'\n'+open(D+'/toon2.js').read()
_uid=itertools.count(1)
def face(n,s,extra=''):
    svg=FACES[n]; u=f'z{next(_uid)}'
    svg=re.sub(r'id="q\d+"',f'id="{u}"',svg); svg=re.sub(r'url\(#q\d+\)',f'url(#{u})',svg)
    svg=re.sub(r'width="\d+" height="\d+"',f'width="{s}" height="{s}"',svg,count=1)
    return svg.replace('<svg ',f'<svg style="{extra}" ',1) if extra else svg
CUSH={'Sen':['#7A5AB8','#3A2A5A'],'kapsul-zh78':['#C2507A','#5A1A30'],'kapsul-sd62':['#6A5AB0','#2A2050'],'kapsul-ud91':['#2A7AB8','#103050'],
 'kapsul-fv10':['#3AA06A','#14402A'],'kapsul-dn78':['#1E9A8A','#0A3A34'],'kapsul-te89':['#3A8A3A','#143A14'],'kapsul-hh05':['#D8702A','#5A2A0A'],
 'kapsul-pk33':['#B8902A','#4A3A0A'],'kapsul-lm40':['#8A3AA0','#3A104A'],'kapsul-rb17':['#A03A3A','#4A1010'],'kapsul-yo64':['#2A6A9A','#0A2A4A']}
P8=['Sen','kapsul-zh78','kapsul-sd62','kapsul-ud91','kapsul-fv10','kapsul-dn78','kapsul-te89','kapsul-hh05']
P12=['Sen','kapsul-zh78','kapsul-sd62','kapsul-ud91','kapsul-pk33','kapsul-fv10','kapsul-dn78','kapsul-lm40','kapsul-rb17','kapsul-te89','kapsul-hh05','kapsul-yo64']
ROLE={'Sen':'vampir','kapsul-zh78':'doktor','kapsul-sd62':'gozcu','kapsul-ud91':'koylu','kapsul-fv10':'koylu','kapsul-dn78':'koylu','kapsul-te89':'soytari','kapsul-hh05':'vampir'}
V8={'kapsul-sd62':['Sen','kapsul-ud91'],'Sen':['kapsul-te89'],'kapsul-hh05':['kapsul-zh78']}
V12={'kapsul-sd62':['kapsul-ud91','kapsul-dn78','kapsul-lm40'],'kapsul-rb17':['kapsul-zh78','kapsul-yo64'],'Sen':['kapsul-pk33'],'kapsul-hh05':['kapsul-te89']}
T=dict(cx=180,cy=380,a=118,h=112)
G8=dict(off=18,stool=27,fs=38,cls='',cw=24,ch=33,cin=27,cs=.62,ltan=22)
G12=dict(off=15,stool=22,fs=30,cls=' sm',cw=19,ch=26,cin=22,cs=.5,ltan=17)
def ring(s,R):
    a,h=R,T['h'];cx,cy=T['cx'],T['cy'];q=math.pi*a;per=2*q+4*h;s%=per
    # alttan başla, sola (saat yönü tersi ekranda) dolaş
    if s<q/2: th=math.pi/2+s/a; return cx+a*math.cos(th),cy+h+a*math.sin(th),th
    s-=q/2
    if s<2*h: return cx-a,cy+h-s,math.pi
    s-=2*h
    if s<q: th=math.pi+s/a; return cx+a*math.cos(th),cy-h+a*math.sin(th),th
    s-=q
    if s<2*h: return cx+a,cy-h+s,0.0
    s-=2*h; th=s/a; return cx+a*math.cos(th),cy+h+a*math.sin(th),th
def seats(PL,G,dead):
    R=T['a']+G['off'];per=2*math.pi*R+4*T['h'];out=[]
    for i,n in enumerate(PL):
        x,y,th=ring(i*per/len(PL),R)
        nx,ny=math.cos(th),math.sin(th); d=G['off']+G['cin']
        cxp,cyp=x-nx*d,y-ny*d; tx,ty=-ny,nx
        lx,ly=cxp+tx*G['ltan'],cyp+ty*G['ltan']
        out.append(dict(i=i,n=n,x=x,y=y,th=th,cx=cxp,cy=cyp,lx=lx,ly=ly,rot=math.degrees(th)-90,dead=n in dead,cush=CUSH[n]))
    return out
CSS=open(D+'/style.css').read()+''.join(f'.rc-{k}{{background-image:url({v})}}' for k,v in CARDS.items())
PHASE={'rol':'night','gece':'night','sabah':'dawn','oylama':'day','sonuc':'end'}
FELT={'night':'#1F4A36','dawn':'#2A4A36','day':'#2E5A3E','end':'#3A1A22'}
def screen(st,idx,PL=P8,G=G8,V=V8):
    dead={'rol':[],'gece':[],'sabah':['kapsul-fv10'],'oylama':['kapsul-fv10'],'sonuc':['kapsul-fv10','kapsul-sd62','kapsul-dn78']}[st]
    S=seats(PL,G,dead);ph=PHASE[st]
    timer=None
    if st=='gece': timer=dict(x=180,y=392,r=34,frac=.7,low=False)
    if st=='sabah': timer=dict(x=180,y=470,r=26,frac=.08,low=True)
    if st in('oylama',): timer=dict(x=180,y=258,r=22,frac=.52,low=False)
    cfg=dict(phase=ph,felt=FELT[ph],t=T,stoolR=G['stool'],cs=G['cs'],timer=timer,seed=70+idx,
             seats=[{k:s[k] for k in('i','x','y','lx','ly','dead','cush')} for s in S])
    cid=f'c{idx}'
    h=[f'<div class="ph"><canvas id="{cid}"></canvas><script>window.__Q=(window.__Q||[]).concat([["{cid}",{json.dumps(cfg)}]])</script>',
       '<div class="sb"><span>21:14</span><span>5G&nbsp;&nbsp;%64</span></div>',
       '<button class="x" aria-label="Oyundan çık"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>']
    cnt={k:len(v) for k,v in V.items()} if st=='oylama' else {}
    for s in S:
        n=s['n'];cls=G['cls']+(' dead' if s['dead'] else '')
        if st=='gece' and n=='kapsul-fv10': cls+=' pick'
        if st=='oylama' and n=='kapsul-sd62': cls+=' pick'
        if st=='sonuc' and ROLE.get(n)=='vampir': cls+=' win'
        # kart: masada, kişinin önünde
        if st=='sonuc':
            r=ROLE.get(n,'koylu');card=f'rc-{r}'
        elif st=='rol' and n=='Sen': card='slot'
        else: card='rc-arka'
        w,hh=G['cw'],G['ch']
        if card=='slot':
            h.append(f'<span class="slot" style="left:{s["cx"]-w/2:.1f}px;top:{s["cy"]-hh/2:.1f}px;width:{w}px;height:{hh}px;transform:rotate({s["rot"]:.1f}deg)"></span>')
        else:
            h.append(f'<span class="rc card{" dk" if s["dead"] and st!="sonuc" else ""}{" vg" if st=="sonuc" and ROLE.get(n)=="vampir" else ""}" style="left:{s["cx"]-w/2:.1f}px;top:{s["cy"]-hh/2:.1f}px;width:{w}px;height:{hh}px;transform:rotate({s["rot"]:.1f}deg)"></span>'.replace('class="rc card',f'class="rc {card} card'))
        fs=G['fs'];lab=n+(f'<b>{cnt[n]}</b>' if n in cnt else '')
        h.append(f'<div class="seat{cls}" style="left:{s["x"]:.1f}px;top:{s["y"]:.1f}px"><span class="f{" you" if n=="Sen" else ""}">{face(n,fs)}</span><span class="nm">{lab}</span></div>')
    # masa ortası sahne
    c='<div class="stage" style="top:{t}px">{b}</div>'
    if st=='rol':
        h.append(c.format(t=212,b='<span class="pill">Rolünü gör</span><span class="rc rc-vampir rolec"></span><div class="h">Rolün: Vampir</div><div class="s">Her gece diğer vampirlerle birini ısırırsın. Gündüz köylü gibi davran.</div>'
                 f'<div class="mate">{face("kapsul-hh05",22)}<span>Diğer vampir<br><b>kapsul-hh05</b></span></div><div class="rdy">Hazır: 5/8</div>'))
        h.append('<div class="foot"></div><button class="btn">Hazırım</button>')
    elif st=='gece':
        h.append(c.format(t=220,b='<span class="pill">Gece 1</span><div class="h">Bu gece kimi ısırıyorsunuz?</div><div class="s">Vampirler birlikte seçer. Çoğunluğun seçtiği ısırılır.</div>'))
        h.append('<div class="num" style="top:381px">0:42</div>')
        h.append(f'<div class="stage" style="top:442px"><div class="tgt">{face("kapsul-fv10",44)}</div><div class="tn">kapsul-fv10</div></div>')
        h.append('<div class="foot"></div><button class="btn">Seç</button>')
    elif st=='sabah':
        h.append(c.format(t=232,b=f'<span class="pill sun">Sabah</span><div class="vict">{face("kapsul-fv10",56)}</div><div class="h">Gece kapsul-fv10 öldü</div><div class="s">Rolü oyun sonunda açılır.</div>'))
        h.append('<div class="num sm low" style="top:461px">0:05</div>')
        h.append('<div class="foot"></div><div class="sign">Gündüz başlıyor</div>')
    elif st=='oylama':
        big=G is G8
        h.append(c.format(t=212,b='<span class="pill day">Oylama</span>'))
        h.append(f'<div class="num sm" style="top:249px">0:31</div>')
        h.append(c.format(t=290,b='<div class="h">Kimi eliyorsunuz?</div><div class="s">Oylar herkese görünür. En çok oy alan elenir; eşitlikte kimse elenmez.</div>'))
        # adaylar: oy alanın yüzü + çevresinde oy verenlerin halkası
        order=sorted(V,key=lambda k:-len(V[k]))
        def cand(n,x,y,fs,vs,short=False):
            o=f'<div class="cand" style="left:{x}px;top:{y}px">{face(n,fs,"border-radius:50%")}'
            vv=V[n];R=fs/2+vs/2+1
            for j,v in enumerate(vv):
                a=-math.pi/2+(j-(len(vv)-1)/2)*0.78
                o+=f'<span class="vr" style="left:{math.cos(a)*R-vs/2:.1f}px;top:{math.sin(a)*R-vs/2:.1f}px">{face(v,vs)}</span>'
            o+=(f'<span class="cl c" style="top:{fs/2+5}px"><b>{len(vv)}</b></span></div>' if short else f'<span class="cl" style="top:{fs/2+6}px">{n}<b>{len(vv)}</b></span></div>')
            return o
        y0=420
        h.append(cand(order[0],180,y0,46,18))
        rest=order[1:]
        if len(rest)==2: xs=[134,226]
        else: xs=[124,180,236]
        for x,n in zip(xs,rest): h.append(cand(n,x,y0+86,30,15,len(rest)>2))
        h.append('<div class="foot"></div><button class="btn">Oyumu ver</button>')
    elif st=='sonuc':
        h.append(c.format(t=250,b=f'<span class="pill end">Oyun bitti</span><div class="duo">{face("Sen",48)}{face("kapsul-hh05",48)}</div><div class="h big">Vampirler kazandı</div><div class="s">Rolün Vampir. Takımın kazandı.</div>'))
        h.append('<div class="foot"></div><button class="btn sec" style="right:auto;width:126px">Masaya dön</button><button class="btn" style="left:156px">Yeniden oyna</button>')
    h.append('<div class="home"></div></div>')
    return ''.join(h)
STATES=[('rol','Rolün'),('gece','Gece'),('sabah','Sabah'),('oylama','Oylama'),('sonuc','Sonuç')]
html=['<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vampir Köylü kapsül masa</title>',
 '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet"><style>',CSS,'</style></head><body>',
 '<header><h1>Vampir Köylü: kapsül masa</h1><p class="lead">Çalışma dosyası, Aura tuvaline konmadı. Masa dikey kapsül, oda tamamen kuş bakışı. Koltuklar masanın çevresine eşit aralıkla dizilir. Herkesin kartı önünde kapalı durur, yanında mumu yanar; ölenin mumu söner ve kartı kararır. Rol, süre, ölüm, oylama ve sonuç masanın ortasında gösterilir. Karışık teknik: arka plan (zemin, halı) yumuşak ve gerçekçi; masa ve objeler kalın siyah konturlu, düz renkli çizgi film. Masa tablası ceviz tahta. Riso yalnız rol kartlarında.</p></header><section><div class="row">']
for i,(st,sl) in enumerate(STATES): html.append(f'<figure><figcaption>{i+1} · {sl}</figcaption>{screen(st,i)}</figure>')
html.append(f'<figure><figcaption>6 · Oylama, 12 kişi</figcaption>{screen("oylama",5,P12,G12,V12)}</figure>')
html.append('</div></section><div style="height:60px"></div><script>'+SCENE+'\n(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{(window.__Q||[]).forEach(([id,cfg])=>drawCap(document.getElementById(id),cfg));window.__done=1})</script></body></html>')
open(D+'/page.html','w').write(''.join(html));print('ok')
