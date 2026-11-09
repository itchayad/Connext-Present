'use strict';
(function(global){
 const C=global.Connext||(typeof require==='function'?require('./core.js'):null),FILE='10_item_size.csv';
 const aliases={format_code_desc:'site_format_no',division_code_desc:'division_name',department_code_desc:'department_name',subdepartment_code_desc:'subdepartment_name',class_code_desc:'class_name',subclass_code_desc:'subclass_name'};
 const numbers=['size_group_rank','size_group_rank_rev','sg_%qty_cont_chg_ytd_to_l3m','item_rank_in_sg','item_rank_in_sg_rev','ytd_%qty_cont','l3m_%qty_cont','%qty_cont_chg_ytd_to_l3m'];
 function validateItemSize(parsed){
  const missing=[...Object.values(aliases),'region_','size_group','barcode','item_name','brand',...numbers].filter(k=>!parsed.headers.includes(k));
  if(missing.length)throw Error(FILE+': missing columns '+missing.join(', '));
  const seen=new Set(),groups=new Map();
  return parsed.rows.map((row,i)=>{
   const r={...row};for(const [key,alias]of Object.entries(aliases))r[key]=r[alias];
   if([...C.DIMS,'region_','size_group','barcode','item_name'].some(k=>!r[k]))throw Error(`${FILE} row ${i+2}: scope / region / size / barcode / item is blank`);
   r.region_=C.isCategoryTotal(r.region_)?'Total':r.region_.trim().toUpperCase();
   for(const key of numbers){const blank=r[key]===''||/^null$/i.test(r[key]);const value=blank?null:C.productNumber(r[key],key.includes('%'));if(!blank&&value===null)throw Error(`${FILE} row ${i+2}: invalid number in ${key}`);if(key.includes('rank')&&value!==null&&(!Number.isInteger(value)||value<1))throw Error(`${FILE} row ${i+2}: invalid rank in ${key}`);r[key]=value;}
   const group=JSON.stringify([...C.DIMS.map(k=>r[k]),r.region_,r.size_group]),key=group+'|'+r.barcode;
   if(seen.has(key))throw Error(`${FILE} row ${i+2}: duplicate item in size group`);seen.add(key);
   const signature=JSON.stringify([r.size_group_rank,r.size_group_rank_rev,r['sg_%qty_cont_chg_ytd_to_l3m']]);
   if(groups.has(group)&&groups.get(group)!==signature)throw Error(`${FILE} row ${i+2}: inconsistent size group rank / change`);groups.set(group,signature);
   return r;
  });
 }
 function itemSizeView(rows,region='Total'){
  const groups=new Map();for(const row of rows.filter(r=>r.region_===region)){if(!groups.has(row.size_group))groups.set(row.size_group,[]);groups.get(row.size_group).push(row);}
  const compare=(a,b)=>String(a).localeCompare(String(b),'en',{numeric:true}),rank=(r,k)=>r[k]??Infinity;
  function select(direction){
   const groupRank=direction>0?'size_group_rank':'size_group_rank_rev',itemRank=direction>0?'item_rank_in_sg':'item_rank_in_sg_rev';
   const eligible=[...groups.values()].filter(rs=>rs[0]['sg_%qty_cont_chg_ytd_to_l3m']!==null&&rs[0]['sg_%qty_cont_chg_ytd_to_l3m']*direction>0).sort((a,b)=>rank(a[0],groupRank)-rank(b[0],groupRank)||compare(a[0].size_group,b[0].size_group)).slice(0,3);
   let remaining=15;return eligible.flatMap(rs=>{const items=rs.filter(r=>r['%qty_cont_chg_ytd_to_l3m']!==null&&r['%qty_cont_chg_ytd_to_l3m']*direction>0).sort((a,b)=>rank(a,itemRank)-rank(b,itemRank)||compare(a.barcode,b.barcode)).slice(0,Math.min(10,remaining));remaining-=items.length;return items.length?[{size:rs[0].size_group,items}]:[];});
  }
  return {top:select(1),bottom:select(-1)};
 }
 const api={ITEM_SIZE_FILE:FILE,isItemSizeFileName:name=>/^10_item_size\.csv$/i.test(name),validateItemSize,itemSizeView};Object.assign(C,api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
