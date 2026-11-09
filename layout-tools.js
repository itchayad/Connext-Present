'use strict';
(function(global){
 const KEY='connext-layout-tools-v1',button=document.getElementById('toggleLayoutTools');let hidden=false;try{hidden=JSON.parse(localStorage.getItem(KEY)||'false')===true;}catch{}
 function setHidden(value){hidden=value===true;if(hidden){document.querySelector('[data-title-done]')?.click();document.querySelector('[data-legend-done]')?.click();}document.body.classList.toggle('layout-tools-hidden',hidden);button.textContent=hidden?'แสดงเครื่องมือ':'ซ่อนเครื่องมือ';button.setAttribute('aria-pressed',String(hidden));button.title=hidden?'แสดงเมนูปรับฟอนต์และ Layout':'ซ่อนเมนูปรับฟอนต์และ Layout · ยังคลิกกราฟแล้วลาก ↔ ย้าย ได้';try{localStorage.setItem(KEY,JSON.stringify(hidden));}catch{}global.ConnextCharts?.refreshPopup();}
 button.onclick=()=>setHidden(!hidden);global.ConnextLayoutTools={all:()=>({hidden}),load:raw=>setHidden(raw?.hidden===true),setHidden};setHidden(hidden);
})(window);
