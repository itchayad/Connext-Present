'use strict';
(function(global){
 const PAGE_LABELS={drivers:'01 · Sales Overview',category:'02 · Category Impact',trend:'03 · Store Maps',rankings:'04 · Store Top / Bottom 10',products:'05 · Product Groups by Region - product sizing',groupPerformance:'06 · Performance by Size Group - product sizing',items:'07 · Product Group by Item',volume:'08 · Customer Volume',customerQty:'09 · QTY Contribution - product sizing',switching:'10 · Switching - product sizing',brandRegions:'11 · Brand by Region - brand',brandPerformance:'12 · Performance - brand',brandQty:'13 · QTY Contribution - brand',brandSwitching:'14 · Switching - brand',promo:'15 · Promotion Performance'};
 function pageChoices(selections,pagesForSelection){const counts=new Map();for(const selection of selections)for(const key of new Set(pagesForSelection(selection)))counts.set(key,(counts.get(key)||0)+1);return Object.entries(PAGE_LABELS).filter(([key])=>counts.has(key)).map(([key,label])=>({key,label,count:counts.get(key)}));}
 function filterPages(pages,selected){const allowed=new Set(selected);return pages.filter(key=>allowed.has(key));}
 if(typeof module!=='undefined')module.exports={PAGE_LABELS,pageChoices,filterPages};if(typeof document==='undefined')return;
 let busy=false;
 function choose({title,note,choices,labelFor,countFor,required=false,confirm='ตกลง'}){
  if(busy)return Promise.resolve(null);busy=true;
  return new Promise(resolve=>{
   const dialog=document.createElement('dialog');dialog.className='export-subclass-picker';dialog.setAttribute('aria-label',title);
   dialog.innerHTML='<form method="dialog"><h2></h2><p data-note></p><div class="export-picker-actions"><button type="button" data-all>เลือกทั้งหมด</button><button type="button" data-none>ไม่เลือกทั้งหมด</button></div><div class="export-picker-list"></div><p class="export-picker-count" aria-live="polite"></p><div class="export-picker-actions"><button value="cancel">ยกเลิก</button><button value="ok" data-confirm></button></div></form>';
   dialog.querySelector('h2').textContent=title;dialog.querySelector('[data-note]').textContent=note;dialog.querySelector('[data-confirm]').textContent=confirm;
   const list=dialog.querySelector('.export-picker-list'),inputs=[];
   choices.forEach(choice=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;const name=labelFor(choice);input.setAttribute('aria-label',name);label.append(input,document.createTextNode(name));list.append(label);inputs.push(input);});
   const selected=()=>choices.filter((_,i)=>inputs[i].checked),update=()=>{const chosen=selected();dialog.querySelector('.export-picker-count').textContent=countFor(chosen);dialog.querySelector('[data-confirm]').disabled=required&&!chosen.length;};
   list.onchange=update;for(const [selector,checked]of [['[data-all]',true],['[data-none]',false]])dialog.querySelector(selector).onclick=()=>{inputs.forEach(input=>input.checked=checked);update();};
   dialog.querySelector('form').addEventListener('submit',event=>{if(event.submitter?.value==='ok'&&required&&!selected().length)event.preventDefault();});
   dialog.addEventListener('close',()=>{const result=dialog.returnValue==='ok'&&(!required||selected().length)?selected():null;dialog.remove();busy=false;resolve(result);},{once:true});
   document.body.append(dialog);update();dialog.showModal();
  });
 }
 function select(choices){return choose({title:'เลือก Subclass ที่ต้องการ Export',note:'รวมขอบเขต Subclass Total ของ Class ด้วย จากนั้นเลือกหน้าที่ต้องการ Export ในขั้นตอนถัดไป',choices,labelFor:selection=>[...selection.subclass_code_desc][0],countFor:chosen=>chosen.length+' Subclass + Total',confirm:'ถัดไป · เลือกหน้า'});}
 async function selectPages(selections){const choices=pageChoices(selections,Connext.reportPagesForSelection),chosen=await choose({title:'เลือกหน้าที่ต้องการ Export',note:'แสดงเฉพาะหน้าที่ใช้ได้กับระดับหมวดที่เลือก หากเลือกหลาย Subclass จะใช้ชุดหน้านี้กับทุก Subclass ที่รองรับ',choices,labelFor:choice=>choice.label+(selections.length>1?' · '+choice.count+' สไลด์':''),countFor:chosen=>chosen.length+' หน้ารายงาน · '+chosen.reduce((sum,choice)=>sum+choice.count,0)+' สไลด์',required:true,confirm:'OK · Export'});return chosen===null?null:chosen.map(choice=>choice.key);}
 global.ConnextExportPicker={select,selectPages,pageChoices,filterPages};
})(globalThis);
