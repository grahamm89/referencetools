/* Helpers */
const $=s=>document.querySelector(s);
const parseInts=s=>[...s.matchAll(/\d+/g)].map(n=>+n);
const setHidden=(el,h)=>h?el.setAttribute('hidden',''):el.removeAttribute('hidden');

/* Elements */
const filterInput=$('#filterInput');
const selectEl=$('#productSelect');
const tableEl=$('#resultTable');
const headRow=$('#headRow');
const dropRow=$('#dropRow');
const warningEl=$('#chlorinatedWarning');
const step2El=$('#chlorineStep');
const instrEl=$('#instructions');
const dropsLabel=$('#dropsLabel');
const dropsInput=$('#dropsInput');
const resetBtn=$('#resetBtn');
const copyBtn=$('#copyBtn');
const printBtn=$('#printBtn');

/* State */
let products=[], conc=[];

/* Load JSON & bootstrap */
(async()=>{
  const data=await fetch('detergents.json').then(r=>r.json());
  conc=data.concentrations;
  products=data.products;
  buildTable();
  populate(products);
  restoreLast();
  registerEvents();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
})();

/* Build dynamic header once */
function buildTable(){
  headRow.innerHTML='<th>Concentration</th>'+conc.map(c=>`<th>${c} g/L</th>`).join('');
  dropRow.innerHTML='<td>Drops</td>'+conc.map((_,i)=>`<td id="c${i}"></td>`).join('');
}

/* Select list */
function populate(list){
  selectEl.innerHTML='';
  list.forEach(({name,chlorinated})=>{
    const o=new Option(name,name);
    o.dataset.chlorinated=chlorinated;
    selectEl.add(o);
  });
}

function restoreLast(){
  const last=localStorage.getItem('detergent');
  if(last){selectEl.value=last;selectEl.dispatchEvent(new Event('change'));}
}

/* Event handlers */
function registerEvents(){

  filterInput.addEventListener('input',()=>{
    const t=filterInput.value.trim().toLowerCase();
    populate(products.filter(p=>p.name.toLowerCase().includes(t)));
  });

  selectEl.addEventListener('change',e=>{
    const prod=products.find(p=>p.name===e.target.value);
    if(!prod)return;

    prod.drops.forEach((v,i)=>{
      const cell=$(`#c${i}`);
      if(!v){cell.textContent='–';return;}
      if(/\(/.test(v)){const[m,a]=v.split(/[()]/);
        cell.innerHTML=`${m}<abbr title="Drops counted with Acid 3" aria-label="Acid three">${a}</abbr>`;}
      else cell.textContent=v;
    });

    tableEl.classList.add('fade-in'); setTimeout(()=>tableEl.classList.remove('fade-in'),400);
    [tableEl,instrEl,dropsInput,dropsLabel,resetBtn,copyBtn,printBtn].forEach(el=>setHidden(el,false));

    const isChlor=e.target.selectedOptions[0].dataset.chlorinated==='true';
    setHidden(warningEl,!isChlor); setHidden(step2El,!isChlor);

    localStorage.setItem('detergent',prod.name);
    clearHighlights();
  });

  dropsInput.addEventListener('input',highlight);
  dropsInput.addEventListener('blur',clearHighlights);
  resetBtn.addEventListener('click',()=>{dropsInput.value='';clearHighlights();dropsInput.focus();});

  copyBtn.addEventListener('click',()=>{
    const vals=[...tableEl.querySelectorAll('#dropRow td')].slice(1).map(td=>td.innerText).join('\t');
    navigator.clipboard.writeText(selectEl.value+'\t'+vals);
    copyBtn.textContent='Copied!'; setTimeout(()=>copyBtn.textContent='Copy results to clipboard',1500);
  });

  printBtn.addEventListener('click',()=>window.print());
}

/* Reverse-lookup */
function highlight(){
  clearHighlights();
  const v=+dropsInput.value;
  if(!v)return;
  [...tableEl.querySelectorAll('#dropRow td:not(:first-child)')].forEach(td=>{
    if(parseInts(td.textContent).includes(v))td.classList.add('selected');
  });
}
function clearHighlights(){
  [...tableEl.querySelectorAll('.selected')].forEach(td=>td.classList.remove('selected'));
}
