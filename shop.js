// Wallet and purchased upgrades are saved together under a single key.
const shopKey='wcDashProgress5';
const profile={wallet:0,magnet:0,shield:0,double:0,meters:0,first:false,second:false};
try{Object.assign(profile,JSON.parse(localStorage.getItem(shopKey)))}catch{}
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
 {id:'shield',name:'Щит',describe:n=>'После удара защищает '+(1.2+.6*n).toFixed(1)+' с'},
 {id:'boots',name:'Прыгучие ботинки',describe:n=>'Высокий прыжок на '+(7+n*2)+' с'}
];
function saveProfile(){try{localStorage.setItem(shopKey,JSON.stringify(profile))}catch{}}
function showShop(){
 const list=$('upgrades');list.replaceChildren();$('wallet').textContent=profile.wallet+' 💩';
 for(const g of goods){
  const n=profile[g.id],row=document.createElement('section'),title=document.createElement('strong'),desc=document.createElement('p'),buy=document.createElement('button');
  title.textContent=g.name+' · '+n+'/'+tiers.length;desc.textContent=g.describe(n)+(n<tiers.length?' → '+g.describe(n+1):'');
  buy.textContent=n===tiers.length?'Максимум':tiers[n]+' 💩';buy.disabled=n===tiers.length||profile.wallet<tiers[n];
  buy.onclick=()=>{if(profile[g.id]!==n||profile.wallet<tiers[n])return;profile.wallet-=tiers[n];profile[g.id]++;saveProfile();showShop();refreshSummary()};
  row.append(title,desc,buy);list.append(row)
 }
 if(!$('store').open)$('store').showModal()
}
