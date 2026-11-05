'use strict';
(function(global){
 function encodeLayoutFile(value){return 'window.CONNEXT_LAYOUT_TEMPLATE = '+JSON.stringify(value,null,2)+';\n';}
 function decodeLayoutFile(text){const source=String(text).replace(/^\uFEFF/,'').trim();const match=source.match(/^(?:window\.)?CONNEXT_LAYOUT_TEMPLATE\s*=\s*([\s\S]*?);?\s*$/);return JSON.parse(match?match[1]:source);}
 if(typeof module!=='undefined')module.exports={encodeLayoutFile,decodeLayoutFile};
 if(typeof document==='undefined')return;
 const notify=text=>{document.getElementById('captureCopyStatus').textContent=text;message(text);};
 function downloadLayout(){
  saveLayout();const value={type:'connext-layout-template',version:1,layout:layoutSnapshot(),frames:global.ConnextCaptureFrame.all(),headings:global.ConnextHeadings?.all(),output:{ratiosByPage:Object.fromEntries(Object.entries(global.ConnextSlideBoxes||{}).map(([k,b])=>[k,b.w/b.h])),sideMargin:0}},url=URL.createObjectURL(new Blob([encodeLayoutFile(value)],{type:'application/javascript'})),a=document.createElement('a');a.href=url;a.download=C.reportFileStem(applied)+'.js';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);notify('บันทึกไฟล์ Layout .js แล้ว');
 }
 document.getElementById('saveLayout').onclick=downloadLayout;document.getElementById('saveTemplateFile').onclick=downloadLayout;
 async function loadLayout(e){
  try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw Error('ไฟล์ใหญ่เกินกำหนด');const raw=decodeLayoutFile(await file.text()),layout=C.cleanLayout(raw.layout);if(raw.type!=='connext-layout-template'||raw.version!==1||!layout)throw Error('รูปแบบ Layout ไม่ถูกต้อง');localStorage.setItem(LAYOUT_KEY,JSON.stringify(layout));restoreLayout();global.ConnextCaptureFrame.load(raw.frames);global.ConnextHeadings?.load(raw.headings);if(data){renderCategory();renderProductRegions();renderPromo();refreshLayout();}notify('โหลด Layout ขนาดกราฟ ฟอนต์ หัวข้อ และกรอบ Capture แล้ว');}catch(error){notify('โหลดไม่ได้: '+error.message);}finally{e.target.value='';}
 }
 document.getElementById('loadTemplateFile').onchange=loadLayout;document.getElementById('loadLayoutFile').onchange=loadLayout;
})(globalThis);
