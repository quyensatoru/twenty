import { type CardPalette } from './card-palette.util';
import { escapeMarkup } from './escape-markup.util';
import { ictDateTimeToMillis } from './moments-date.util';

type BuildSharePageInput = {
  title: string;
  description: string;
  cardSvg: string;
  imageUrl: string | null;
  downloadUrl: string;
  cardRoomUrl: string | null;
  eventDate: string | null;
  wishes: string[];
  palette: CardPalette;
};

// A self-contained page for people outside the CRM: the card, a live
// countdown and the latest wishes. Open Graph tags give link unfurls a title,
// a description and the card as thumbnail.
export const buildSharePage = ({
  title,
  description,
  cardSvg,
  imageUrl,
  downloadUrl,
  cardRoomUrl,
  eventDate,
  wishes,
  palette,
}: BuildSharePageInput): string => {
  const target = eventDate === null ? Number.NaN : ictDateTimeToMillis(eventDate);
  const safeTitle = escapeMarkup(title);
  const safeDescription = escapeMarkup(description);

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="${palette.ground}">
<title>${safeTitle}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
${
  imageUrl === null
    ? ''
    : `<meta property="og:image" content="${escapeMarkup(imageUrl)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="${escapeMarkup(imageUrl)}">`
}
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:Inter,system-ui,sans-serif;background:${palette.ground};color:${palette.ink}}
main{max-width:520px;margin:0 auto;padding:24px 16px 48px;display:flex;flex-direction:column;gap:18px}
.card svg{width:100%;height:auto;display:block;border-radius:16px;box-shadow:0 24px 48px rgba(0,0,0,.3),0 0 0 1px ${palette.line}}
.timer{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.timer div{background:${palette.panel};border-radius:12px;padding:10px 0;text-align:center;box-shadow:inset 0 0 0 1px ${palette.line}}
.timer b{display:block;font-size:26px;font-variant-numeric:tabular-nums}.timer span{font-size:11px;letter-spacing:.08em;color:${palette.mutedInk}}
.actions{display:flex;gap:8px}.actions a{flex:1;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:600;text-decoration:none}
.primary{background:${palette.accent};color:${palette.onAccent}}.room{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:56px;border-radius:12px;background:${palette.ink};color:${palette.ground};text-decoration:none;font-weight:600}.room small{font-weight:400;font-size:12px;opacity:.75}.secondary{background:${palette.panel};color:${palette.ink};box-shadow:inset 0 0 0 1px ${palette.line}}
.wish{background:${palette.panel};border-radius:12px;padding:12px 14px;font-family:'Playfair Display',Georgia,serif;font-style:italic;line-height:1.5;box-shadow:inset 0 0 0 1px ${palette.line}}
h2{font-size:15px;margin:6px 0 0}
</style>
</head>
<body>
<main>
<div class="card">${cardSvg}</div>
<div class="timer" id="timer" aria-live="polite"></div>
${cardRoomUrl === null ? '' : `<a class="room" href="${escapeMarkup(cardRoomUrl)}">Ký thiệp và gửi lời chúc<small>Mở thiệp chung trong CRM</small></a>`}
<div class="actions">
<a class="primary" href="${escapeMarkup(downloadUrl)}" download>Tải thiệp</a>
<a class="secondary" href="#" id="share">Chia sẻ</a>
</div>
${wishes.length > 0 ? `<h2>${wishes.length} lời chúc mới nhất</h2>${wishes.map((wish) => `<div class="wish">${escapeMarkup(wish)}</div>`).join('')}` : ''}
</main>
<script>
(function(){
var target=${Number.isFinite(target) ? target : 'null'};
var timer=document.getElementById('timer');
function pad(n){return n<10?'0'+n:String(n)}
function render(){
if(target===null){timer.style.display='none';return}
var diff=Math.max(0,target-Date.now());
var parts=[[Math.floor(diff/864e5),'NGÀY'],[Math.floor(diff/36e5)%24,'GIỜ'],[Math.floor(diff/6e4)%60,'PHÚT'],[Math.floor(diff/1e3)%60,'GIÂY']];
timer.innerHTML=parts.map(function(p){return '<div><b>'+pad(p[0])+'</b><span>'+p[1]+'</span></div>'}).join('');
}
render();setInterval(render,1000);
document.getElementById('share').addEventListener('click',function(e){
e.preventDefault();
if(navigator.share){navigator.share({title:document.title,url:location.href}).catch(function(){})}
else if(navigator.clipboard){navigator.clipboard.writeText(location.href);e.target.textContent='Đã copy link'}
});
})();
</script>
</body>
</html>`;
};
