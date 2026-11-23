'use strict';
(function(global){
 const KEY='connext-chart-lock-v1';let locked=false;const captures=new Map(),disabled=new Map();
 const controls='[data-edit-headings],[data-edit-legends],#displayWidth,#displayHeight,#displayRatioTwo,#displayFitPpt,#displayUseScreen,#displayFitCharts,#resetLayout';
 const protectedArea='[data-page-panel],#chartSelection,#chartPopup,#headingEditor,.legend-editor,#reportOptions,'+controls;
 try{locked=JSON.parse(localStorage.getItem(KEY)||'false')===true;}catch{}
 function sync(){document.body.classList.toggle('charts-locked',locked);document.querySelectorAll('[data-chart-lock-toggle]').forEach(button=>{const label=locked?'Unlock chart':'Lock chart';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="'+(locked?'M8 10V7a4 4 0 0 1 8 0v3':'M8 10V7a4 4 0 0 1 7.5-2')+'"/><path d="M12 14v3"/></svg><span>'+label+'</span>';button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(locked));button.title=locked?'ปลดล็อกเพื่อย้าย ยืดหด หรือซูมกราฟ':'ล็อกกราฟ หัวข้อ และ Legend ทุกหน้า';});
  document.querySelectorAll(controls).forEach(control=>{if(locked){if(!disabled.has(control))disabled.set(control,control.disabled);control.disabled=true;}else if(disabled.has(control)){control.disabled=disabled.get(control);disabled.delete(control);}});
 }
 function cancelEditing(){for(const [id,el]of captures){el.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:id}));if(el.hasPointerCapture?.(id))el.releasePointerCapture(id);}captures.clear();document.querySelector('[data-title-done]')?.click();document.querySelector('[data-legend-done]')?.click();global.ConnextCharts?.close();global.ConnextLayoutGuides?.clear();}
 function setLocked(value){const next=value===true;if(next&&!locked)cancelEditing();locked=next;try{localStorage.setItem(KEY,JSON.stringify(locked));}catch{}sync();}
 // Register before chart handlers, including native map and legacy resize controls.
 function guard(event){if(!locked||!event.target.closest?.(protectedArea))return;if(event.type==='keydown'&&!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' ','0','+','-','=','Delete','Backspace'].includes(event.key))return;
  if(event.type!=='wheel'&&event.cancelable)event.preventDefault();event.stopImmediatePropagation();
 }
 for(const type of ['pointerdown','pointermove','click','dblclick','keydown','input','change','touchstart','touchmove'])document.addEventListener(type,guard,{capture:true,passive:false});document.addEventListener('wheel',guard,{capture:true,passive:true});
 document.addEventListener('gotpointercapture',event=>captures.set(event.pointerId,event.target),true);document.addEventListener('lostpointercapture',event=>captures.delete(event.pointerId),true);
 document.querySelectorAll('[data-chart-lock-toggle]').forEach(button=>button.onclick=()=>setLocked(!locked));
 global.ConnextChartLock={all:()=>({locked}),load:raw=>setLocked(raw?.locked===true),setLocked,sync};sync();global.addEventListener('load',sync);
})(window);
