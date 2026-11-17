// Wallet and purchased upgrades are saved together under a single key.
const shopKey='wcDashProgress5';
const profile={wallet:0,magnet:0,shield:0,double:0,meters:0,first:false,second:false,cats:0,cat:0,keys:0,skins:[0],skin:0};
try{Object.assign(profile,JSON.parse(localStorage.getItem(shopKey)))}catch{}
profile.completedLevels=Array.isArray(profile.completedLevels)?profile.completedLevels.filter(n=>Number.isInteger(n)&&n>=0&&n<5):[...(profile.first?[0]:[]),...(profile.second?[1]:[])];
// Cosmetics use a separate key wallet; existing coin purchases keep their save key.
const skinCatalog=[
 {id:0,name:'Денис',cost:0,jacket:'ec7440',trim:'f58d51',hat:'216660',hatTop:'369486',pants:'324356',accent:'f3bc69',kind:'classic'},
 {id:1,name:'Курьер',cost:3,jacket:'e8b83f',trim:'f8d667',hat:'e4b03e',hatTop:'f8cf5c',pants:'344b58',accent:'344b58',kind:'courier'},
 {id:2,name:'Космонавт',cost:5,jacket:'e9e6d9',trim:'fff5df',hat:'d9e3dd',hatTop:'f7f3dc',pants:'becbd0',accent:'df6939',kind:'space'},
 {id:3,name:'Ниндзя',cost:7,jacket:'303745',trim:'414b58',hat:'292e39',hatTop:'39414c',pants:'272d38',accent:'d76556',kind:'ninja'},
 {id:4,name:'Пожарный',cost:9,jacket:'a84635',trim:'c75b3e',hat:'c14732',hatTop:'ed6945',pants:'35434a',accent:'edcf6e',kind:'fire'},
 {id:5,name:'Полярник',cost:12,jacket:'639fae',trim:'a1d4d3',hat:'d7e8d5',hatTop:'f0edcf',pants:'3c596c',accent:'f6e7b7',kind:'polar'},
 {id:6,name:'Панк',cost:15,jacket:'654965',trim:'977284',hat:'40364b',hatTop:'60495f',pants:'32343e',accent:'e791b5',kind:'punk'},
 {id:7,name:'Шеф',cost:18,jacket:'e8e5d5',trim:'fff4dd',hat:'e6e7d5',hatTop:'fff8e1',pants:'414650',accent:'c94d3c',kind:'chef'},
 {id:8,name:'Кибер',cost:22,jacket:'345665',trim:'48798a',hat:'294956',hatTop:'426e7d',pants:'2b3b50',accent:'6ce4c7',kind:'cyber'},
 {id:9,name:'Пират',cost:26,jacket:'405e78',trim:'628298',hat:'353b46',hatTop:'494853',pants:'483e48',accent:'e1b96f',kind:'pirate'},
 {id:10,name:'Король WC',cost:30,jacket:'765479',trim:'a77a97',hat:'d6ac4e',hatTop:'f2ce6d',pants:'493c5a',accent:'f4dc88',kind:'royal'}
];
profile.keys=Math.max(0,Math.floor(Number(profile.keys)||0));
profile.skins=Array.isArray(profile.skins)?[...new Set([0,...profile.skins.filter(id=>Number.isInteger(id)&&id>=0&&id<skinCatalog.length)])]:[0];
if(!profile.skins.includes(profile.skin))profile.skin=0;
const currentSkin=()=>skinCatalog[profile.skin]||skinCatalog[0];
// Transfer previously bought multiplier tiers to the replacement equipment once.
if(profile.boots===undefined){profile.boots=profile.double||0;saveProfile()}
const tiers=[55,95,140,205,280];
function nextUpgrade(){
 const options=goods.filter(g=>profile[g.id]<tiers.length).sort((a,b)=>tiers[profile[a.id]]-tiers[profile[b.id]]);
 if(!options.length)return 'Все улучшения куплены';
 const g=options[0],price=tiers[profile[g.id]];
 return g.name+' · '+price+' 💩'+(price<=profile.wallet?' · доступно':' · осталось '+(price-profile.wallet))
}
const goods=[
 {id:'magnet',name:'Магнит',describe:n=>'Притягивает монеты '+(6+2*n)+' с'},
 {id:'cat',name:'Кот Дениса',describe:n=>'Длительность '+(30+5*n)+' с'},
 {id:'boots',name:'Прыгучие ботинки',describe:n=>'Высокий прыжок на '+(7+n*2)+' с'}
];
function saveProfile(){try{localStorage.setItem(shopKey,JSON.stringify(profile))}catch{}}
let shopTab='gear';
function showShop(tab=shopTab){
 shopTab=tab==='skins'?'skins':'gear';
 $('upgrades').hidden=shopTab!=='gear';$('wardrobe').hidden=shopTab!=='skins';
 document.querySelectorAll('[data-store-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.storeTab===shopTab)));
 $('menuCats').textContent=profile.cats;$('skinBalance').textContent=profile.keys;const list=$('upgrades');list.replaceChildren();$('wallet').textContent=shopTab==='skins'?profile.keys+' 🔑':profile.wallet+' 💩';
 const catRow=document.createElement('section');
 const catTitle=document.createElement('strong'),catDesc=document.createElement('p'),catBuy=document.createElement('button');
 catTitle.textContent='Кот Дениса · '+profile.cats+' шт.';catDesc.textContent='Пушистый скейт на '+(30+5*profile.cat)+' с. Спасает от одного удара. Вызов: кнопка кота, C или двойной тап';
 catBuy.textContent='Купить кота · 200 💩';catBuy.disabled=profile.wallet<200;
 catBuy.onclick=()=>{if(profile.wallet<200)return;profile.wallet-=200;profile.cats++;saveProfile();showShop();refreshSummary()};
 catRow.append(catTitle,catDesc,catBuy);list.append(catRow);
 for(const g of goods){
  const n=profile[g.id],row=document.createElement('section'),title=document.createElement('strong'),desc=document.createElement('p'),buy=document.createElement('button');
  title.textContent=g.name+' · '+n+'/'+tiers.length;desc.textContent=g.describe(n)+(n<tiers.length?' → '+g.describe(n+1):'');
  buy.textContent=n===tiers.length?'Максимум':tiers[n]+' 💩';buy.disabled=n===tiers.length||profile.wallet<tiers[n];
  buy.onclick=()=>{if(profile[g.id]!==n||profile.wallet<tiers[n])return;profile.wallet-=tiers[n];profile[g.id]++;saveProfile();showShop();refreshSummary()};
  row.append(title,desc,buy);list.append(row)
 }
 renderSkins();if(!$('store').open)$('store').showModal()
}

function renderSkins(){
 const list=$('wardrobe');list.replaceChildren();
 const balance=document.createElement('p');balance.className='skinIntro';balance.textContent='Синие ключи: '+profile.keys+' · собирай на трассе, открывай образы.';list.append(balance);
 const grid=document.createElement('div');grid.className='skinGrid';list.append(grid);
 for(const skin of skinCatalog){
  const owned=profile.skins.includes(skin.id),selected=profile.skin===skin.id,row=document.createElement('section');
  row.className='skinCard';row.dataset.skin=skin.id;row.dataset.selected=String(selected);
  const preview=document.createElement('div');preview.className='skinPreview '+skin.kind;preview.setAttribute('aria-hidden','true');
  preview.style.setProperty('--coat','#'+skin.jacket);preview.style.setProperty('--cap','#'+skin.hatTop);preview.style.setProperty('--accent','#'+skin.accent);
  for(const cls of ['skinHead','skinHat','skinTorso','skinLegs']){const part=document.createElement('i');part.className=cls;preview.append(part)}
  const title=document.createElement('strong');title.textContent=skin.name;
  const button=document.createElement('button');button.textContent=selected?'Надето':owned?'Надеть':'Открыть · '+skin.cost+' 🔑';
  button.disabled=selected||(!owned&&profile.keys<skin.cost);button.setAttribute('aria-label',skin.name+' · '+button.textContent);
  button.onclick=()=>{
   if(!profile.skins.includes(skin.id)){
    if(profile.keys<skin.cost)return;
    profile.keys-=skin.cost;profile.skins.push(skin.id)
   }
   profile.skin=skin.id;saveProfile();showShop('skins');status()
  };
  row.append(preview,title,button);grid.append(row)
 }
}
