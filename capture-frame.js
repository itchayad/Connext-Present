'use strict';
(function(global){
 function clampFrame(value){const n=(k,f)=>Number.isFinite(value?.[k])?value[k]:f;const w=Math.max(.05,Math.min(1,n('w',1))),h=Math.max(.05,Math.min(1,n('h',1)));return {x:Math.max(0,Math.min(1-w,n('x',0))),y:Math.max(0,Math.min(1-h,n('y',0))),w,h};}
 if(typeof module!=='undefined')module.exports={clampFrame};
 if(typeof document==='undefined')return;
 const storage='connext-capture-frames-v1';let frames={},editing=false,drag=null;
 try{const raw=JSON.parse(localStorage.getItem(storage)||'{}');for(const key of ['drivers','category','trend','rankings','products','groupPerformance','items','volume','customerQty','switching','promo'])if(raw[key])frames[key]=clampFrame(raw[key]);}catch{}
 function defaultFrame(p){const r=p.getBoundingClientRect(),box=window.ConnextSlideBoxes?.[p.dataset.pagePanel],ratio=box?box.w/box.h:2.5,w=Math.min(1,ratio*r.height/r.width),h=Math.min(1,r.width/(ratio*r.height));return {x:(1-w)/2,y:0,w,h};}
 const get=p=>window.ConnextDisplay?{x:0,y:0,w:1,h:1}:clampFrame(frames[p.dataset.pagePanel]||defaultFrame(p));
 const panel=()=>[...document.querySelectorAll('[data-page-panel]')].find(el=>!el.hidden);
 const overlay=document.createElement('div');overlay.id='captureFrame';overlay.setAttribute('data-html2canvas-ignore','true');overlay.hidden=true;
 overlay.innerHTML='<i class="capture-safe-guide"></i><span class="capture-frame-caption">พื้นที่ Capture · สัดส่วนตามแบบ PPT · ลากเพื่อย้าย</span>'+['nw','ne','sw','se'].map(c=>`<button data-corner="${c}" aria-label="Resize capture ${c}"></button>`).join('');document.body.appendChild(overlay);
 const toggle=document.getElementById('editCaptureFrame'),reset=document.getElementById('resetCaptureFrame');
 function save(){try{localStorage.setItem(storage,JSON.stringify(frames));}catch{document.getElementById('captureCopyStatus').textContent='บันทึกกรอบไม่ได้ในเบราว์เซอร์นี้';}}
 function sync(){const p=panel();overlay.hidden=!editing||!p||!document.body.classList.contains('presentation')||document.getElementById('results').hidden;if(overlay.hidden)return;const r=p.getBoundingClientRect(),f=get(p);Object.assign(overlay.style,{left:r.left+f.x*r.width+'px',top:r.top+f.y*r.height+'px',width:f.w*r.width+'px',height:f.h*r.height+'px'});}
 toggle.onclick=()=>{editing=!editing;toggle.setAttribute('aria-pressed',String(editing));toggle.textContent=editing?'เสร็จสิ้นกรอบ':'ตั้งกรอบ Capture';sync();};
 reset.onclick=()=>{const p=panel();if(p){delete frames[p.dataset.pagePanel];save();sync();}};
 overlay.onpointerdown=e=>{if(e.button!==0)return;const p=panel();if(!p)return;e.preventDefault();const r=p.getBoundingClientRect();drag={id:e.pointerId,key:p.dataset.pagePanel,frame:get(p),x:e.clientX,y:e.clientY,width:r.width,height:r.height,corner:e.target.dataset.corner};overlay.setPointerCapture(e.pointerId);};
 overlay.onpointermove=e=>{if(!drag)return;const d=drag,f=d.frame,dx=(e.clientX-d.x)/d.width,dy=(e.clientY-d.y)/d.height;let value;
 if(!d.corner)value={...f,x:f.x+dx,y:f.y+dy};else{let l=f.x,t=f.y,r=f.x+f.w,b=f.y+f.h;if(d.corner.includes('w'))l=Math.max(0,Math.min(r-.05,l+dx));else r=Math.min(1,Math.max(l+.05,r+dx));if(d.corner.includes('n'))t=Math.max(0,Math.min(b-.05,t+dy));else b=Math.min(1,Math.max(t+.05,b+dy));value={x:l,y:t,w:r-l,h:b-t};}frames[d.key]=clampFrame(value);sync();};
 const end=()=>{if(drag){drag=null;save();}};overlay.onpointerup=end;overlay.onpointercancel=end;
 overlay.tabIndex=0;overlay.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;const p=panel();if(!p)return;e.preventDefault();const f=get(p),r=p.getBoundingClientRect();f.x+=(e.key==='ArrowRight'?10:e.key==='ArrowLeft'?-10:0)/r.width;f.y+=(e.key==='ArrowDown'?10:e.key==='ArrowUp'?-10:0)/r.height;frames[p.dataset.pagePanel]=clampFrame(f);save();sync();};
 window.addEventListener('resize',sync);document.addEventListener('scroll',sync,true);new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});document.querySelectorAll('[data-page-panel]').forEach(el=>{new MutationObserver(sync).observe(el,{attributes:true,attributeFilter:['hidden']});if(window.ResizeObserver)new ResizeObserver(sync).observe(el);});
 global.ConnextCaptureFrame={get,all:()=>window.ConnextDisplay?Object.fromEntries(['drivers','category','trend','rankings','products','groupPerformance','items','volume','customerQty','switching','promo'].map(k=>[k,{x:0,y:0,w:1,h:1}])):({...frames}),load:raw=>{frames={};for(const k of ['drivers','category','trend','rankings','products','groupPerformance','items','volume','customerQty','switching','promo'])if(raw?.[k])frames[k]=clampFrame(raw[k]);save();sync();},sync};
})(globalThis);
