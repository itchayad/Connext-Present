'use strict';
(function(){
 const value=window.CONNEXT_DEFAULT_LAYOUT;if(!value)return;
 const pages={products:'brandRegions',groupPerformance:'brandPerformance',customerQty:'brandQty',switching:'brandSwitching'},clone=v=>JSON.parse(JSON.stringify(v));
 function extend(raw){const out={};for(const [key,v]of Object.entries(raw||{})){const [page,...rest]=key.split(':');if(pages[page])out[pages[page]+':'+rest.join(':').replace('packsize-sales','brand-sales')]=clone(v);}return out;}
 for(const field of ['charts','chartViews','headings','legends'])value[field]={...extend(value[field]),...value[field]};
 value.layout.brandRegionProducts=clone(value.layout.regionProducts||{});value.layout.brandQty=clone(value.layout.customerQty||{});
 for(const [old,key]of Object.entries(pages)){if(value.frames?.[old])value.frames[key]=clone(value.frames[old]);}
 try{const marker='connext-brand-layout-v1';if(localStorage.getItem(marker))return;
 const fields={'connext-chart-editor-v1':'charts','connext-chart-views-v1':'chartViews','connext-heading-layout-v1':'headings','connext-legend-layout-v1':'legends'};
 for(const [storage,field]of Object.entries(fields)){const saved=JSON.parse(localStorage.getItem(storage)||'{}');localStorage.setItem(storage,JSON.stringify({...extend(value[field]),...saved}));}
 const saved=JSON.parse(localStorage.getItem('connext-present-layout')||'null');if(saved){saved.brandRegionProducts??=clone(value.layout.brandRegionProducts);saved.brandQty??=clone(value.layout.brandQty);localStorage.setItem('connext-present-layout',JSON.stringify(saved));}localStorage.setItem(marker,'1');
 }catch{}
})();
