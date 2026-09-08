import { LEVELS } from '../lib/content';
import type { Screen } from '../lib/game';

/** The signature: a test-runner strip. One dot per test, green or red as you play. */
export function RunStrip({ results, screen }: { results: Record<string, boolean>; screen: Screen }) {
  const cur = screen.t === 'play' || screen.t === 'feedback' ? `${screen.li}-${screen.ii}` : screen.t === 'level' ? `${screen.li}-0` : null;
  return (
    <div className="strip" aria-label="Progress">
      {LEVELS.map((l, li) => (
        <div className="strip-seg" key={l.id}>
          {l.items.map((_, ii) => {
            const k = `${li}-${ii}`;
            const r = results[k];
            const cls = r === true ? 'pass' : r === false ? 'fail' : k === cur ? 'cur' : '';
            return <span key={k} className={`dot ${cls}`} />;
          })}
        </div>
      ))}
    </div>
  );
}
