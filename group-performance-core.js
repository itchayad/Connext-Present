'use strict';
(function(global){
 const C=global.Connext||(typeof require==='function'?require('./core.js'):null);
 const GROUP_PERFORMANCE_COLUMNS=[
  ['sales_ly','Sales LY','number'],['sales_ty','Sales TY','number'],['%sales_growth','%Sales growth','percent'],['%sales_growth_cont','%Sales growth cont.','percent'],['%sales_cont','%Sales cont.','percent'],
  ['qty_ly','QTY LY','number'],['qty_ty','QTY TY','number'],['%qty_growth','%QTY growth','percent'],['%qty_growth_cont','%QTY growth cont.','percent'],['%qty_cont','%QTY cont.','percent'],
  ['price_per_unit_ly','Price LY','price'],['price_per_unit_ty','Price TY','price'],['%price_per_unit_change','%Price Change','percent']
 ];
 function groupPerformanceRows(rows){
  const total=rows.filter(r=>C.isCategoryTotal(r.region_));
  if(new Set(total.map(r=>JSON.stringify(C.DIMS.map(k=>r[k])))).size>1)return [];
  return total.slice().sort((a,b)=>a.size_group.localeCompare(b.size_group,'en',{numeric:true,sensitivity:'base'}));
 }
 function topGroupPerformanceRows(rows,period){const prefix=period.toLowerCase()+'_',score=r=>(C.productNumber(r[prefix+'sales_ty'])??0)+(C.productNumber(r[prefix+'sales_ly'])??0);return groupPerformanceRows(rows).sort((a,b)=>score(b)-score(a)||a.size_group.localeCompare(b.size_group,'en',{numeric:true})).slice(0,10).sort((a,b)=>a.size_group.localeCompare(b.size_group,'en',{numeric:true,sensitivity:'base'}));}
 function groupPerformanceValue(value,type){const n=C.productNumber(value,type==='percent');if(n===null)return '';return type==='percent'?(n*100).toFixed(1)+'%':n.toLocaleString('en-US',{minimumFractionDigits:type==='price'?1:0,maximumFractionDigits:1});}
 const api={topGroupPerformanceRows,GROUP_PERFORMANCE_COLUMNS,groupPerformanceRows,groupPerformanceValue};Object.assign(C,api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
