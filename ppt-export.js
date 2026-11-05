'use strict';
(function(){
 const NS='http://schemas.openxmlformats.org/presentationml/2006/main',REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const parse=s=>new DOMParser().parseFromString(s,'application/xml'),xml=d=>new XMLSerializer().serializeToString(d);
 function placement(width,height,page='drivers',withScope=false){let box=window.ConnextSlideBoxes?.[page]||{x:0,y:.95,w:13.3333333333,h:6.05};const ratio=Math.min(box.w/width,box.h/height),w=width*ratio,h=height*ratio;return {x:box.x+(box.w-w)/2,y:box.y,w,h};}
 async function build(template,images,pages=['drivers','category','trend','rankings','products','volume','promo'],scope=[]){
  const zip=await JSZip.loadAsync(template),base=await zip.file('ppt/slides/slide1.xml').async('string'),rels=await zip.file('ppt/slides/_rels/slide1.xml.rels').async('string');
  const pres=parse(await zip.file('ppt/presentation.xml').async('string')),list=pres.getElementsByTagNameNS(NS,'sldIdLst')[0];while(list.firstChild)list.removeChild(list.firstChild);
  const pr=parse(await zip.file('ppt/_rels/presentation.xml.rels').async('string'));[...pr.documentElement.children].filter(e=>e.getAttribute('Type')===REL+'/slide').forEach(e=>e.remove());
  const types=parse(await zip.file('[Content_Types].xml').async('string')),ct=types.documentElement,ctNS=ct.namespaceURI;
  if(![...ct.children].some(e=>e.getAttribute('Extension')==='png')){const n=types.createElementNS(ctNS,'Default');n.setAttribute('Extension','png');n.setAttribute('ContentType','image/png');ct.appendChild(n);}
  for(let i=0;i<images.length;i++){
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
 document.getElementById('exportPowerPoint').onclick=async()=>{
  const button=document.getElementById('exportPowerPoint'),status=document.getElementById('captureCopyStatus');if(!data){status.textContent='กรุณาโหลดข้อมูลก่อน';return;}button.disabled=true;
  const previous=currentPage,classes=document.body.className,images=[],pages=C.reportPagesForSelection(applied);
  try{
   document.body.classList.add('presentation');const selected=document.getElementById('pptTemplate').files[0];let template;if(selected)template=await selected.arrayBuffer();else{const response=await fetch('report-template.pptx');if(!response.ok)throw Error('กรุณาเลือกไฟล์ Template PPTX จากเครื่องก่อน');template=await response.arrayBuffer();}
   for(const page of pages){
    status.textContent='กำลัง Export '+(images.length+1)+'/'+pages.length;showPage(page);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    if(page==='category')renderCategory();if(page==='products')renderProductRegions();refreshLayout();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const panel=[...document.querySelectorAll('[data-page-panel]')].find(el=>el.dataset.pagePanel===page);
    const has=page==='category'?selectedCategoryView().categories.length:page==='products'?!!panel.querySelector('svg rect,svg circle,svg polyline,svg path'):page==='drivers'?active.tree?.length:page==='trend'||page==='rankings'?active.stores?.length:page==='volume'?C.filtered(data[6]||[],applied).length:C.promoFilter(data[8]||[],applied).length;
    window.ConnextHeadings?.apply();
    images.push(has?await window.captureConnextReport(panel,{excludeScope:true}):null);
   }
   const blob=await build(template,images,pages,C.reportScope(applied)),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=C.reportFileStem(applied)+'.pptx';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Export PowerPoint แล้ว · '+pages.length+' หน้า';
  }catch(e){status.textContent='Export ไม่สำเร็จ: '+e.message;}finally{document.body.className=classes;showPage(previous);window.ConnextCaptureFrame?.sync();button.disabled=false;}
 };
 window.ConnextPpt={placement,build};
})();
