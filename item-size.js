'use strict';
function itemSizeRows(){return data?C.filtered(data[9]||[],applied):[];}
function itemSizeTable(groups,label){
 const percent=value=>value===null?'—':(value*100).toFixed(1)+'%';
 const rows=groups.flatMap(group=>group.items.map((row,i)=>'<tr>'+(!i?`<td class="item-size-group" rowspan="${group.items.length}">${esc(C.sizeGroupName(group.size))}</td>`:'')+`<td>${esc(row.brand)}</td><td class="item-barcode">${esc(row.barcode)}</td><td>${esc(row.item_name)}</td><td class="item-number">${percent(row['ytd_%qty_cont'])}</td><td class="item-number">${percent(row['l3m_%qty_cont'])}</td><td class="item-number ${row['%qty_cont_chg_ytd_to_l3m']<0?'negative':'positive'}">${percent(row['%qty_cont_chg_ytd_to_l3m'])}</td></tr>`)).join('');
 return `<h3><span>${label} %QTY contribution chg</span></h3><div class="item-table-content"><table aria-label="${label} item QTY contribution"><colgroup>${[23,12,13,31,7,7,7].map(w=>`<col style="width:${w}%">`).join('')}</colgroup><thead><tr>${['Size group','BRAND','BARCODE','Item','%QTY YTD','%QTY Last 3 months','%QTY CHG'].map(v=>`<th scope="col">${v}</th>`).join('')}</tr></thead><tbody>${rows||'<tr><td colspan="7" class="item-empty">ไม่มีสินค้าที่เข้าเกณฑ์</td></tr>'}</tbody></table></div>`;
}
function renderItemSize(){
 const rows=itemSizeRows(),regions=[...new Set(rows.map(r=>r.region_))].sort((a,b)=>a==='Total'?-1:b==='Total'?1:a.localeCompare(b)),select=$('#itemSizeRegion'),previous=select.dataset.preferredRegion||select.value;
 select.innerHTML=regions.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');select.value=regions.includes(previous)?previous:regions.includes('Total')?'Total':regions[0]||'';
 const view=C.itemSizeView(rows,select.value),body=$('#itemBody');body.innerHTML=['top','bottom'].map(key=>`<article data-item-widget="${key}" class="item-size-widget">${itemSizeTable(view[key],key==='top'?'Top':'Bottom')}</article>`).join('');
 fitItemSizeTables();window.ConnextHeadings?.apply();window.ConnextCharts?.sync();
}
function fitItemSizeTables(){
 const panel=$('#itemsPage');if(panel.hidden)return;const articles=[...panel.querySelectorAll('[data-item-widget]')];if(!articles.length)return;
 let font=Math.max(6,Math.min(...articles.map(article=>{const count=article.querySelectorAll('tbody tr').length;return Math.min(16,article.clientWidth/100,(article.clientHeight-34)/(count+1)/1.45);})));const apply=()=>articles.forEach(article=>article.style.setProperty('--item-fit-font',font+'px'));apply();
 // Measure wrapped names and the two-line column headers before capturing.
 for(let pass=0;pass<2;pass++){let factor=1;for(const article of articles){if(Number(getComputedStyle(article).getPropertyValue('--report-font-scale')||1)!==1)continue;const table=article.querySelector('table'),content=article.querySelector('.item-table-content'),height=content.clientHeight;if(height>0&&table.offsetHeight>height)factor=Math.min(factor,(height-4)/table.offsetHeight);}if(factor>=1)break;font=Math.max(6,font*factor*.97);apply();}

}
$('#itemSizeRegion').onchange=()=>{$('#itemSizeRegion').dataset.preferredRegion=$('#itemSizeRegion').value;renderItemSize();saveLayout();};
