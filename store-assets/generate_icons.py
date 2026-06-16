#!/usr/bin/env python3
"""Final icons + on-brand store backgrounds. Variant A locked."""
import numpy as np
from PIL import Image
import base64, io, os

YELLOW = np.array([253, 184, 19], float)
ORANGE = np.array([244, 67,  30], float)
NAVY   = np.array([ 30, 38, 140], float)
NAVY_D = np.array([ 18, 22,  92], float)

def lerp(a,b,t): t=t[...,None]; return a*(1-t)+b*t
def smoothstep(e0,e1,x): t=np.clip((x-e0)/(e1-e0),0,1); return t*t*(3-2*t)

# ---------- ICON (variant A, circular) ----------
def icon(size, supersample=4, grain=0.07, seed=7):
    S=size*supersample
    yy,xx=np.mgrid[0:S,0:S].astype(float)
    x=(xx/S)*2-1; y=(yy/S)*2-1
    a=np.deg2rad(-38)
    t=x*np.cos(a)+y*np.sin(a); p=-x*np.sin(a)+y*np.cos(a)
    tb=t+0.42*np.sin(2.1*p+0.6)+0.13*np.sin(4.7*p+2.0)
    s=np.sin(3.05*tb+0.4)
    img=np.empty((S,S,3),float); img[:]=YELLOW
    img=lerp(img,ORANGE,smoothstep(-0.35,0.55,s))
    img=lerp(img,NAVY,smoothstep(0.10,0.95,s))
    img=lerp(img,NAVY_D,smoothstep(0.60,1.25,s))
    r=np.sqrt(x*x+y*y)
    img=img+(smoothstep(1.15,0.1,r)*0.10)[...,None]*np.array([255,255,255])
    base=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).resize((size,size),Image.LANCZOS)
    arr=np.asarray(base,float)
    rng=np.random.default_rng(seed)
    g=rng.normal(0,255*grain,(size,size,1))
    sp=rng.random((size,size,1)); g+=np.where(sp>0.985,70,0); g+=np.where(sp<0.015,-70,0)
    arr=arr+g
    yy2,xx2=np.mgrid[0:size,0:size].astype(float)
    cx=(xx2+0.5)/size*2-1; cy=(yy2+0.5)/size*2-1
    rr=np.sqrt(cx*cx+cy*cy); edge=1.5/size
    alpha=np.clip((1.0-rr)/edge+0.5,0,1)*255
    out=np.empty((size,size,4),np.uint8)
    out[...,:3]=np.clip(arr,0,255).astype(np.uint8); out[...,3]=alpha.astype(np.uint8)
    return Image.fromarray(out,"RGBA")

# ---------- BACKGROUND (dark, big soft bent bands, grain, vignette) ----------
def background(w, h, grain=0.035, seed=11, darken=0.42, accent=0.5):
    S=2  # mild supersample
    W,H=w*S,h*S
    yy,xx=np.mgrid[0:H,0:W].astype(float)
    m=max(W,H)
    x=(xx-W/2)/m*2; y=(yy-H/2)/m*2
    a=np.deg2rad(-32)
    t=x*np.cos(a)+y*np.sin(a); p=-x*np.sin(a)+y*np.cos(a)
    tb=t+0.30*np.sin(1.5*p+0.4)+0.10*np.sin(3.4*p+1.5)
    s=np.sin(2.2*tb+0.3)
    img=np.empty((H,W,3),float); img[:]=YELLOW
    img=lerp(img,ORANGE,smoothstep(-0.30,0.60,s))
    img=lerp(img,NAVY,smoothstep(0.10,0.98,s))
    img=lerp(img,NAVY_D,smoothstep(0.60,1.25,s))
    # darken toward a premium near-black, keep bands as glow
    base_dark=np.array([16,16,20],float)
    img=lerp(img.reshape(-1,3),base_dark,np.full(H*W,1-accent)).reshape(H,W,3) if False else \
        base_dark*(1-darken)+img*darken
    # vignette
    r=np.sqrt(x*x+y*y)
    vig=smoothstep(1.6,0.2,r)
    img=img*(0.55+0.45*vig[...,None])
    out=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).resize((w,h),Image.LANCZOS)
    arr=np.asarray(out,float)
    rng=np.random.default_rng(seed)
    arr=arr+rng.normal(0,255*grain,(h,w,1))
    return Image.fromarray(np.clip(arr,0,255).astype(np.uint8),"RGB")

def b64(img):
    buf=io.BytesIO(); img.save(buf,"PNG"); return base64.b64encode(buf.getvalue()).decode()

if __name__=="__main__":
    out=os.path.dirname(os.path.abspath(__file__))
    icon(128,grain=0.07).save(f"{out}/icon-128.png")
    icon(48,grain=0.05).save(f"{out}/icon-48.png")
    icon(16,grain=0.02).save(f"{out}/icon-16.png")
    icon(256,grain=0.06).save(f"{out}/logo-256.png")
    background(1280,800).save(f"{out}/bg_hero.png")
    background(1400,560,seed=21).save(f"{out}/bg_marquee.png")
    background(440,280,seed=31).save(f"{out}/bg_tile.png")
    print("assets done")
