'use strict';
// Render locally: no report data is sent to a screenshot service.
(function(){
 const button=document.getElementById('copyCapture'),status=document.getElementById('captureCopyStatus'),download=document.getElementById('downloadCapture');
 let busy=false,lastBlob=null,lastPage='';
 const say=text=>{status.textContent=text;};
 async function captureReport(panel,options={}){
  if(document.fonts?.ready)await document.fonts.ready;
  const rect=panel.getBoundingClientRect(),width=Math.ceil(rect.width),height=Math.ceil(rect.height);
  if(!width||!height)throw Error('ไม่พบพื้นที่รายงาน');
  const frame=window.ConnextCaptureFrame?.get(panel)||{x:0,y:0,w:1,h:1};
  const scale=Math.min(2,8192/Math.max(width,height),Math.sqrt(24000000/(width*height)));
  const properties=['fill','stroke','stroke-width','stroke-dasharray','font-family','font-size','font-weight','color','opacity','text-anchor','dominant-baseline','paint-order','stroke-linejoin','stroke-linecap','stroke-opacity','fill-opacity','letter-spacing'];
  const elements=[panel,...panel.querySelectorAll('*')],snapshots=new Map;
  elements.forEach((el,i)=>{el.setAttribute('data-capture-key',String(i));const css=getComputedStyle(el);snapshots.set(String(i),{left:el.scrollLeft,top:el.scrollTop,css:Array.from(css).map(p=>[p,css.getPropertyValue(p)]),width:css.width,height:css.height});});
  const svgImages=await Promise.all([...panel.querySelectorAll('svg')].map(async svg=>{const copy=svg.cloneNode(true),source=[svg,...svg.querySelectorAll('*')],target=[copy,...copy.querySelectorAll('*')];target.forEach((el,i)=>{const css=getComputedStyle(source[i]);for(const key of properties)el.style.setProperty(key,css.getPropertyValue(key));});const r=svg.getBoundingClientRect();if(!r.width||!r.height)return null;copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',r.width);copy.setAttribute('height',r.height);const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(copy));await image.decode();const raster=document.createElement('canvas');raster.width=Math.ceil(r.width*scale);raster.height=Math.ceil(r.height*scale);raster.getContext('2d').drawImage(image,0,0,raster.width,raster.height);return {key:svg.getAttribute('data-capture-key'),src:raster.toDataURL('image/png'),width:r.width,height:r.height};}));
  try{
  const canvas=await html2canvas(panel,{backgroundColor:'#ffffff',scale,width:Math.ceil(width*frame.w),height:Math.ceil(height*frame.h),x:width*frame.x,y:height*frame.y,windowWidth:window.innerWidth,windowHeight:window.innerHeight,scrollX:window.scrollX,scrollY:window.scrollY,useCORS:true,allowTaint:false,logging:false,imageTimeout:15000,onclone:doc=>{
   const clone=doc.getElementById(panel.id);
   [clone,...clone.querySelectorAll('[data-capture-key]')].forEach(el=>{const snapshot=snapshots.get(el.getAttribute('data-capture-key'));if(!snapshot)return;for(const [p,v]of snapshot.css)el.style.setProperty(p,v);if(el instanceof doc.defaultView.HTMLElement){el.style.width=snapshot.width;el.style.height=snapshot.height;el.style.flexShrink='0';}el.scrollLeft=snapshot.left;el.scrollTop=snapshot.top;});
   if(options.excludeScope)clone.querySelectorAll('[data-scope-layer]').forEach(el=>el.style.visibility='hidden');
   clone.querySelectorAll('.title-adjust-mode').forEach(el=>el.style.outline='none');
   for(const item of svgImages){if(!item)continue;const svg=clone.querySelector(`[data-capture-key="${item.key}"]`);if(!svg)throw Error('ไม่พบกราฟในภาพสำเนา');const image=doc.createElement('img');image.src=item.src;image.style.cssText=svg.style.cssText;image.style.width=item.width+'px';image.style.height=item.height+'px';image.style.display='block';svg.replaceWith(image);}

  }});
  return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('สร้างภาพไม่สำเร็จ')),'image/png'));
  }finally{elements.forEach(el=>el.removeAttribute('data-capture-key'));}

 }
 window.captureConnextReport=captureReport;
 button.onclick=async()=>{
  if(busy)return;
  const panel=[...document.querySelectorAll('[data-page-panel]')].find(el=>!el.hidden);
  if(!panel||document.getElementById('results').hidden){say('กรุณาโหลดข้อมูลรายงานก่อน');return;}
  busy=true;button.disabled=true;download.hidden=true;lastBlob=null;lastPage=panel.dataset.pagePanel;say('กำลังสร้างภาพ…');
  const promise=captureReport(panel).then(blob=>{lastBlob=blob;return blob;});
  // Pass a Promise immediately to retain Safari's click activation.
  try{
   if(!window.isSecureContext||!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw Error('clipboard-unavailable');
   await navigator.clipboard.write([new ClipboardItem({'image/png':promise})]);
   say('คัดลอกแล้ว · วางใน PowerPoint ด้วย Ctrl+V / ⌘+V');
  }catch(error){
   try{await promise;download.hidden=false;say('คัดลอกไม่ได้ · อนุญาต Clipboard แล้วลองใหม่ หรือดาวน์โหลด PNG');}
   catch(renderError){say('สร้างภาพไม่สำเร็จ · ลองใหม่อีกครั้ง');}
  }finally{busy=false;button.disabled=false;}
 };
 download.onclick=()=>{if(!lastBlob)return;const url=URL.createObjectURL(lastBlob),a=document.createElement('a');a.href=url;a.download='Connext-'+lastPage+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
})();
