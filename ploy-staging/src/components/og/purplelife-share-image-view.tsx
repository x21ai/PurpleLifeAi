import { TrendConstellation } from "@/components/pages/pilot/components/mobile-graphics";

const styles = `
  .og-canvas{position:relative;width:1200px;height:630px;overflow:hidden;box-sizing:border-box;padding:32px;color:var(--purplelife-ink);background:radial-gradient(circle at 4% 2%,color-mix(in oklab,var(--purplelife-pink) 18%,transparent) 0,transparent 26%),radial-gradient(circle at 92% 94%,color-mix(in oklab,var(--purplelife-blue) 16%,transparent) 0,transparent 28%),var(--purplelife-canvas);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  .og-panel{position:relative;z-index:2;display:grid;grid-template-columns:1.08fr .92fr;width:100%;height:100%;overflow:hidden;border:1px solid color-mix(in oklab,var(--purplelife-line) 86%,white);border-radius:28px;background:color-mix(in oklab,white 94%,var(--purplelife-tint));box-shadow:0 28px 70px rgb(64 45 92 / .12)}
  .og-copy{display:flex;flex-direction:column;justify-content:space-between;padding:54px 38px 52px 58px}.og-wordmark{display:flex;align-items:center;gap:14px;font-size:23px;font-weight:650;letter-spacing:-.035em}
  .og-mark{position:relative;display:grid;width:42px;height:42px;place-items:center;border:1px solid color-mix(in oklab,var(--purplelife-line) 72%,white);border-radius:14px;background:white;box-shadow:0 8px 22px rgb(80 57 120 / .11)}
  .og-mark span{position:absolute;display:block;border-radius:999px}.og-mark span:nth-child(1){width:24px;height:24px;border:5px solid var(--purplelife-pink);opacity:.48}.og-mark span:nth-child(2){width:15px;height:15px;border:4px solid var(--purplelife-blue);opacity:.66}.og-mark span:nth-child(3){width:7px;height:7px;background:var(--purplelife-accent)}
  .og-message{max-width:600px}.og-message h1{max-width:570px;margin:0;font-size:62px;font-weight:650;letter-spacing:-.052em;line-height:.98;text-wrap:balance}.og-message p{max-width:520px;margin:27px 0 0;color:var(--purplelife-muted);font-size:21px;font-weight:480;letter-spacing:-.015em;line-height:1.35}
  .og-visual{position:relative;overflow:hidden;margin:18px 18px 18px 0;border:1px solid color-mix(in oklab,var(--purplelife-line) 65%,white);border-radius:24px;background:linear-gradient(145deg,rgb(255 255 255 / .76),rgb(246 240 255 / .9)),var(--purplelife-tint)}
  .og-constellation-wrap{position:absolute;top:50%;left:50%;width:430px;transform:translate(-50%,-50%) scale(1.02);filter:drop-shadow(0 30px 38px rgb(80 53 126 / .13))}.og-constellation{display:block;width:100%;height:auto;animation:none!important;transform:none!important}.og-orbit{position:absolute;border:1px solid color-mix(in oklab,var(--purplelife-accent) 18%,white);border-radius:999px}.og-orbit-large{top:-90px;right:-95px;width:420px;height:420px}.og-orbit-small{bottom:-100px;left:-80px;width:300px;height:300px;border-color:color-mix(in oklab,var(--purplelife-blue) 20%,white)}
  .og-note{position:absolute;z-index:3;display:flex;align-items:center;gap:9px;padding:11px 15px;border:1px solid rgb(255 255 255 / .86);border-radius:999px;background:rgb(255 255 255 / .9);color:var(--purplelife-ink);box-shadow:0 12px 26px rgb(77 54 112 / .12);font-size:15px;font-weight:620;letter-spacing:-.02em}.og-note-one{top:84px;right:30px}.og-note-two{right:62px;bottom:72px}.og-note-dot{width:10px;height:10px;border-radius:999px}.og-note-dot-purple{background:var(--purplelife-accent)}.og-note-dot-blue{background:var(--purplelife-blue)}
  .og-glow{position:absolute;z-index:1;border-radius:999px;filter:blur(20px);opacity:.55}.og-glow-one{top:-78px;left:450px;width:270px;height:270px;background:color-mix(in oklab,var(--purplelife-orchid) 20%,transparent)}.og-glow-two{right:120px;bottom:-130px;width:320px;height:320px;background:color-mix(in oklab,var(--purplelife-mint) 18%,transparent)}
`;

export function PurpleLifeShareImage() {
  return (
    <div id="og-image" className="purplelife-pilot og-canvas">
      <style>{styles}</style>
      <div className="og-glow og-glow-one" /><div className="og-glow og-glow-two" />
      <main className="og-panel">
        <section className="og-copy">
          <div className="og-wordmark" aria-label="PurpleLife"><span className="og-mark" aria-hidden="true"><span /><span /><span /></span><span>PurpleLife</span></div>
          <div className="og-message"><h1>Your calm space to capture what’s happening today.</h1><p>Quiet health journaling for symptoms, medication, sleep, photos, and notes.</p></div>
        </section>
        <section className="og-visual" aria-label="A constellation of softly connected journal signals">
          <div className="og-orbit og-orbit-large" /><div className="og-orbit og-orbit-small" /><div className="og-constellation-wrap"><TrendConstellation className="og-constellation" /></div>
          <div className="og-note og-note-one"><span className="og-note-dot og-note-dot-purple" /><span>Notice patterns</span></div>
          <div className="og-note og-note-two"><span className="og-note-dot og-note-dot-blue" /><span>Share selectively</span></div>
        </section>
      </main>
    </div>
  );
}
