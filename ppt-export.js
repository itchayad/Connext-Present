'use strict';
(function(){
 const NS='http://schemas.openxmlformats.org/presentationml/2006/main',REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const parse=s=>new DOMParser().parseFromString(s,'application/xml'),xml=d=>new XMLSerializer().serializeToString(d);
 function placement(width,height,page='drivers',withScope=false){let box=window.ConnextSlideBoxes?.[page]||{x:0,y:.95,w:13.3333333333,h:6.05};const ratio=Math.min(box.w/width,box.h/height),w=width*ratio,h=height*ratio;return {x:box.x+(box.w-w)/2,y:box.y,w,h};}
 async function build(template,images,pages=['drivers','category','trend','rankings','products','groupPerformance','items','volume','customerQty','switching','promo'],scope=[],slideScopes=[]){
  const zip=await JSZip.loadAsync(template),base=await zip.file('ppt/slides/slide1.xml').async('string'),rels=await zip.file('ppt/slides/_rels/slide1.xml.rels').async('string');
  const pres=parse(await zip.file('ppt/presentation.xml').async('string')),list=pres.getElementsByTagNameNS(NS,'sldIdLst')[0];while(list.firstChild)list.removeChild(list.firstChild);
  const pr=parse(await zip.file('ppt/_rels/presentation.xml.rels').async('string'));[...pr.documentElement.children].filter(e=>e.getAttribute('Type')===REL+'/slide').forEach(e=>e.remove());
  const types=parse(await zip.file('[Content_Types].xml').async('string')),ct=types.documentElement,ctNS=ct.namespaceURI;
  if(![...ct.children].some(e=>e.getAttribute('Extension')==='png')){const n=types.createElementNS(ctNS,'Default');n.setAttribute('Extension','png');n.setAttribute('ContentType','image/png');ct.appendChild(n);}
  const defaultScope=scope;for(let i=0;i<images.length;i++){const scope=slideScopes[i]||defaultScope;
   const n=i+1,doc=parse(base),relationship=parse(rels),entry=images[i];
   // Preserve all original theme, master, layout, footer and comment space.
   const texts=doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main','t');for(const t of texts)if(t.textContent==='1')t.textContent=String(n);
   if(entry){const image=await createImageBitmap(entry),b=placement(image.width,image.height,pages[i],scope.length>0);image.close();const emu=v=>Math.round(v*914400);
    const pic=parse(`<p:pic xmlns:p="${NS}" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${REL}"><p:nvPicPr><p:cNvPr id="900" name="Report image"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rIdReport"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${emu(b.x)}" y="${emu(b.y)}"/><a:ext cx="${emu(b.w)}" cy="${emu(b.h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`).documentElement;
    doc.getElementsByTagNameNS(NS,'spTree')[0].appendChild(doc.importNode(pic,true));zip.file(`ppt/media/report${n}.png`,await entry.arrayBuffer());const r=relationship.createElementNS(relationship.documentElement.namespaceURI,'Relationship');r.setAttribute('Id','rIdReport');r.setAttribute('Type',REL+'/image');r.setAttribute('Target',`../media/report${n}.png`);relationship.documentElement.appendChild(r);
   }
   if(scope.length){const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),paragraphs=scope.map(r=>`<a:p><a:r><a:rPr lang="en-US" sz="800"><a:solidFill><a:srgbClr val="17263C"/></a:solidFill><a:latin typeface="Leelawadee"/><a:ea typeface="Leelawadee"/></a:rPr><a:t>${escape(r.label+': '+r.value)}</a:t></a:r></a:p>`).join('');const layer=parse(`<p:sp xmlns:p="${NS}" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:nvSpPr><p:cNvPr id="901" name="Report scope"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="144387" y="888099"/><a:ext cx="2136900" cy="441080"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" rIns="0" tIns="0" bIns="0"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`).documentElement;doc.getElementsByTagNameNS(NS,'spTree')[0].appendChild(doc.importNode(layer,true));}
   zip.file(`ppt/slides/slide${n}.xml`,xml(doc));zip.file(`ppt/slides/_rels/slide${n}.xml.rels`,xml(relationship));
   const id='rIdReportSlide'+n,rel=pr.createElementNS(pr.documentElement.namespaceURI,'Relationship');rel.setAttribute('Id',id);rel.setAttribute('Type',REL+'/slide');rel.setAttribute('Target',`slides/slide${n}.xml`);pr.documentElement.appendChild(rel);const s=pres.createElementNS(NS,'p:sldId');s.setAttribute('id',String(300+n));s.setAttributeNS(REL,'r:id',id);list.appendChild(s);
   const path=`/ppt/slides/slide${n}.xml`;if(![...ct.children].some(e=>e.getAttribute('PartName')===path)){const t=types.createElementNS(ctNS,'Override');t.setAttribute('PartName',path);t.setAttribute('ContentType','application/vnd.openxmlformats-officedocument.presentationml.slide+xml');ct.appendChild(t);}
  }
  zip.file('ppt/presentation.xml',xml(pres));zip.file('ppt/_rels/presentation.xml.rels',xml(pr));zip.file('[Content_Types].xml',xml(types));return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',compression:'DEFLATE'});
 }
 function subclassSelections(){return data?C.exportSubclassSelections(data.flatMap((rows,i)=>i===4?[]:rows||[]),applied):[];}
 function syncScope(){const input=document.getElementById('exportSubclassScope');if(!input)return;const choices=subclassSelections(),option=input.querySelector('[value="subclasses"]');option.disabled=!choices.length;if(!choices.length)input.value='current';document.getElementById('exportSubclassCount').textContent=input.value==='subclasses'?choices.length+' Subclass · '+(2+choices.length*8)+' หน้า (รวม Total)':'';}
 async function exportPowerPoint(){
  const buttons=[document.getElementById('exportPowerPoint'),document.getElementById('exportPowerPointNormal')],status={set textContent(value){document.getElementById('captureCopyStatus').textContent=value;document.getElementById('normalExportStatus').textContent=value;}};if(!data){status.textContent='กรุณาโหลดข้อมูลก่อน';return;}if(buttons.some(b=>b.disabled))return;
  const scopeInput=document.getElementById('exportSubclassScope'),batch=scopeInput?.value==='subclasses';let selections=batch?subclassSelections():[applied];if(!selections.length){status.textContent='กรุณาเลือก Class ที่ระบุชื่อและกด Run report ก่อน';return;}
  if(batch){const chosen=await window.ConnextExportPicker.select(selections);if(chosen===null)return;selections=[{...copy(applied),subclass_code_desc:new Set(['Total'])},...chosen];}
  const previous=currentPage,classes=document.body.className,images=[],pages=[],scopes=[],stem=C.reportFileStem(batch?{...applied,subclass_code_desc:new Set(['Total'])}:applied)+(batch?'-subclasses':'');
  const original=batch?{applied:copy(applied),draft:copy(draft),pending:document.getElementById('pending').hidden,layout:typeof layoutSnapshot==='function'?layoutSnapshot():null,charts:window.ConnextCharts?.all(),views:window.ConnextChartZoom?.all()}:null;
  buttons.forEach(b=>b.disabled=true);if(scopeInput)scopeInput.disabled=true;
  try{
   document.body.classList.add('presentation');const selected=document.getElementById('pptTemplate').files[0];let template;if(selected)template=await selected.arrayBuffer();else{const response=await fetch('report-template.pptx');if(!response.ok)throw Error('กรุณาเลือกไฟล์ Template PPTX จากเครื่องก่อน');template=await response.arrayBuffer();}
   const total=selections.reduce((sum,selection)=>sum+C.reportPagesForSelection(selection).length,0);let index=0;
   for(const selection of selections){if(batch){draft=copy(selection);run();window.ConnextChartZoom?.load(original.views);}index++;
    for(const page of C.reportPagesForSelection(applied)){
     status.textContent='กำลัง Export '+(images.length+1)+'/'+total+(batch?' · '+(index===1?'Subclass Total':'Subclass '+(index-1)+'/'+(selections.length-1)):'');showPage(page);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
     if(page==='category')renderCategory();if(page==='products')renderProductRegions();refreshLayout();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
     const panel=[...document.querySelectorAll('[data-page-panel]')].find(el=>el.dataset.pagePanel===page);
     const has=page==='category'?selectedCategoryView().categories.length:page==='products'?!!panel.querySelector('svg rect,svg circle,svg polyline,svg path'):page==='drivers'?active.tree?.length:page==='trend'||page==='rankings'?active.stores?.length:page==='groupPerformance'?groupPerformanceRowsForSelection().length:page==='items'?itemSizeRows().some(r=>r.region_===document.getElementById('itemSizeRegion').value):page==='customerQty'?customerQtyRows().length:page==='switching'?switchingRows().length:page==='volume'?C.filtered(data[6]||[],applied).length:C.promoFilter(data[8]||[],applied).length;
     window.ConnextHeadings?.apply();window.ConnextCharts?.sync();images.push(has?await window.captureConnextReport(panel,{excludeScope:true}):null);pages.push(page);scopes.push(C.reportScope(applied));
    }
   }
   const blob=await build(template,images,pages,[],scopes),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=stem+'.pptx';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Export PowerPoint แล้ว · '+pages.length+' หน้า'+(batch?' · '+(selections.length-1)+' Subclass + Total':'');
  }catch(e){status.textContent='Export ไม่สำเร็จ: '+e.message;}finally{
   try{if(original){applied=copy(original.applied);draft=copy(original.applied);if(original.layout){localStorage.setItem(LAYOUT_KEY,JSON.stringify(original.layout));restoreLayout();}run();window.ConnextCharts?.load(original.charts);window.ConnextChartZoom?.load(original.views);draft=copy(original.draft);filters();document.getElementById('pending').hidden=original.pending;}}finally{document.body.className=classes;showPage(previous);window.ConnextCaptureFrame?.sync();buttons.forEach(b=>b.disabled=false);if(scopeInput)scopeInput.disabled=false;}
  }
 };
 document.getElementById('exportPowerPoint').onclick=exportPowerPoint;document.getElementById('exportPowerPointNormal').onclick=exportPowerPoint;
 window.ConnextPpt={placement,build,syncScope};document.getElementById('exportSubclassScope').onchange=syncScope;new MutationObserver(syncScope).observe(document.getElementById('scope'),{childList:true,subtree:true});syncScope();
})();
