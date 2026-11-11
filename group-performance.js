'use strict';
function groupPerformanceRowsForSelection(){return data?C.groupPerformanceRows(C.filtered(data[7]||[],applied)):[];}
function groupContributionCell(value,range){
 const n=C.productNumber(value,true);if(n===null)return '<td></td>';const span=range.max-range.min||1,zero=-range.min/span*100,end=(n-range.min)/span*100,left=Math.min(zero,end),width=Math.abs(end-zero);
 return `<td class="group-contribution ${n<0?'group-negative':''}"><span class="group-data-axis" style="left:${zero}%" aria-hidden="true"></span><span class="group-data-bar" style="left:${left}%;width:${width}%;background:${n<0?'#f4b183':'#c6e0b4'}" aria-hidden="true"></span><span class="group-data-value">${C.groupPerformanceValue(n,'percent')}</span></td>`;
}
function groupPerformanceTable(rows,period){
 rows=C.topGroupPerformanceRows(rows,period);
 const prefix=period.toLowerCase()+'_',columns=C.GROUP_PERFORMANCE_COLUMNS,ranges={};for(const key of ['%sales_growth_cont','%qty_growth_cont']){const values=rows.map(r=>C.productNumber(r[prefix+key],true)).filter(Number.isFinite);ranges[key]={min:Math.min(0,...values),max:Math.max(0,...values)};}
 return `<h3><span>${C.periodLabel(period)}</span></h3><div class="group-performance-content"><table aria-label="${C.periodLabel(period)} Performance by size group"><colgroup><col style="width:19%">${columns.map(()=>'<col style="width:6.230769%">').join('')}</colgroup><thead><tr><th scope="col">Size group</th>${columns.map(([key,label])=>`<th scope="col" class="${key.includes('price')?'group-price':key.includes('qty')?'group-qty':'group-sales'}">${label}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr><td class="group-name" title="${esc(C.sizeGroupName(row.size_group))}">${esc(C.sizeGroupName(row.size_group))}</td>${columns.map(([key,,type])=>ranges[key]?groupContributionCell(row[prefix+key],ranges[key]):`<td class="${key==='%price_per_unit_change'&&row[prefix+key]<0?'group-negative':''}">${C.groupPerformanceValue(row[prefix+key],type)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function renderGroupPerformance(){
 const rows=groupPerformanceRowsForSelection();$('#groupPerformanceBody').innerHTML=rows.length?C.REGION_PERIODS.map(period=>`<article class="group-performance-widget" data-group-performance-widget="${period}">${groupPerformanceTable(rows,period)}</article>`).join(''):empty('ไม่มีข้อมูล Region Total สำหรับ Filter ที่เลือก · โหลด 8_product_group_region.csv');
 fitGroupPerformanceTables();window.ConnextHeadings?.apply();window.ConnextCharts?.sync();
}
function fitGroupPerformanceTables(){
 const panel=$('#groupPerformancePage');if(panel.hidden)return;const cards=[...panel.querySelectorAll('[data-group-performance-widget]')];if(!cards.length)return;
 let font=Math.max(6,Math.min(...cards.map(card=>Math.min(14,card.clientWidth/113,(card.clientHeight-45)/(card.querySelectorAll('tbody tr').length||1)/1.6))));const apply=()=>cards.forEach(card=>card.style.setProperty('--group-table-font',font+'px'));apply();
 for(let pass=0;pass<2;pass++){let factor=1;for(const card of cards){if(Number(getComputedStyle(card).getPropertyValue('--report-font-scale')||1)!==1)continue;const content=card.querySelector('.group-performance-content'),table=card.querySelector('table');if(content.clientHeight>0&&table.offsetHeight>content.clientHeight)factor=Math.min(factor,(content.clientHeight-3)/table.offsetHeight);}if(factor>=1)break;font=Math.max(6,font*factor*.97);apply();}
}
