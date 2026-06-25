import http from "node:http";
import { extname, join, normalize } from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const EMBEDDED_ASSETS = {"/index.html":"<!doctype html>\n<html lang=\"zh-CN\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n  <title>河牌训练室 Online</title>\n  <link rel=\"stylesheet\" href=\"online.css\">\n</head>\n<body>\n  <main>\n    <header><div><small>RIVER ROOM ONLINE</small><h1>河牌训练室</h1></div><div id=\"connection\">未连接</div></header>\n    <section id=\"landing\" class=\"landing\">\n      <article>\n        <h2>创建房间</h2>\n        <label>你的名字<input id=\"hostName\" maxlength=\"12\" value=\"房主\"></label>\n        <div class=\"grid2\"><label>真人上限<input id=\"maxHumans\" type=\"number\" min=\"2\" max=\"6\" value=\"2\"></label><label>AI 数量<input id=\"aiCount\" type=\"number\" min=\"0\" max=\"4\" value=\"4\"></label></div>\n        <button id=\"createBtn\" class=\"gold\">创建房间</button>\n      </article>\n      <article>\n        <h2>加入房间</h2>\n        <label>你的名字<input id=\"joinName\" maxlength=\"12\" value=\"玩家2\"></label>\n        <label>房间码<input id=\"roomCode\" maxlength=\"6\" placeholder=\"例如 A1B2C3\"></label>\n        <button id=\"joinBtn\">加入</button>\n      </article>\n    </section>\n    <section id=\"game\" hidden>\n      <div class=\"roombar\"><span>房间 <b id=\"code\"></b></span><button id=\"copyLink\">复制邀请链接</button><button id=\"startBtn\" class=\"gold\" hidden>开始牌局</button></div>\n      <div class=\"layout\">\n        <div class=\"table\" id=\"table\">\n          <div id=\"seats\"></div>\n          <div class=\"center\"><div>底池 <b id=\"pot\">0</b></div><div class=\"board\" id=\"board\"></div><div id=\"street\">等待开始</div><strong id=\"winner\"></strong></div>\n        </div>\n        <aside>\n          <section class=\"myhand\"><h3>我的底牌</h3><div id=\"myCards\" class=\"cards\"></div></section>\n          <section id=\"actions\">\n            <div id=\"turnText\">等待其他玩家</div>\n            <div class=\"row\"><button id=\"fold\">弃牌</button><button id=\"checkCall\">过牌</button></div>\n            <div class=\"presets\"><button data-p=\".333\">1/3池</button><button data-p=\".5\">1/2池</button><button data-p=\"1\">满池</button><button data-p=\"2\">2倍池</button></div>\n            <label>加注到 <b id=\"raiseAmount\">40</b><input id=\"raise\" type=\"range\" min=\"20\" max=\"2000\" step=\"10\" value=\"40\"></label>\n            <button id=\"raiseBtn\" class=\"blue\">加注</button>\n          </section>\n          <section class=\"logs\"><h3>牌局记录</h3><div id=\"logs\"></div></section>\n        </aside>\n      </div>\n    </section>\n  </main>\n  <script src=\"online.js\"></script>\n</body>\n</html>\n\n","/online.css":":root{color-scheme:dark;font-family:-apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif;background:#090e13;color:#f4f7f8}\n*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0;background:radial-gradient(circle at 30% 0,#17302e,#090e13 48%)}button,input{font:inherit}button{border:1px solid #40505e;border-radius:9px;padding:10px 13px;color:#fff;background:#27333e;font-weight:700;cursor:pointer}button:disabled{opacity:.35;cursor:not-allowed}.gold{color:#261b08;background:linear-gradient(#f7d982,#dca640)}.blue{background:#2f87d5}\nmain{width:min(1400px,calc(100% - 28px));margin:auto;padding:18px 0}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}header small{color:#e8bf61;letter-spacing:.18em}h1{margin:2px 0}#connection{color:#87d9b7}\n.landing{display:grid;grid-template-columns:repeat(2,minmax(280px,430px));gap:20px;justify-content:center;margin-top:8vh}.landing article,aside section{padding:18px;border:1px solid #33414e;border-radius:15px;background:rgba(20,28,35,.92)}label{display:grid;gap:7px;margin:12px 0;color:#aeb9c2;font-size:13px}input{width:100%;padding:11px;border:1px solid #465461;border-radius:8px;color:#fff;background:#111920}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.roombar{display:flex;align-items:center;gap:10px;margin-bottom:14px}.roombar span{margin-right:auto;font-size:18px}.layout{display:grid;grid-template-columns:minmax(760px,1fr)320px;gap:20px}.table{position:relative;width:850px;height:540px;margin:62px auto;border:17px solid #5a3925;border-radius:48%;background:radial-gradient(ellipse,#15835d,#07523c);box-shadow:inset 0 0 0 5px #bf9258,0 20px 55px #0008}\n.seat{position:absolute;width:180px;min-height:92px;padding:10px;border:1px solid #526170;border-radius:14px;background:#17212b;box-shadow:0 5px 15px #0007}.seat.winner{border:3px solid #ffd762;box-shadow:0 0 25px #ffc94f}.seat.active{outline:3px solid #68bfff}.s0{left:55px;top:-62px}.s1{right:55px;top:-62px}.s2{right:-70px;top:220px}.s3{right:70px;bottom:-62px}.s4{left:70px;bottom:-62px}.s5{left:-70px;top:220px}.name{display:flex;justify-content:space-between;font-weight:800}.stack{margin-top:5px;color:#efc76e;font-size:13px}.state{margin-top:5px;color:#aeb8c0;font-size:12px}.dealer{position:absolute;right:-8px;top:-12px;display:grid;place-items:center;width:25px;height:25px;border-radius:50%;color:#111;background:white;font-weight:900}.center{position:absolute;left:50%;top:49%;transform:translate(-50%,-50%);text-align:center}.center>div:first-child{margin-bottom:10px}.center b{font-size:25px}.board,.cards{display:flex;gap:7px;justify-content:center;min-height:76px}.card{position:relative;width:57px;height:79px;padding:6px;border-radius:7px;color:#111;background:#f7f6f1;font-weight:900;box-shadow:0 4px 9px #0007}.card.red{color:#cb3434}.card .r{font-size:22px}.card .s{font-size:24px}.back{background:repeating-linear-gradient(45deg,#3678ae,#3678ae 6px,#174d79 6px,#174d79 12px);border:4px solid white}.center>strong{display:block;margin-top:12px;color:#ffdb71;font-size:18px}\naside{display:grid;gap:12px}.myhand .card{width:64px;height:88px}.row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.presets{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.presets button{padding:7px 2px;font-size:10px}#raise{padding:0}.logs{height:280px;overflow:hidden}.logs>div{height:220px;overflow:auto;color:#aeb8c0;font-size:12px;line-height:1.7}\n@media(max-width:900px){main{width:100%;padding:10px}.landing{grid-template-columns:1fr;margin-top:2vh}.layout{display:block}.table{width:720px;transform:scale(.73);transform-origin:top left;margin-left:calc((100vw - 525px)/2);margin-bottom:-90px}aside{padding:0 10px}.roombar{padding:0 10px}.myhand{position:sticky;top:0;z-index:20}.seat{font-size:12px}}\n","/online.js":"const $=id=>document.getElementById(id);\nlet auth={room:\"\",token:\"\"},state=null,timer=null;\nconst api=async(path,options={})=>{\n  const res=await fetch(path,{...options,headers:{\"content-type\":\"application/json\",...(auth.token?{authorization:`Bearer ${auth.token}`}:{})}});\n  const data=await res.json();if(!res.ok)throw new Error(data.error||\"请求失败\");return data;\n};\nconst save=()=>localStorage.setItem(\"river-online-auth\",JSON.stringify(auth));\nconst load=()=>{try{return JSON.parse(localStorage.getItem(\"river-online-auth\"))}catch{return null}};\nfunction enter(data){auth={room:data.roomCode,token:data.token};save();$(\"landing\").hidden=true;$(\"game\").hidden=false;poll();}\n$(\"createBtn\").onclick=async()=>{try{enter(await api(\"/api/rooms\",{method:\"POST\",body:JSON.stringify({name:$(\"hostName\").value,maxHumans:$(\"maxHumans\").value,aiCount:$(\"aiCount\").value})}))}catch(e){alert(e.message)}};\n$(\"joinBtn\").onclick=async()=>{try{const code=$(\"roomCode\").value.trim().toUpperCase();enter(await api(`/api/rooms/${code}/join`,{method:\"POST\",body:JSON.stringify({name:$(\"joinName\").value})}))}catch(e){alert(e.message)}};\nasync function poll(){clearTimeout(timer);try{state=await api(`/api/rooms/${auth.room}/state`);render();$(\"connection\").textContent=\"已连接\";timer=setTimeout(poll,700)}catch(e){$(\"connection\").textContent=e.message;timer=setTimeout(poll,1800)}}\nfunction render(){\n  $(\"code\").textContent=state.code;$(\"startBtn\").hidden=!state.owner;$(\"startBtn\").textContent=state.status===\"ended\"?\"下一手\":\"开始牌局\";\n  $(\"pot\").textContent=state.pot;$(\"street\").textContent=({idle:\"等待开始\",preflop:\"翻牌前\",flop:\"翻牌\",turn:\"转牌\",river:\"河牌\"})[state.street];\n  $(\"winner\").textContent=state.winnerText;$(\"board\").innerHTML=[0,1,2,3,4].map(i=>state.board[i]?card(state.board[i]):'<div class=\"card back\"></div>').join(\"\");\n  $(\"myCards\").innerHTML=(state.me?.cards||[]).map(card).join(\"\");\n  $(\"seats\").innerHTML=state.players.map(p=>`<div class=\"seat s${p.seat} ${state.actor===p.seat?\"active\":\"\"} ${state.winnerSeats.includes(p.seat)?\"winner\":\"\"}\">\n    ${state.dealer===p.seat?'<i class=\"dealer\">D</i>':\"\"}<div class=\"name\"><span>${p.name}${p.style?` · ${p.style}`:\"\"}</span><span>${p.type===\"ai\"?\"AI\":\"\"}</span></div>\n    <div class=\"stack\">筹码 ${p.stack}　盈亏 ${p.profit>=0?\"+\":\"\"}${p.profit}</div><div class=\"state\">${p.state}${p.totalBet?` · 入池 ${p.totalBet}`:\"\"}</div>\n    ${p.cards?`<div class=\"cards\">${p.cards.map(card).join(\"\")}</div>`:\"\"}</div>`).join(\"\");\n  const mine=state.me,turn=mine&&state.actor===mine.seat&&state.status===\"playing\";\n  const toCall=mine?state.currentBet-mine.bet:0;\n  $(\"turnText\").textContent=turn?`轮到你｜需跟注 ${toCall}`:\"等待其他玩家\";\n  for(const id of[\"fold\",\"checkCall\",\"raise\",\"raiseBtn\"])$(id).disabled=!turn;\n  document.querySelectorAll(\"[data-p]\").forEach(b=>b.disabled=!turn);\n  $(\"checkCall\").textContent=toCall?`跟注 ${toCall}`:\"过牌\";\n  if(turn){const min=state.currentBet?state.currentBet+state.minRaise:20,max=mine.stack+mine.bet;$(\"raise\").min=Math.min(min,max);$(\"raise\").max=max;$(\"raise\").value=Math.min(max,Math.max(min,state.currentBet+state.pot/2));$(\"raiseAmount\").textContent=Math.round($(\"raise\").value/10)*10}\n  $(\"logs\").innerHTML=state.logs.map(x=>`<div>${x.text}</div>`).join(\"\");$(\"logs\").scrollTop=$(\"logs\").scrollHeight;\n}\nfunction card(c){const red=c.suit===\"♥\"||c.suit===\"♦\";const r=({11:\"J\",12:\"Q\",13:\"K\",14:\"A\"})[c.rank]||c.rank;return `<div class=\"card ${red?\"red\":\"\"}\"><div class=\"r\">${r}</div><div class=\"s\">${c.suit}</div></div>`}\n$(\"startBtn\").onclick=async()=>{try{state=await api(`/api/rooms/${auth.room}/start`,{method:\"POST\",body:\"{}\"});render()}catch(e){alert(e.message)}};\nasync function action(type,amount){try{state=await api(`/api/rooms/${auth.room}/action`,{method:\"POST\",body:JSON.stringify({type,amount})});render()}catch(e){alert(e.message)}}\n$(\"fold\").onclick=()=>action(\"fold\");$(\"checkCall\").onclick=()=>action(state.currentBet-state.me.bet?\"call\":\"check\");$(\"raiseBtn\").onclick=()=>action(\"raise\",Number($(\"raise\").value));\n$(\"raise\").oninput=()=>$(\"raiseAmount\").textContent=Math.round(Number($(\"raise\").value)/10)*10;\ndocument.querySelector(\".presets\").onclick=e=>{const b=e.target.closest(\"[data-p]\");if(!b||b.disabled)return;const target=Math.ceil((state.currentBet+state.pot*Number(b.dataset.p))/10)*10;$(\"raise\").value=Math.min(Number($(\"raise\").max),Math.max(Number($(\"raise\").min),target));$(\"raiseAmount\").textContent=$(\"raise\").value};\n$(\"copyLink\").onclick=async()=>{const url=new URL(location.href);url.searchParams.set(\"room\",state.code);await navigator.clipboard.writeText(url);$(\"copyLink\").textContent=\"已复制\"};\nconst qp=new URLSearchParams(location.search).get(\"room\");if(qp)$(\"roomCode\").value=qp.toUpperCase();\nconst old=load();if(old?.room&&old?.token){auth=old;$(\"landing\").hidden=true;$(\"game\").hidden=false;poll()}\n\n"};
const AI_DELAY_MIN = Number(process.env.AI_DELAY_MIN || 550);
const AI_DELAY_MAX = Number(process.env.AI_DELAY_MAX || 1250);
const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const SB = 10, BB = 20, BUY_IN = 2000, UNIT = 10;
const rooms = new Map();
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = [2,3,4,5,6,7,8,9,10,11,12,13,14];
const HAND_NAMES = ["高牌","一对","两对","三条","顺子","同花","葫芦","四条","同花顺"];
const AI_NAMES = ["阿岚","老K","北河","山雀","Mia"];
const AI_STYLES = ["GTO","GTO","松凶","紧凶","GTO"];
const POSITION_NAMES = ["BTN","SB","BB","UTG","HJ","CO"];
const OPEN_CUTOFFS = {UTG:.568,HJ:.460,CO:.383,BTN:.323,SB:.338,BB:0};
const STYLE_TUNING = {
  GTO:{openCutoff:0,threeBet:0,bluff:0,call:0},
  松凶:{openCutoff:-.045,threeBet:.035,bluff:.08,call:.025},
  紧凶:{openCutoff:.045,threeBet:.01,bluff:-.025,call:-.04}
};

const id = (bytes = 12) => randomBytes(bytes).toString("hex");
const roomCode = () => randomBytes(3).toString("hex").toUpperCase();
const nextSeat = s => (s + 1) % 6;
const round10 = n => Math.max(0, Math.round(Number(n) / UNIT) * UNIT);
const ceil10 = n => Math.max(UNIT, Math.ceil(Number(n) / UNIT) * UNIT);
const rankText = r => ({11:"J",12:"Q",13:"K",14:"A"})[r] || String(r);
const cardText = c => `${rankText(c.rank)}${c.suit}`;

function deck() {
  const cards = [];
  for (const suit of SUITS) for (const rank of RANKS) cards.push({rank,suit});
  for (let i=cards.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [cards[i],cards[j]]=[cards[j],cards[i]];
  }
  return cards;
}

function player(name, seat, type, token = null, style = null) {
  return {id:id(5),token,name,seat,type,style,stack:BUY_IN,totalBuyIn:BUY_IN,cards:[],folded:false,bet:0,totalBet:0,acted:false,state:"等待",connected:true};
}

function createRoom(body) {
  let code;
  do code = roomCode(); while (rooms.has(code));
  const token = id();
  const host = player(cleanName(body.name || "房主"), 0, "human", token);
  const room = {
    code, ownerToken:token, maxHumans:clamp(body.maxHumans,2,6,2),
    aiCount:clamp(body.aiCount,0,4,4), players:[host], status:"lobby",
    dealer:5, hand:0, board:[], deck:[], pot:0, currentBet:0,minRaise:BB,
    street:"idle",actor:-1,logs:[],actionHistory:[],winnerSeats:[],winnerText:"",version:1,aiTimer:null
  };
  rooms.set(code, room);
  addLog(room, `${host.name} 创建了房间 ${code}`);
  return {roomCode:code,token,playerId:host.id};
}

function cleanName(value) {
  return String(value).trim().slice(0,12).replace(/[<>]/g,"") || "玩家";
}
function clamp(v,min,max,fallback) {
  const n=Number(v);
  return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):fallback;
}
function occupied(room) { return room.players.filter(Boolean); }
function byToken(room, token) { return occupied(room).find(p=>p.token===token); }
function nextOccupied(room, seat, includeFolded=false) {
  let s=nextSeat(seat);
  for(let i=0;i<6;i++,s=nextSeat(s)){
    const p=room.players[s];
    if(p && (includeFolded || !p.folded)) return s;
  }
  return -1;
}
function active(room){return occupied(room).filter(p=>!p.folded);}
function actors(room){return active(room).filter(p=>p.stack>0);}
function touch(room){room.version++; room.updatedAt=Date.now();}
function addLog(room,text){room.logs.push({hand:room.hand,text,time:Date.now()}); if(room.logs.length>300)room.logs.shift(); touch(room);}

function joinRoom(room, body) {
  if (room.status !== "lobby") throw error(409,"牌局已开始");
  const humans=occupied(room).filter(p=>p.type==="human");
  if(humans.length>=room.maxHumans) throw error(409,"真人座位已满");
  const seat=[0,1,2,3,4,5].find(s=>!room.players[s]);
  const token=id();
  const p=player(cleanName(body.name),seat,"human",token);
  room.players[seat]=p;
  addLog(room,`${p.name} 加入房间`);
  return {roomCode:room.code,token,playerId:p.id};
}

function fillAI(room) {
  let count=occupied(room).filter(p=>p.type==="ai").length;
  for(let i=0;count<room.aiCount&&i<AI_NAMES.length;i++){
    if(occupied(room).some(p=>p.name===AI_NAMES[i])) continue;
    const seat=[0,1,2,3,4,5].find(s=>!room.players[s]);
    if(seat===undefined)break;
    room.players[seat]=player(AI_NAMES[i],seat,"ai",null,AI_STYLES[i]);
    count++;
  }
}

function startHand(room, token) {
  if(token!==room.ownerToken) throw error(403,"仅房主可以开始");
  fillAI(room);
  if(occupied(room).length<2) throw error(409,"至少需要两名玩家");
  clearTimeout(room.aiTimer);
  room.hand++; room.status="playing"; room.deck=deck(); room.board=[];room.pot=0;
  room.currentBet=0;room.minRaise=BB;room.street="preflop";room.actionHistory=[];room.winnerSeats=[];room.winnerText="";
  room.dealer=nextOccupied(room,room.dealer,true);
  for(const p of occupied(room)){
    if(p.type==="ai"&&p.stack<1000){p.totalBuyIn+=BUY_IN-p.stack;p.stack=BUY_IN;}
    p.cards=[room.deck.pop(),room.deck.pop()];p.folded=false;p.bet=0;p.totalBet=0;p.acted=false;p.state="等待行动";
  }
  const headsUp=occupied(room).length===2;
  const sb=headsUp?room.dealer:nextOccupied(room,room.dealer,true);
  const bb=nextOccupied(room,sb,true);
  blind(room,sb,SB,"小盲"); blind(room,bb,BB,"大盲");
  room.currentBet=BB;room.actor=headsUp?room.dealer:nextOccupied(room,bb);
  addLog(room,`第 ${room.hand} 手开始，${room.players[room.dealer].name} 在庄位`);
  scheduleAI(room);
}
function blind(room,seat,amount,label){
  const p=room.players[seat],paid=Math.min(amount,p.stack);
  p.stack-=paid;p.bet+=paid;p.totalBet+=paid;p.state=`${label} ${paid}`;
}

function act(room, token, body) {
  if(room.status!=="playing")throw error(409,"当前不能行动");
  const p=byToken(room,token);
  if(!p||p.seat!==room.actor)throw error(403,"还没轮到你");
  applyAction(room,p,body.type,body.amount);
  afterAction(room,p.seat);
}

function applyAction(room,p,type,amount){
  const toCall=room.currentBet-p.bet;
  if(type==="fold"){
    p.folded=true;p.acted=true;p.state="弃牌";recordRoomAction(room,p,"fold",0,toCall);addLog(room,`${p.name} 弃牌`);return;
  }
  if(type==="check"){
    if(toCall!==0)throw error(400,"当前不能过牌");
    p.acted=true;p.state="过牌";recordRoomAction(room,p,"check",0,0);addLog(room,`${p.name} 过牌`);return;
  }
  if(type==="call"){
    const paid=commit(p,toCall);p.acted=true;p.state=paid<toCall?`全下 ${p.bet}`:`跟注 ${paid}`;
    recordRoomAction(room,p,"call",paid,toCall);addLog(room,`${p.name} ${p.state}`);return;
  }
  if(type==="raise"){
    const old=room.currentBet,max=p.bet+p.stack;
    let target=Math.min(max,round10(amount));
    const min=old===0?BB:old+room.minRaise;
    if(target<min&&target!==max)throw error(400,`最小加注到 ${min}`);
    commit(p,target-p.bet);room.minRaise=Math.max(room.minRaise,target-old);room.currentBet=p.bet;
    for(const q of actors(room))if(q.seat!==p.seat)q.acted=false;
    p.acted=true;p.state=old===0?`下注 ${target}`:`加注到 ${target}`;
    recordRoomAction(room,p,"raise",target,toCall);addLog(room,`${p.name} ${p.state}`);return;
  }
  throw error(400,"未知行动");
}
function commit(p,amount){const paid=Math.min(round10(amount),p.stack);p.stack-=paid;p.bet+=paid;p.totalBet+=paid;return paid;}
function positionOfRoom(room,seat){return POSITION_NAMES[(seat-room.dealer+6)%6];}
function recordRoomAction(room,p,action,amount,toCall){
  room.actionHistory.push({street:room.street,seat:p.seat,action,amount,toCall,position:positionOfRoom(room,p.seat)});
}

function afterAction(room,seat){
  touch(room);
  if(active(room).length===1)return award(room,active(room)[0]);
  if(roundDone(room))return nextStreet(room);
  room.actor=nextOccupied(room,seat);
  scheduleAI(room);
}
function roundDone(room){const list=actors(room);return !list.length||list.every(p=>p.acted&&p.bet===room.currentBet);}
function collect(room){for(const p of occupied(room)){room.pot+=p.bet;p.bet=0;}}
function nextStreet(room){
  collect(room);
  if(active(room).length===1)return award(room,active(room)[0]);
  for(const p of active(room)){p.bet=0;p.acted=false;p.state="等待行动";}
  room.currentBet=0;room.minRaise=BB;
  if(room.street==="preflop"){room.board.push(room.deck.pop(),room.deck.pop(),room.deck.pop());room.street="flop";}
  else if(room.street==="flop"){room.board.push(room.deck.pop());room.street="turn";}
  else if(room.street==="turn"){room.board.push(room.deck.pop());room.street="river";}
  else return showdown(room);
  addLog(room,`${({flop:"翻牌",turn:"转牌",river:"河牌"})[room.street]}：${room.board.map(cardText).join(" ")}`);
  room.actor=nextOccupied(room,room.dealer);touch(room);scheduleAI(room);
}
function award(room,winner){
  collect(room);const won=room.pot;winner.stack+=won;room.pot=0;room.status="ended";
  room.winnerSeats=[winner.seat];room.winnerText=`${winner.name} +${won}（其他玩家弃牌）`;winner.state=`赢得 ${won}`;
  addLog(room,room.winnerText);
}

function showdown(room){
  collect(room);const ranked=active(room).map(p=>({p,hand:evaluate([...p.cards,...room.board])})).sort((a,b)=>compare(b.hand,a.hand));
  const best=ranked[0].hand,winners=ranked.filter(x=>compare(x.hand,best)===0);
  const share=Math.floor(room.pot/winners.length/UNIT)*UNIT;
  let remainder=room.pot-share*winners.length;
  for(const x of winners){const won=share+(remainder>0?UNIT:0);remainder=Math.max(0,remainder-UNIT);x.p.stack+=won;x.p.state=`赢得 ${won}`;}
  room.winnerSeats=winners.map(x=>x.p.seat);
  room.winnerText=`${winners.map(x=>x.p.name).join("、")} 赢得 ${room.pot}（${HAND_NAMES[best.category]}）`;
  room.pot=0;room.status="ended";addLog(room,room.winnerText);
}

function scheduleAI(room){
  clearTimeout(room.aiTimer);
  const p=room.players[room.actor];
  if(room.status!=="playing"||!p||p.type!=="ai")return;
  const delay=AI_DELAY_MIN+Math.random()*Math.max(0,AI_DELAY_MAX-AI_DELAY_MIN);
  room.aiTimer=setTimeout(()=>{if(room.status!=="playing"||room.actor!==p.seat)return;aiAct(room,p);afterAction(room,p.seat);},delay);
}
function aiAct(room,p){
  if(room.street==="preflop")return aiPreflopRoom(room,p);
  const a=analyzeRoomPostflop(room,p),toCall=room.currentBet-p.bet;
  const pot=room.pot+occupied(room).reduce((n,q)=>n+q.bet,0);
  const potOdds=toCall/(pot+toCall||1),roll=Math.random();
  const raises=room.actionHistory.filter(x=>x.street===room.street&&x.action==="raise").length;
  const tuning=STYLE_TUNING[p.style]||STYLE_TUNING.GTO;
  const activeCount=active(room).length;
  const preflopAggressor=[...room.actionHistory].reverse().find(x=>x.street==="preflop"&&x.action==="raise");
  const dry=a.wetness<.35;
  if(toCall===0){
    let betFreq=0;
    if(a.equity>=.72)betFreq=.82;
    else if(a.equity>=.52)betFreq=dry?.62:.48;
    else if(a.flushDraw||a.oesd)betFreq=dry?.58:.68;
    else if(room.street==="flop"&&preflopAggressor?.seat===p.seat)betFreq=dry?.62:.34;
    else if(room.street==="turn"&&(a.gutshot||a.overcards===2))betFreq=.22;
    else if(room.street==="river"&&a.missedDraw&&a.blocker)betFreq=.18+tuning.bluff;
    if(activeCount>2)betFreq*=.64;
    if(roll<betFreq){
      const fraction=a.equity>=.72?(a.wetness>.55?.72:.55):(dry?.33:.58);
      return applyAction(room,p,"raise",ceil10(pot*fraction));
    }
    return applyAction(room,p,"check");
  }
  if(raises>=2)return applyAction(room,p,a.equity>=.82?"call":"fold");
  const continueThreshold=potOdds+(activeCount>2?.09:.035);
  if(a.equity<continueThreshold&&!(a.flushDraw||a.oesd))return applyAction(room,p,"fold");
  let raiseFreq=0;
  if(a.equity>=.82)raiseFreq=.62;
  else if((a.flushDraw||a.oesd)&&a.equity>=.42)raiseFreq=.16+Math.max(0,tuning.bluff);
  else if(room.street==="river"&&a.equity>=.7)raiseFreq=.28;
  if(raises===1)raiseFreq*=.45;
  if(roll<raiseFreq&&p.stack>toCall+room.minRaise){
    return applyAction(room,p,"raise",ceil10(room.currentBet+(pot+toCall)*(a.equity>=.82?.75:.55)));
  }
  return applyAction(room,p,"call");
}

function preflopRankRoom(cards){
  const [hi,lo]=cards.map(c=>c.rank).sort((a,b)=>b-a);
  const pair=hi===lo,suited=cards[0].suit===cards[1].suit,gap=hi-lo;
  let power=(hi-2)/12*.34+(lo-2)/12*.16;
  if(pair)power=.52+(hi-2)/12*.46;
  else{
    if(suited)power+=.07;
    if(hi>=11&&lo>=10)power+=.15;else if(hi>=12&&lo>=8)power+=.07;
    if(gap===1)power+=.065;else if(gap===2)power+=.035;else if(gap>=4)power-=.055;
    if(hi===14)power+=lo>=10?.11:suited&&lo<=5?.055:.025;
  }
  return Math.max(0,Math.min(1,power));
}
function suitedWheelRoom(cards){return cards[0].suit===cards[1].suit&&cards.some(c=>c.rank===14)&&cards.some(c=>c.rank>=2&&c.rank<=5);}
function aiPreflopRoom(room,p){
  const raises=room.actionHistory.filter(x=>x.street==="preflop"&&x.action==="raise").length;
  const callers=room.actionHistory.filter(x=>x.street==="preflop"&&x.action==="call").length;
  const pos=positionOfRoom(room,p.seat),tuning=STYLE_TUNING[p.style]||STYLE_TUNING.GTO;
  const strength=preflopRankRoom(p.cards),roll=Math.random(),toCall=room.currentBet-p.bet;
  const openCutoff=Math.max(.24,Math.min(.66,(OPEN_CUTOFFS[pos]??.46)+tuning.openCutoff));
  if(raises===0){
    if(pos==="BB"&&toCall===0)return applyAction(room,p,"check");
    if(strength>=openCutoff){
      const target=pos==="SB"?BB*3.5:BB*(pos==="UTG"?2.5:2.3);
      return applyAction(room,p,"raise",ceil10(target));
    }
    return applyAction(room,p,"fold");
  }
  const wheel=suitedWheelRoom(p.cards);
  if(raises===1){
    if(strength>=.74||(wheel||strength>=.58)&&roll<(.12+tuning.threeBet)){
      return applyAction(room,p,"raise",ceil10(room.currentBet*(pos==="SB"||pos==="BB"?4.1:3.2)+callers*room.currentBet));
    }
    const callFloor=pos==="BB"?.48:["BTN","CO"].includes(pos)?.54:.59;
    if(strength>=callFloor+tuning.call&&toCall<=p.stack*.12)return applyAction(room,p,"call");
    return applyAction(room,p,"fold");
  }
  if(raises===2){
    if(strength>=.88||wheel&&roll<(.08+Math.max(0,tuning.bluff/2)))return applyAction(room,p,"raise",ceil10(room.currentBet*2.25));
    if(strength>=.76&&toCall<=p.stack*.18)return applyAction(room,p,"call");
    return applyAction(room,p,"fold");
  }
  if(raises===3){
    if(strength>=.94)return applyAction(room,p,"raise",p.bet+p.stack);
    if(strength>=.86&&toCall<=p.stack*.24)return applyAction(room,p,"call");
    return applyAction(room,p,"fold");
  }
  return applyAction(room,p,strength>=.96?"call":"fold");
}
function analyzeRoomPostflop(room,p){
  const all=[...p.cards,...room.board],made=evaluate(all),boardRanks=room.board.map(c=>c.rank),holeRanks=p.cards.map(c=>c.rank);
  const maxBoard=Math.max(...boardRanks),pairRanks=holeRanks.filter(r=>boardRanks.includes(r));
  const pocket=holeRanks[0]===holeRanks[1],overpair=pocket&&holeRanks[0]>maxBoard,topPair=pairRanks.includes(maxBoard);
  const second=Math.max(...boardRanks.filter(r=>r!==maxBoard),0),middlePair=!topPair&&pairRanks.includes(second);
  const suitCounts={};for(const c of all)suitCounts[c.suit]=(suitCounts[c.suit]||0)+1;
  const flushDraw=made.category<5&&Object.values(suitCounts).some(n=>n===4);
  const ranks=[...new Set(all.map(c=>c.rank))].sort((a,b)=>a-b);if(ranks.includes(14))ranks.unshift(1);
  let oesd=false,gutshot=false;
  for(let start=1;start<=10;start++){const hits=[0,1,2,3,4].filter(x=>ranks.includes(start+x));if(hits.length===4){const missing=[0,1,2,3,4].find(x=>!ranks.includes(start+x));if(missing===0||missing===4)oesd=true;else gutshot=true;}}
  const overcards=holeRanks.filter(r=>r>maxBoard).length;
  const boardSuitMax=Math.max(...Object.values(room.board.reduce((m,c)=>(m[c.suit]=(m[c.suit]||0)+1,m),{})));
  const connected=[...new Set(boardRanks)].sort((a,b)=>a-b).some((r,i,a)=>i&&r-a[i-1]<=2);
  const paired=new Set(boardRanks).size<boardRanks.length;
  const wetness=Math.min(1,(boardSuitMax>=2?.28:0)+(boardSuitMax>=3?.24:0)+(connected?.32:0)+(paired?-.08:0)+(room.board.length>=4?.08:0));
  let equity=.08;
  if(made.category>=4)equity=.88;else if(made.category===3)equity=.82;else if(made.category===2)equity=.74;
  else if(overpair)equity=.69;else if(topPair)equity=.59+(Math.max(...holeRanks)-2)/120;else if(made.category===1)equity=middlePair?.43:.34;
  if(flushDraw)equity=Math.max(equity,.43);if(oesd)equity=Math.max(equity,.39);if(gutshot)equity=Math.max(equity,.25);
  if(flushDraw&&(oesd||topPair))equity=Math.max(equity,.58);if(overcards===2&&made.category===0)equity=Math.max(equity,.23);
  const missedDraw=room.street==="river"&&made.category<=1&&(p.cards[0].suit===p.cards[1].suit||Math.abs(holeRanks[0]-holeRanks[1])<=2);
  const blocker=p.cards.some(c=>c.rank===14&&room.board.filter(b=>b.suit===c.suit).length>=3);
  return{made,equity,wetness,flushDraw,oesd,gutshot,overpair,topPair,middlePair,overcards,missedDraw,blocker};
}

function evaluate(cards){
  let best=null;
  for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){
    const h=five([cards[a],cards[b],cards[c],cards[d],cards[e]]);if(!best||compare(h,best)>0)best=h;
  }
  return best;
}
function five(cards){
  const counts={};for(const c of cards)counts[c.rank]=(counts[c.rank]||0)+1;
  const groups=Object.entries(counts).map(([rank,count])=>({rank:+rank,count})).sort((a,b)=>b.count-a.count||b.rank-a.rank);
  const flush=cards.every(c=>c.suit===cards[0].suit);let uniq=[...new Set(cards.map(c=>c.rank))].sort((a,b)=>b-a);
  if(uniq[0]===14)uniq.push(1);let straight=0;for(let i=0;i<=uniq.length-5;i++)if(uniq[i]-uniq[i+4]===4){straight=uniq[i];break;}
  if(flush&&straight)return{category:8,tiebreak:[straight]};if(groups[0].count===4)return{category:7,tiebreak:[groups[0].rank,groups[1].rank]};
  if(groups[0].count===3&&groups[1].count===2)return{category:6,tiebreak:[groups[0].rank,groups[1].rank]};
  if(flush)return{category:5,tiebreak:cards.map(c=>c.rank).sort((a,b)=>b-a)};if(straight)return{category:4,tiebreak:[straight]};
  if(groups[0].count===3)return{category:3,tiebreak:[groups[0].rank,...groups.slice(1).map(g=>g.rank).sort((a,b)=>b-a)]};
  if(groups[0].count===2&&groups[1].count===2)return{category:2,tiebreak:[Math.max(groups[0].rank,groups[1].rank),Math.min(groups[0].rank,groups[1].rank),groups[2].rank]};
  if(groups[0].count===2)return{category:1,tiebreak:[groups[0].rank,...groups.slice(1).map(g=>g.rank).sort((a,b)=>b-a)]};
  return{category:0,tiebreak:cards.map(c=>c.rank).sort((a,b)=>b-a)};
}
function compare(a,b){if(a.category!==b.category)return a.category-b.category;for(let i=0;i<Math.max(a.tiebreak.length,b.tiebreak.length);i++){const d=(a.tiebreak[i]||0)-(b.tiebreak[i]||0);if(d)return d;}return 0;}

function stateFor(room,token){
  const me=byToken(room,token),ended=room.status==="ended";
  return {
    code:room.code,status:room.status,owner:token===room.ownerToken,hand:room.hand,maxHumans:room.maxHumans,aiCount:room.aiCount,
    blinds:[SB,BB],dealer:room.dealer,actor:room.actor,street:room.street,board:room.board,pot:room.pot+occupied(room).reduce((n,p)=>n+p.bet,0),
    currentBet:room.currentBet,minRaise:room.minRaise,winnerSeats:room.winnerSeats,winnerText:room.winnerText,version:room.version,
    me:me?{id:me.id,seat:me.seat,name:me.name,cards:me.cards,stack:me.stack,bet:me.bet,folded:me.folded}:null,
    players:occupied(room).map(p=>({id:p.id,name:p.name,seat:p.seat,type:p.type,style:p.style,stack:p.stack,profit:p.stack-p.totalBuyIn,bet:p.bet,totalBet:p.totalBet,folded:p.folded,state:p.state,
      cards:ended&&!p.folded?p.cards:(me&&p.id===me.id?p.cards:null)})),
    logs:room.logs.slice(-80)
  };
}

function error(status,message){const e=new Error(message);e.status=status;return e;}
async function json(req){let data="";for await(const chunk of req){data+=chunk;if(data.length>1e6)throw error(413,"请求过大");}return data?JSON.parse(data):{};}
function send(res,status,data){res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(JSON.stringify(data));}

async function api(req,res,url){
  const parts=url.pathname.split("/").filter(Boolean);
  try{
    if(req.method==="POST"&&url.pathname==="/api/rooms")return send(res,201,createRoom(await json(req)));
    if(parts[0]==="api"&&parts[1]==="rooms"&&parts[2]){
      const room=rooms.get(parts[2].toUpperCase());if(!room)throw error(404,"房间不存在");
      const action=parts[3],token=req.headers.authorization?.replace(/^Bearer /,"")||url.searchParams.get("token");
      if(req.method==="POST"&&action==="join")return send(res,200,joinRoom(room,await json(req)));
      if(!byToken(room,token))throw error(401,"玩家凭证无效");
      if(req.method==="GET"&&action==="state")return send(res,200,stateFor(room,token));
      if(req.method==="POST"&&action==="start"){startHand(room,token);return send(res,200,stateFor(room,token));}
      if(req.method==="POST"&&action==="action"){act(room,token,await json(req));return send(res,200,stateFor(room,token));}
    }
    throw error(404,"接口不存在");
  }catch(e){send(res,e.status||500,{error:e.message||"服务器错误"});}
}

const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml"};
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||"localhost"}`);
  if(url.pathname.startsWith("/api/"))return api(req,res,url);
  try{
    const assetPath=url.pathname==="/"?"/index.html":url.pathname;
    const body=EMBEDDED_ASSETS[assetPath];
    if(body===undefined)throw new Error();
    res.writeHead(200,{"content-type":types[extname(assetPath)]||"application/octet-stream"});res.end(body);
  }catch{res.writeHead(404);res.end("Not found");}
});
server.listen(PORT,"0.0.0.0",()=>console.log(`River Room Online: http://localhost:${PORT}`));
