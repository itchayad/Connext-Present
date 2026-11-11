'use strict';
(function(global){
 const pages=['drivers','category','trend','rankings','products','groupPerformance','items','volume','customerQty','switching','promo'];
 function dimensions(raw,screenWidth=1920){const width=Math.round(Math.max(640,Math.min(7680,Number(raw?.width)||Number(screenWidth)||1920))/2)*2;const height=Number.isFinite(Number(raw?.height))&&Number(raw.height)>0?Math.round(Math.max(320,Math.min(3840,Number(raw.height)))):width/2;return {width,height};}
 function fitBoxes(boxes,height){const bottom=Math.max(1,...Object.values(boxes).map(b=>b.y+b.height)),factor=Math.min(1,height/bottom);return Object.fromEntries(Object.entries(boxes).map(([k,b])=>[k,{...b,y:b.y*factor,height:Math.max(80,b.height*factor)}]));}
 if(typeof module!=='undefined')module.exports={dimensions,fitBoxes};if(typeof document==='undefined')return;
 const KEY='connext-display-stage-v1';let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
 let state={...dimensions(saved,screen.width),fitted:Array.isArray(saved?.fitted)?saved.fitted.filter(k=>pages.includes(k)):[]};
 const panels=[...document.querySelectorAll('[data-page-panel]')];let syncing=false,queued=false;
 panels.forEach(panel=>{const viewport=document.createElement('div');viewport.className='display-viewport';panel.before(viewport);viewport.appendChild(panel);panel.classList.add('display-page');});
 const scaleFor=el=>{const panel=el?.closest?.('[data-page-panel]');return panel?Number(panel.dataset.displayScale)||1:1;};
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}};
 function available(panel,canvas){return Math.max(100,state.height-(canvas.getBoundingClientRect().top-panel.getBoundingClientRect().top)/scaleFor(panel)-16);}
 function fitPage(panel){const key=panel.dataset.pagePanel;if(state.fitted.includes(key)||typeof data==='undefined'||!data)return;
  const adapt=(selector,keys,get,set,apply)=>{const canvas=panel.querySelector(selector);if(!canvas||!canvas.querySelector('article'))return false;const boxes=Object.fromEntries(keys.map(k=>[k,{...get(k)}]));set(fitBoxes(boxes,available(panel,canvas)));apply();return true;};
  let fitted=false;
  if(key==='drivers'){const h=state.height-76;document.getElementById('tree').style.height=h+'px';const right=document.getElementById('driversRight');right.style.height=h+'px';for(const [id,f]of [['trend',.29],['impact',.69]]){const el=document.getElementById(id);el.style.width='100%';el.style.height=Math.round(h*f)+'px';}layoutTree();zoom=Math.min(1,document.getElementById('treeScroll').clientWidth/document.getElementById('treeCanvas').offsetWidth,document.getElementById('treeScroll').clientHeight/document.getElementById('treeCanvas').offsetHeight);scaleTree();fitted=true;}
  if(key==='category')fitted=adapt('.category-canvas',categoryKeys,categoryBox,b=>categoryState.layouts=b,applyCategoryLayouts);
  if(key==='products')fitted=adapt('.region-chart-canvas',C.REGION_WIDGETS,k=>regionState.layouts[k]||regionDefaultBox(k),b=>regionState.layouts=b,applyRegionLayouts);
  if(key==='volume')fitted=adapt('.volume-layout',C.VOLUME_KEYS.filter(k=>panel.querySelector(`[data-volume-widget="${k}"]`)),k=>volumeState.layouts[k]||defaultVolumeBox(k),b=>volumeState.layouts=b,applyVolumeLayout);
  if(key==='promo')fitted=adapt('.promo-canvas',C.PROMO_KEYS,k=>promoState.layouts[k]||promoDefaults[k],b=>promoState.layouts=b,applyPromoLayouts);
  if(key==='trend'){const grid=document.getElementById('mapsGrid'),height=available(panel,grid)-185;for(const period of ['YTD','L6M','L3M']){document.getElementById('mapPanel'+period).style.width='calc((100% - 40px) / 3)';document.getElementById('map'+period).style.height=Math.max(160,height)+'px';}setMapSnap(false);fitted=true;}
  if(key==='groupPerformance'){fitGroupPerformanceTables();fitted=true;}
  if(key==='items'){fitItemSizeTables();fitted=true;}
  if(key==='customerQty'){applyCustomerQty();fitted=true;}
  if(key==='switching'){applySwitchingCharts();fitted=true;}
  if(key==='rankings')fitted=true;
  if(fitted){state.fitted.push(key);persist();if(typeof saveLayout==='function')saveLayout();}
 }
 function sync(){if(syncing)return;syncing=true;try{
  panels.forEach(panel=>{const viewport=panel.parentElement;viewport.hidden=panel.hidden;if(panel.hidden)return;panel.style.width=state.width+'px';panel.style.height=state.height+'px';const scale=Math.min(1,Math.max(.1,viewport.clientWidth/state.width));panel.dataset.displayScale=String(scale);panel.style.transform=`scale(${scale})`;viewport.style.height=state.height*scale+'px';fitPage(panel);});
  if(document.activeElement!==document.getElementById('displayWidth'))document.getElementById('displayWidth').value=state.width;if(document.activeElement!==document.getElementById('displayHeight'))document.getElementById('displayHeight').value=state.height;document.getElementById('displayResolution').textContent=state.width+' × '+state.height+' px';document.getElementById('displaySettings').hidden=document.getElementById('results').hidden;
 }finally{syncing=false;}}
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});};
 function resizeStage(value){state={...state,...dimensions(value)};persist();sync();refreshLayout();global.ConnextCharts?.sync();global.ConnextChartZoom?.sync();}
 document.getElementById('displayWidth').onchange=e=>resizeStage({width:e.target.value,height:state.height});
 document.getElementById('displayHeight').onchange=e=>resizeStage({width:state.width,height:e.target.value});
 for(const [id,key,min,max]of [['displayWidth','width',640,7680],['displayHeight','height',320,3840]])document.getElementById(id).oninput=e=>{const value=Number(e.target.value);if(e.target.value!==''&&value>=min&&value<=max)resizeStage({...state,[key]:value});};
 document.getElementById('displayRatioTwo').onclick=()=>resizeStage({width:state.width,height:state.width/2});
 document.getElementById('displayFitPpt').onclick=()=>{const box=global.ConnextSlideBoxes[currentPage]||global.ConnextSlideBoxes.drivers;resizeStage({width:state.width,height:state.width*box.h/box.w});};
 document.getElementById('displayUseScreen').onclick=()=>{resizeStage({width:screen.width,height:screen.height});};
 document.getElementById('displayFitCharts').onclick=()=>{global.ConnextCharts?.resetPage(currentPage);state.fitted=state.fitted.filter(k=>k!==currentPage);sync();refreshLayout();};
 new MutationObserver(schedule).observe(document.getElementById('results'),{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
 if(window.ResizeObserver)new ResizeObserver(schedule).observe(document.querySelector('main'));window.addEventListener('resize',schedule);
 // The frame is the entire stage. Keep old crop controls out of the workflow.
 document.getElementById('editCaptureFrame').hidden=true;document.getElementById('resetCaptureFrame').hidden=true;
 global.ConnextDisplay={all:()=>({...state,ratio:state.width/state.height}),scaleFor,sync,load:raw=>{state={...dimensions(raw,screen.width),fitted:Array.isArray(raw?.fitted)?raw.fitted.filter(k=>pages.includes(k)):raw?pages.slice():[]};persist();sync();},reset:()=>{state={...dimensions(null,screen.width),fitted:[]};persist();sync();}};
 sync();
})(globalThis);
