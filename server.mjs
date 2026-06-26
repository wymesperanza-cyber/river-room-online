import http from "node:http";
import { extname, join, normalize } from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const EMBEDDED_ASSETS = {"/index.html":"<!doctype html>\n<html lang=\"zh-CN\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n  <title>河牌训练室 Online</title>\n  <link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23070b0f'/%3E%3Cpath d='M32 7C22 20 12 26 12 38c0 8 6 14 14 14 3 0 5-1 7-2-1 5-4 8-8 10h14c-4-2-7-5-8-10 2 1 4 2 7 2 8 0 14-6 14-14C52 26 42 20 32 7z' fill='%23f5f7fb'/%3E%3C/svg%3E\">\n  <link rel=\"stylesheet\" href=\"online.css\">\n</head>\n<body>\n  <main>\n    <header><div><small>RIVER ROOM ONLINE</small><h1>河牌训练室</h1></div><div id=\"connection\">未连接</div></header>\n    <section id=\"landing\" class=\"landing\">\n      <article>\n        <h2>创建房间</h2>\n        <label>你的名字<input id=\"hostName\" maxlength=\"12\" value=\"房主\"></label>\n        <div class=\"grid2\"><label>真人上限<input id=\"maxHumans\" type=\"number\" min=\"2\" max=\"6\" value=\"2\"></label><label>AI 数量<input id=\"aiCount\" type=\"number\" min=\"0\" max=\"4\" value=\"4\"></label></div>\n        <button id=\"createBtn\" class=\"gold\">创建房间</button>\n      </article>\n      <article>\n        <h2>加入房间</h2>\n        <label>你的名字<input id=\"joinName\" maxlength=\"12\" value=\"玩家2\"></label>\n        <label>房间码<input id=\"roomCode\" maxlength=\"6\" placeholder=\"例如 A1B2C3\"></label>\n        <button id=\"joinBtn\">加入</button>\n      </article>\n    </section>\n    <section id=\"game\" hidden>\n      <div id=\"rotateTip\">手机打牌建议横屏，画面会更稳，按钮和玩家信息不遮挡。</div>\n      <div class=\"roombar\"><span>房间 <b id=\"code\"></b></span><button id=\"copyLink\">复制邀请链接</button><button id=\"startBtn\" class=\"gold\" hidden>开始牌局</button></div>\n      <div class=\"layout\">\n        <div class=\"table\" id=\"table\">\n          <div id=\"seats\"></div>\n          <div id=\"contributions\"></div>\n          <div id=\"fxLayer\" aria-hidden=\"true\"></div>\n          <div class=\"center\"><div>底池 <b id=\"pot\">0</b></div><div class=\"board\" id=\"board\"></div><div id=\"street\">等待开始</div><strong id=\"winner\"></strong></div>\n        </div>\n        <aside>\n          <section class=\"myhand\"><h3>我的底牌</h3><div id=\"myCards\" class=\"cards\"></div></section>\n          <section id=\"actions\">\n            <div id=\"turnText\">等待其他玩家</div>\n            <div class=\"row\"><button id=\"fold\">弃牌</button><button id=\"checkCall\">过牌</button></div>\n            <div class=\"presets\"><button data-p=\".333\">1/3池</button><button data-p=\".5\">1/2池</button><button data-p=\"1\">满池</button><button data-p=\"2\">2倍池</button></div>\n            <label>加注到 <b id=\"raiseAmount\">40</b><input id=\"raise\" type=\"range\" min=\"20\" max=\"2000\" step=\"10\" value=\"40\"></label>\n            <button id=\"raiseBtn\" class=\"blue\">加注</button>\n          </section>\n          <section id=\"settlement\" class=\"settlement\" hidden>\n            <div class=\"settlement-head\"><div><small>本手结算</small><h3 id=\"settlementTitle\">牌局结束</h3></div><strong id=\"settlementAmount\"></strong></div>\n            <div id=\"settlementRows\"></div>\n          </section>\n          <section class=\"logs\"><h3>牌局记录</h3><div id=\"logs\"></div></section>\n        </aside>\n      </div>\n    </section>\n  </main>\n  <script src=\"online.js\"></script>\n</body>\n</html>\n","/online.css":":root {\n  color-scheme: dark;\n  font-family: -apple-system, BlinkMacSystemFont, \"PingFang SC\", sans-serif;\n  background: #090e13;\n  color: #f4f7f8;\n  --gold: #f2c861;\n  --green: #5ce0a6;\n  --red: #ff7f78;\n  --panel: rgba(20, 28, 35, .94);\n}\n* { box-sizing: border-box; }\n[hidden] { display: none !important; }\nbody { margin: 0; min-height: 100vh; background: radial-gradient(circle at 30% 0, #17302e, #090e13 48%); overflow-x: hidden; }\nbutton, input { font: inherit; }\nbutton { border: 1px solid #40505e; border-radius: 9px; padding: 10px 13px; color: #fff; background: #27333e; font-weight: 750; cursor: pointer; }\nbutton:disabled { opacity: .35; cursor: not-allowed; }\n.gold { color: #261b08; background: linear-gradient(#f7d982, #dca640); }\n.blue { background: #2f87d5; }\nmain { width: min(1400px, calc(100% - 28px)); margin: auto; padding: 18px 0; }\nheader { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }\nheader small { color: #e8bf61; letter-spacing: .18em; }\nh1 { margin: 2px 0; }\nh3 { margin: 0 0 10px; }\n#connection { color: #87d9b7; }\n.landing { display: grid; grid-template-columns: repeat(2, minmax(280px, 430px)); gap: 20px; justify-content: center; margin-top: 8vh; }\n.landing article, aside section { padding: 18px; border: 1px solid #33414e; border-radius: 15px; background: var(--panel); }\nlabel { display: grid; gap: 7px; margin: 12px 0; color: #aeb9c2; font-size: 13px; }\ninput { width: 100%; padding: 11px; border: 1px solid #465461; border-radius: 8px; color: #fff; background: #111920; }\n.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }\n.roombar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }\n.roombar span { margin-right: auto; font-size: 18px; }\n.layout { display: grid; grid-template-columns: minmax(760px, 1fr) 320px; gap: 20px; }\n.table { position: relative; width: 850px; height: 540px; margin: 62px auto; border: 17px solid #5a3925; border-radius: 48%; background: radial-gradient(ellipse, #15835d, #07523c); box-shadow: inset 0 0 0 5px #bf9258, 0 20px 55px #0008; }\n.seat { position: absolute; z-index: 5; width: 180px; min-height: 92px; padding: 10px; border: 1px solid #526170; border-radius: 14px; background: #17212b; box-shadow: 0 5px 15px #0007; transition: opacity .3s, filter .3s, transform .3s, box-shadow .3s; }\n.seat.folded { opacity: .48; filter: grayscale(.75); }\n.seat.winner { z-index: 8; border: 3px solid #ffd762; animation: winnerGlow .8s ease-in-out infinite alternate; }\n.seat.loser { opacity: .34; filter: grayscale(.7); }\n.seat.active { outline: 3px solid #68bfff; }\n.seat.action-fold { animation: foldSeat .55s ease; }\n.seat.action-call, .seat.action-raise, .seat.action-bet { animation: actionSeat .55s ease; }\n.seat.action-check { animation: checkSeat .45s ease; }\n.s0 { left: 55px; top: -62px; }.s1 { right: 55px; top: -62px; }.s2 { right: -70px; top: 220px; }\n.s3 { right: 70px; bottom: -62px; }.s4 { left: 70px; bottom: -62px; }.s5 { left: -70px; top: 220px; }\n.name { display: flex; justify-content: space-between; gap: 5px; font-weight: 800; }\n.stack { margin-top: 5px; color: #efc76e; font-size: 13px; white-space: nowrap; }\n.state { margin-top: 5px; color: #aeb8c0; font-size: 12px; }\n.dealer { position: absolute; right: -8px; top: -12px; display: grid; place-items: center; width: 25px; height: 25px; border-radius: 50%; color: #111; background: white; font-weight: 900; }\n.winner-badge { position: absolute; top: -25px; left: 10px; padding: 4px 10px; border-radius: 999px; color: #302000; background: linear-gradient(#ffe697, #eebc43); box-shadow: 0 0 18px #ffd45c; font-size: 12px; }\n.center { position: absolute; z-index: 2; left: 50%; top: 49%; transform: translate(-50%, -50%); text-align: center; }\n.center > div:first-child { margin-bottom: 10px; }\n.center b { font-size: 25px; }\n.board, .cards { display: flex; gap: 7px; justify-content: center; min-height: 76px; }\n.card { position: relative; width: 57px; height: 79px; padding: 6px; border-radius: 7px; color: #111; background: #f7f6f1; font-weight: 900; box-shadow: 0 4px 9px #0007; animation: dealCard .28s ease both; }\n.card.red { color: #cb3434; }.card .r { font-size: 22px; }.card .s { font-size: 24px; }\n.back { background: repeating-linear-gradient(45deg, #3678ae, #3678ae 6px, #174d79 6px, #174d79 12px); border: 4px solid white; }\n.center > strong { display: block; max-width: 420px; margin-top: 12px; color: #ffdb71; font-size: 15px; }\n.seat .cards { position: absolute; left: 50%; bottom: -43px; min-height: 0; gap: 3px; transform: translateX(-50%); }\n.seat .card { width: 31px; height: 43px; padding: 3px; border-radius: 5px; }\n.seat .card .r { font-size: 13px; }.seat .card .s { font-size: 14px; }\n.contribution { position: absolute; z-index: 4; display: flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; color: #241703; background: #f4cd6d; box-shadow: 0 3px 10px #0007; font-size: 12px; font-weight: 900; pointer-events: none; }\n.contribution::before { content: \"\"; width: 15px; height: 10px; border-radius: 50%; background: repeating-linear-gradient(90deg, #e84e4e 0 3px, #fff 3px 5px); border: 1px solid #fff; }\n.c0 { left: 220px; top: 80px; }.c1 { right: 220px; top: 80px; }.c2 { right: 145px; top: 255px; }\n.c3 { right: 220px; bottom: 90px; }.c4 { left: 220px; bottom: 90px; }.c5 { left: 145px; top: 255px; }\n#fxLayer { position: absolute; inset: 0; z-index: 7; pointer-events: none; overflow: hidden; border-radius: 45%; }\n.fx-chip, .fx-card { position: absolute; left: var(--x); top: var(--y); animation: flyToPot .62s cubic-bezier(.2,.75,.25,1) forwards; }\n.fx-chip { width: 30px; height: 18px; border-radius: 50%; background: repeating-linear-gradient(90deg, #e64f4f 0 5px, white 5px 7px); border: 2px solid #fff; box-shadow: 0 5px 12px #0008; }\n.fx-card { width: 35px; height: 49px; border: 3px solid #fff; border-radius: 5px; background: repeating-linear-gradient(45deg, #3678ae 0 6px, #174d79 6px 12px); animation-name: tossFold; }\n.fx-win { position: absolute; z-index: 9; left: 50%; top: 45%; transform: translate(-50%, -50%); color: #ffdc72; font-size: 30px; font-weight: 900; text-shadow: 0 0 20px #ffbf36; animation: winBurst 1.15s ease forwards; }\naside { display: grid; align-content: start; gap: 12px; }\n.myhand .card { width: 64px; height: 88px; }\n.row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }\n.presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }\n.presets button { padding: 7px 2px; font-size: 10px; }\n#raise { padding: 0; }\n.logs { height: 280px; overflow: hidden; }\n.logs > div { height: 220px; overflow: auto; color: #aeb8c0; font-size: 12px; line-height: 1.7; }\n.settlement { border-color: #8d7139; box-shadow: 0 0 24px #e8bb4b22; animation: settleIn .45s cubic-bezier(.2,.85,.3,1.12); }\n.settlement-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }\n.settlement-head small { color: #b7c0c6; }.settlement-head h3 { margin: 2px 0 0; color: #ffda75; }\n#settlementAmount { color: var(--green); font-size: 24px; }\n.settle-row { display: grid; grid-template-columns: minmax(80px, 1fr) auto auto; gap: 8px; align-items: center; padding: 8px 0; border-top: 1px solid #34414b; font-size: 12px; }\n.settle-row b { color: #efc76e; }.settle-row .up { color: var(--green); }.settle-row .down { color: var(--red); }\n.settle-row.is-winner { font-weight: 800; }.settle-row.is-winner .settle-name::before { content: \"♛ \"; color: #ffd45c; }\n#rotateTip { display: none; margin: 0 10px 8px; padding: 8px 10px; border: 1px solid #425467; border-radius: 10px; color: #ffd979; background: #18242f; font-size: 12px; }\n@keyframes dealCard { from { opacity: 0; transform: translateY(-14px) rotate(-3deg); } }\n@keyframes foldSeat { 45% { transform: translateX(-7px) rotate(-1deg); opacity: .45; } }\n@keyframes actionSeat { 45% { transform: scale(1.045); box-shadow: 0 0 22px #f1c56b88; } }\n@keyframes checkSeat { 50% { transform: translateY(-4px); } }\n@keyframes winnerGlow { to { transform: translateY(-3px) scale(1.025); box-shadow: 0 0 0 5px #ffd86f44, 0 0 42px #ffc547d9; } }\n@keyframes flyToPot { to { left: 50%; top: 48%; transform: translate(-50%, -50%) rotate(540deg) scale(.75); opacity: .35; } }\n@keyframes tossFold { to { left: 50%; top: 48%; transform: translate(-50%, -50%) rotate(130deg) scale(.65); opacity: .12; } }\n@keyframes winBurst { 0% { opacity: 0; transform: translate(-50%, -50%) scale(.35); } 30% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); } 100% { opacity: 0; transform: translate(-50%, -85%) scale(1); } }\n@keyframes settleIn { from { opacity: 0; transform: translateY(12px) scale(.97); } }\n@media (max-width: 900px) {\n  body { background: linear-gradient(#101a20, #080c10 60%); }\n  main { width: 100%; padding: 7px 0 18px; }\n  header { margin: 0 12px 8px; }\n  header small { font-size: 8px; }\n  h1 { font-size: 19px; line-height: 1.1; }\n  #connection { font-size: 11px; }\n  .landing { grid-template-columns: 1fr; gap: 10px; margin: 12px; }\n  .landing article { padding: 14px; }\n  .roombar { padding: 0 10px; margin-bottom: 6px; gap: 6px; }\n  .roombar span { font-size: 14px; }\n  .roombar button { padding: 7px 9px; font-size: 11px; }\n  .layout { display: flex; flex-direction: column; gap: 8px; }\n  .table {\n    width: calc(100vw - 16px); height: 430px; margin: 38px 8px 30px; border-width: 10px;\n    border-radius: 42%; box-shadow: inset 0 0 0 3px #bf9258, 0 12px 30px #0009;\n  }\n  .seat { width: 112px; min-height: 66px; padding: 7px; border-radius: 10px; font-size: 11px; }\n  .name { font-size: 12px; }.stack { margin-top: 3px; font-size: 9px; }.state { margin-top: 3px; font-size: 9px; }\n  .dealer { width: 20px; height: 20px; top: -10px; font-size: 10px; }\n  .winner-badge { top: -21px; left: 3px; padding: 3px 7px; font-size: 9px; }\n  .s0 { left: 6px; top: -35px; }.s1 { right: 6px; top: -35px; }.s2 { right: -4px; top: 176px; }\n  .s3 { right: 12px; bottom: -33px; }.s4 { left: 12px; bottom: -33px; }.s5 { left: -4px; top: 176px; }\n  .center { top: 47%; width: 86%; }\n  .center > div:first-child { margin-bottom: 6px; font-size: 11px; }.center b { font-size: 20px; }\n  .center > strong { display: none; }\n  .board, .cards { gap: 4px; min-height: 56px; }\n  .card { width: 39px; height: 55px; padding: 4px; border-radius: 5px; }\n  .card .r { font-size: 16px; }.card .s { font-size: 17px; }\n  .back { border-width: 3px; background-size: auto; }\n  #street { font-size: 11px; margin-top: 2px; }\n  .seat .cards { bottom: -31px; gap: 2px; }\n  .seat .card { width: 23px; height: 32px; padding: 2px; }\n  .seat .card .r { font-size: 10px; }.seat .card .s { font-size: 10px; }\n  .contribution { padding: 2px 5px; font-size: 9px; }\n  .contribution::before { width: 11px; height: 7px; }\n  .c0 { left: 125px; top: 56px; }.c1 { right: 125px; top: 56px; }.c2 { right: 72px; top: 205px; }\n  .c3 { right: 126px; bottom: 62px; }.c4 { left: 126px; bottom: 62px; }.c5 { left: 72px; top: 205px; }\n  aside { padding: 0 8px; gap: 8px; }\n  aside section { padding: 11px; border-radius: 12px; }\n  .myhand { position: fixed; z-index: 30; left: 8px; bottom: 8px; width: 112px; padding: 7px !important; box-shadow: 0 8px 24px #000c; }\n  .myhand h3 { margin: 0 0 4px; font-size: 10px; color: #aeb8c0; }\n  .myhand .cards { min-height: 0; justify-content: flex-start; }\n  .myhand .card { width: 42px; height: 58px; }.myhand .card .r { font-size: 17px; }.myhand .card .s { font-size: 18px; }\n  #actions { margin-left: 120px; min-height: 154px; }\n  #turnText { font-size: 12px; }\n  .row { margin: 7px 0; gap: 5px; }\n  #actions button { padding: 8px 5px; font-size: 11px; }\n  .presets { gap: 3px; }.presets button { padding: 6px 1px !important; font-size: 9px !important; }\n  #actions label { margin: 7px 0 5px; gap: 3px; font-size: 10px; }\n  .settlement { margin-left: 0; }\n  .settlement-head { margin-bottom: 5px; }.settlement-head h3 { font-size: 15px; }\n  #settlementAmount { font-size: 19px; }\n  .settle-row { padding: 6px 0; }\n  .logs { height: 160px; margin-bottom: 82px; }\n  .logs h3 { font-size: 13px; }.logs > div { height: 116px; font-size: 10px; line-height: 1.55; }\n}\n@media (max-width: 900px) and (orientation: portrait) {\n  #game #rotateTip { display: block; }\n}\n@media (max-width: 900px) and (orientation: landscape) {\n  body { overflow: hidden; }\n  main { width: 100vw; height: 100vh; padding: 4px 6px; }\n  header { height: 28px; margin: 0 4px 4px; }\n  header small { display: none; }\n  h1 { font-size: 16px; }\n  #connection { font-size: 10px; }\n  #rotateTip { display: none !important; }\n  .roombar { height: 30px; padding: 0 4px; margin: 0; }\n  .roombar span { font-size: 12px; }\n  .roombar button { padding: 5px 7px; font-size: 10px; }\n  .layout {\n    display: grid;\n    grid-template-columns: minmax(0, 1fr) minmax(200px, 32vw);\n    gap: 8px;\n    height: calc(100vh - 66px);\n    align-items: stretch;\n  }\n  .table {\n    width: 100%;\n    height: calc(100vh - 78px);\n    min-height: 286px;\n    max-height: 390px;\n    margin: 16px 0 0;\n    border-width: 9px;\n    border-radius: 46%;\n  }\n  aside { height: calc(100vh - 66px); overflow: hidden; padding: 0; gap: 6px; }\n  aside section { padding: 8px; border-radius: 10px; }\n  .myhand { position: static; width: auto; box-shadow: none; }\n  .myhand h3 { font-size: 11px; }\n  .myhand .card { width: 36px; height: 50px; }\n  .myhand .card .r { font-size: 15px; }.myhand .card .s { font-size: 16px; }\n  #actions { margin-left: 0; min-height: 0; }\n  .logs { height: 78px; margin-bottom: 0; }\n  .logs > div { height: 44px; }\n  .settlement { max-height: 92px; overflow: auto; }\n  .seat { width: 110px; min-height: 58px; padding: 6px; }\n  .stack, .state { font-size: 9px; margin-top: 2px; }\n  .s0 { left: 24px; top: -24px; }.s1 { right: 24px; top: -24px; }.s2 { right: -7px; top: 42%; }\n  .s3 { right: 48px; bottom: -24px; }.s4 { left: 48px; bottom: -24px; }.s5 { left: -7px; top: 42%; }\n  .center b { font-size: 18px; }\n  .board { gap: 4px; }\n  .card { width: 34px; height: 48px; }\n  .card .r { font-size: 14px; }.card .s { font-size: 15px; }\n  .seat .cards { bottom: -24px; }\n  .seat .card { width: 20px; height: 28px; }\n  .c0 { left: 28%; top: 48px; }.c1 { right: 28%; top: 48px; }.c2 { right: 18%; top: 48%; }\n  .c3 { right: 28%; bottom: 48px; }.c4 { left: 28%; bottom: 48px; }.c5 { left: 18%; top: 48%; }\n}\n@media (max-width: 380px) {\n  .table { height: 405px; }\n  .seat { width: 104px; }\n  .card { width: 36px; height: 51px; }\n  .c2, .c5 { top: 190px; }\n}\n","/online.js":"const $=id=>document.getElementById(id);\nlet auth={room:\"\",token:\"\"},state=null,timer=null,lastActionSeq=0,audioContext=null;\nlet raiseDraft=null,raiseTurnKey=\"\";\nconst htmlCache={};\nconst api=async(path,options={})=>{\n  const res=await fetch(path,{...options,headers:{\"content-type\":\"application/json\",...(auth.token?{authorization:`Bearer ${auth.token}`}:{})}});\n  const data=await res.json();\n  if(!res.ok){const err=new Error(data.error||\"请求失败\");err.status=res.status;throw err}\n  return data;\n};\nconst save=()=>localStorage.setItem(\"river-online-auth\",JSON.stringify(auth));\nconst load=()=>{try{return JSON.parse(localStorage.getItem(\"river-online-auth\"))}catch{return null}};\nconst clearSaved=()=>localStorage.removeItem(\"river-online-auth\");\nfunction enter(data){auth={room:data.roomCode,token:data.token};save();$(\"landing\").hidden=true;$(\"game\").hidden=false;poll();}\nfunction showLanding(message=\"未连接\"){\n  clearTimeout(timer);\n  auth={room:\"\",token:\"\"};state=null;raiseDraft=null;raiseTurnKey=\"\";\n  for(const k of Object.keys(htmlCache))delete htmlCache[k];\n  clearSaved();\n  $(\"game\").hidden=true;$(\"landing\").hidden=false;$(\"connection\").textContent=message;\n}\n$(\"createBtn\").onclick=async()=>{unlockAudio();try{enter(await api(\"/api/rooms\",{method:\"POST\",body:JSON.stringify({name:$(\"hostName\").value,maxHumans:$(\"maxHumans\").value,aiCount:$(\"aiCount\").value})}))}catch(e){alert(e.message)}};\n$(\"joinBtn\").onclick=async()=>{unlockAudio();try{const code=$(\"roomCode\").value.trim().toUpperCase();enter(await api(`/api/rooms/${code}/join`,{method:\"POST\",body:JSON.stringify({name:$(\"joinName\").value})}))}catch(e){alert(e.message)}};\nasync function poll(){clearTimeout(timer);try{state=await api(`/api/rooms/${auth.room}/state`);render();$(\"connection\").textContent=\"已连接\";timer=setTimeout(poll,550)}catch(e){if(e.status===404||e.status===401)return showLanding(\"旧房间已失效，请重新创建或加入\");$(\"connection\").textContent=e.message;timer=setTimeout(poll,1800)}}\nfunction render(){\n  $(\"code\").textContent=state.code;$(\"startBtn\").hidden=!state.owner;$(\"startBtn\").textContent=state.status===\"ended\"?\"下一手\":\"开始牌局\";\n  $(\"pot\").textContent=state.pot;$(\"street\").textContent=({idle:\"等待开始\",preflop:\"翻牌前\",flop:\"翻牌\",turn:\"转牌\",river:\"河牌\"})[state.street];\n  $(\"winner\").textContent=state.winnerText;\n  setHTML(\"board\",[0,1,2,3,4].map(i=>state.board[i]?card(state.board[i]):'<div class=\"card back\"></div>').join(\"\"));\n  setHTML(\"myCards\",(state.me?.cards||[]).map(card).join(\"\"));\n  const ended=state.status===\"ended\";\n  setHTML(\"seats\",state.players.map(p=>`<div data-seat=\"${p.seat}\" class=\"seat s${p.seat} ${state.actor===p.seat?\"active\":\"\"} ${p.folded?\"folded\":\"\"} ${state.winnerSeats.includes(p.seat)?\"winner\":ended?\"loser\":\"\"}\">\n    ${state.dealer===p.seat?'<i class=\"dealer\">D</i>':\"\"}\n    ${state.winnerSeats.includes(p.seat)?`<span class=\"winner-badge\">♛ 赢家 +${state.winAmounts?.[p.seat]||0}</span>`:\"\"}\n    <div class=\"name\"><span>${p.name}${p.style?` · ${p.style}`:\"\"}</span><span>${p.type===\"ai\"?\"AI\":\"\"}</span></div>\n    <div class=\"stack\">筹码 ${p.stack}　盈亏 ${signed(p.profit)}</div><div class=\"state\">${p.state}</div>\n    ${p.cards?`<div class=\"cards\">${p.cards.map(card).join(\"\")}</div>`:\"\"}</div>`).join(\"\"));\n  setHTML(\"contributions\",state.players.filter(p=>p.totalBet>0).map(p=>`<div class=\"contribution c${p.seat}\">${p.totalBet}</div>`).join(\"\"));\n  renderSettlement();\n  playLatestAction();\n  const mine=state.me,turn=mine&&state.actor===mine.seat&&state.status===\"playing\";\n  const toCall=mine?state.currentBet-mine.bet:0;\n  $(\"turnText\").textContent=turn?`轮到你｜需跟注 ${toCall}`:\"等待其他玩家\";\n  for(const id of[\"fold\",\"checkCall\",\"raise\",\"raiseBtn\"])$(id).disabled=!turn;\n  document.querySelectorAll(\"[data-p]\").forEach(b=>b.disabled=!turn);\n  $(\"checkCall\").textContent=toCall?`跟注 ${toCall}`:\"过牌\";\n  if(turn){\n    const min=Math.min(state.currentBet?state.currentBet+state.minRaise:20,mine.stack+mine.bet),max=mine.stack+mine.bet;\n    const turnKey=`${state.hand}:${state.street}:${state.actor}:${state.currentBet}:${mine.bet}:${min}:${max}`;\n    $(\"raise\").min=min;$(\"raise\").max=max;\n    if(raiseTurnKey!==turnKey||raiseDraft===null){\n      raiseTurnKey=turnKey;\n      raiseDraft=clampRaise(state.currentBet+state.pot/2,min,max);\n    }else raiseDraft=clampRaise(raiseDraft,min,max);\n    setRaiseDraft(raiseDraft);\n  }else{\n    raiseDraft=null;\n    raiseTurnKey=\"\";\n  }\n  setHTML(\"logs\",state.logs.map(x=>`<div>${x.text}</div>`).join(\"\"));$(\"logs\").scrollTop=$(\"logs\").scrollHeight;\n}\nfunction renderSettlement(){\n  const ended=state.status===\"ended\";\n  $(\"settlement\").hidden=!ended;\n  if(!ended)return;\n  $(\"settlementTitle\").textContent=state.winnerText||\"本手结束\";\n  const total=Object.values(state.winAmounts||{}).reduce((a,b)=>a+b,0);\n  $(\"settlementAmount\").textContent=total?`+${total}`:\"\";\n  $(\"settlementRows\").innerHTML=[...state.players].sort((a,b)=>b.stack-a.stack).map(p=>`\n    <div class=\"settle-row ${state.winnerSeats.includes(p.seat)?\"is-winner\":\"\"}\">\n      <span class=\"settle-name\">${p.name}</span><b>筹码 ${p.stack}</b>\n      <span class=\"${p.profit>=0?\"up\":\"down\"}\">盈亏 ${signed(p.profit)}</span>\n    </div>`).join(\"\");\n}\nfunction playLatestAction(){\n  const a=state.lastAction;\n  if(!a||a.seq===lastActionSeq)return;\n  lastActionSeq=a.seq;\n  const seat=document.querySelector(`[data-seat=\"${a.seat}\"]`);\n  if(seat){seat.classList.add(`action-${a.type}`);setTimeout(()=>seat.classList.remove(`action-${a.type}`),650)}\n  if([\"call\",\"raise\",\"bet\"].includes(a.type))spawnFx(a.seat,\"chip\");\n  if(a.type===\"fold\")spawnFx(a.seat,\"card\");\n  if(a.type===\"win\"){\n    const fx=document.createElement(\"div\");fx.className=\"fx-win\";fx.textContent=`赢得 +${a.amount}`;$(\"fxLayer\").append(fx);setTimeout(()=>fx.remove(),1200);\n  }\n  playSound(a.type);\n}\nfunction spawnFx(seat,type){\n  const positions={0:[24,5],1:[72,5],2:[91,48],3:[72,89],4:[25,89],5:[4,48]};\n  const [x,y]=positions[seat]||[50,50],el=document.createElement(\"i\");\n  el.className=type===\"card\"?\"fx-card\":\"fx-chip\";el.style.setProperty(\"--x\",`${x}%`);el.style.setProperty(\"--y\",`${y}%`);\n  $(\"fxLayer\").append(el);setTimeout(()=>el.remove(),700);\n}\nfunction unlockAudio(){if(!audioContext)audioContext=new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state===\"suspended\")audioContext.resume()}\nfunction playSound(type){\n  if(!audioContext)return;\n  const o=audioContext.createOscillator(),g=audioContext.createGain(),now=audioContext.currentTime;\n  const f={fold:160,check:260,call:410,bet:520,raise:640,win:820}[type]||300;\n  o.type=type===\"fold\"?\"sine\":\"triangle\";o.frequency.setValueAtTime(f,now);\n  if(type===\"win\")o.frequency.exponentialRampToValueAtTime(1250,now+.22);\n  g.gain.setValueAtTime(.05,now);g.gain.exponentialRampToValueAtTime(.001,now+(type===\"win\"?.35:.14));\n  o.connect(g).connect(audioContext.destination);o.start(now);o.stop(now+(type===\"win\"?.36:.15));\n}\nfunction signed(n){return `${n>=0?\"+\":\"\"}${n}`}\nfunction setHTML(id,html){\n  if(htmlCache[id]===html)return;\n  htmlCache[id]=html;\n  $(id).innerHTML=html;\n}\nfunction clampRaise(value,min=Number($(\"raise\").min),max=Number($(\"raise\").max)){\n  return Math.min(max,Math.max(min,Math.round(Number(value)/10)*10));\n}\nfunction setRaiseDraft(value){\n  raiseDraft=clampRaise(value);\n  $(\"raise\").value=raiseDraft;\n  $(\"raiseAmount\").textContent=raiseDraft;\n  $(\"raiseBtn\").textContent=state?.currentBet===0?`下注 ${raiseDraft}`:`加注到 ${raiseDraft}`;\n}\nfunction card(c){const red=c.suit===\"♥\"||c.suit===\"♦\";const r=({11:\"J\",12:\"Q\",13:\"K\",14:\"A\"})[c.rank]||c.rank;return `<div class=\"card ${red?\"red\":\"\"}\"><div class=\"r\">${r}</div><div class=\"s\">${c.suit}</div></div>`}\n$(\"startBtn\").onclick=async()=>{unlockAudio();try{state=await api(`/api/rooms/${auth.room}/start`,{method:\"POST\",body:\"{}\"});render()}catch(e){alert(e.message)}};\nasync function action(type,amount){unlockAudio();try{state=await api(`/api/rooms/${auth.room}/action`,{method:\"POST\",body:JSON.stringify({type,amount})});render()}catch(e){alert(e.message)}}\n$(\"fold\").onclick=()=>action(\"fold\");$(\"checkCall\").onclick=()=>action(state.currentBet-state.me.bet?\"call\":\"check\");$(\"raiseBtn\").onclick=()=>action(\"raise\",raiseDraft??Number($(\"raise\").value));\n$(\"raise\").oninput=()=>setRaiseDraft(Number($(\"raise\").value));\ndocument.querySelector(\".presets\").onclick=e=>{\n  const b=e.target.closest(\"[data-p]\");if(!b||b.disabled)return;\n  const target=state.currentBet+state.pot*Number(b.dataset.p);\n  setRaiseDraft(target);\n};\n$(\"copyLink\").onclick=async()=>{const url=new URL(location.href);url.searchParams.set(\"room\",state.code);await navigator.clipboard.writeText(url);$(\"copyLink\").textContent=\"已复制\"};\nconst qp=new URLSearchParams(location.search).get(\"room\");if(qp)$(\"roomCode\").value=qp.toUpperCase();\nif(!qp)clearSaved();\n"};
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
    street:"idle",actor:-1,logs:[],actionHistory:[],winnerSeats:[],winnerText:"",
    winAmounts:{},lastAction:null,actionSeq:0,version:1,aiTimer:null
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
  room.winAmounts={};room.lastAction=null;
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
    p.folded=true;p.acted=true;p.state="弃牌";recordRoomAction(room,p,"fold",0,toCall);setLastAction(room,p,"fold",0);addLog(room,`${p.name} 弃牌`);return;
  }
  if(type==="check"){
    if(toCall!==0)throw error(400,"当前不能过牌");
    p.acted=true;p.state="过牌";recordRoomAction(room,p,"check",0,0);setLastAction(room,p,"check",0);addLog(room,`${p.name} 过牌`);return;
  }
  if(type==="call"){
    const paid=commit(p,toCall);p.acted=true;p.state=paid<toCall?`全下 ${p.bet}`:`跟注 ${paid}`;
    recordRoomAction(room,p,"call",paid,toCall);setLastAction(room,p,"call",paid);addLog(room,`${p.name} ${p.state}`);return;
  }
  if(type==="raise"){
    const old=room.currentBet,max=p.bet+p.stack;
    let target=Math.min(max,round10(amount));
    const min=old===0?BB:old+room.minRaise;
    if(target<min&&target!==max)throw error(400,`最小加注到 ${min}`);
    commit(p,target-p.bet);room.minRaise=Math.max(room.minRaise,target-old);room.currentBet=p.bet;
    for(const q of actors(room))if(q.seat!==p.seat)q.acted=false;
    p.acted=true;p.state=old===0?`下注 ${target}`:`加注到 ${target}`;
    recordRoomAction(room,p,"raise",target,toCall);setLastAction(room,p,old===0?"bet":"raise",target);addLog(room,`${p.name} ${p.state}`);return;
  }
  throw error(400,"未知行动");
}
function setLastAction(room,p,type,amount){
  room.lastAction={seq:++room.actionSeq,seat:p.seat,type,amount,at:Date.now()};
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
  room.winnerSeats=[winner.seat];room.winAmounts={[winner.seat]:won};room.winnerText=`${winner.name} +${won}（其他玩家弃牌）`;winner.state=`赢得 ${won}`;
  room.lastAction={seq:++room.actionSeq,seat:winner.seat,type:"win",amount:won,at:Date.now()};
  addLog(room,room.winnerText);
}

function showdown(room){
  collect(room);const ranked=active(room).map(p=>({p,hand:evaluate([...p.cards,...room.board])})).sort((a,b)=>compare(b.hand,a.hand));
  const best=ranked[0].hand,winners=ranked.filter(x=>compare(x.hand,best)===0);
  const share=Math.floor(room.pot/winners.length/UNIT)*UNIT;
  let remainder=room.pot-share*winners.length;
  room.winAmounts={};
  for(const x of winners){const won=share+(remainder>0?UNIT:0);remainder=Math.max(0,remainder-UNIT);x.p.stack+=won;x.p.state=`赢得 ${won}`;room.winAmounts[x.p.seat]=won;}
  room.winnerSeats=winners.map(x=>x.p.seat);
  room.winnerText=`${winners.map(x=>x.p.name).join("、")} 赢得 ${room.pot}（${HAND_NAMES[best.category]}）`;
  room.pot=0;room.status="ended";room.lastAction={seq:++room.actionSeq,seat:winners[0].p.seat,type:"win",amount:Object.values(room.winAmounts).reduce((a,b)=>a+b,0),at:Date.now()};addLog(room,room.winnerText);
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
    currentBet:room.currentBet,minRaise:room.minRaise,winnerSeats:room.winnerSeats,winnerText:room.winnerText,winAmounts:room.winAmounts,lastAction:room.lastAction,version:room.version,
    me:me?{id:me.id,seat:me.seat,name:me.name,cards:me.cards,stack:me.stack,bet:me.bet,folded:me.folded}:null,
    players:occupied(room).map(p=>({id:p.id,name:p.name,seat:p.seat,type:p.type,style:p.style,stack:p.stack,profit:p.stack-p.totalBuyIn,bet:p.bet,totalBet:p.totalBet,folded:p.folded,state:p.state,
      cards:ended?p.cards:(me&&p.id===me.id?p.cards:null)})),
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
