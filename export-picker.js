'use strict';
(function(){
 let busy=false;
 function select(choices){
  if(busy)return Promise.resolve(null);busy=true;
  return new Promise(resolve=>{
   const dialog=document.createElement('dialog');dialog.className='export-subclass-picker';
   dialog.innerHTML='<form method="dialog"><h2>เลือก Subclass ที่ต้องการ Export</h2><p>รวมหน้า 1–2 ของ Subclass Total ไว้ต้นไฟล์เสมอ<br>แต่ละ Subclass ที่เลือกจะเพิ่มหน้า 1, 3, 4, 5, 6, 7, 8</p><div class="export-picker-actions"><button type="button" data-all>เลือกทั้งหมด</button><button type="button" data-none>ไม่เลือกทั้งหมด</button></div><div class="export-picker-list"></div><p class="export-picker-count" aria-live="polite"></p><div class="export-picker-actions"><button value="cancel">ยกเลิก</button><button value="ok">OK · Export</button></div></form>';
   const list=dialog.querySelector('.export-picker-list'),inputs=[];
   choices.forEach(selection=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;const name=[...selection.subclass_code_desc][0];input.setAttribute('aria-label',name);label.append(input,document.createTextNode(name));list.append(label);inputs.push(input);});
   const update=()=>{const count=inputs.filter(input=>input.checked).length;dialog.querySelector('.export-picker-count').textContent=count+' Subclass + Total · '+(2+count*7)+' สไลด์';};
   list.onchange=update;for(const [selector,checked] of [['[data-all]',true],['[data-none]',false]])dialog.querySelector(selector).onclick=()=>{inputs.forEach(input=>input.checked=checked);update();};
   dialog.addEventListener('close',()=>{const result=dialog.returnValue==='ok'?choices.filter((_,i)=>inputs[i].checked):null;dialog.remove();busy=false;resolve(result);},{once:true});
   document.body.append(dialog);update();dialog.showModal();
  });
 }
 window.ConnextExportPicker={select};
})();
