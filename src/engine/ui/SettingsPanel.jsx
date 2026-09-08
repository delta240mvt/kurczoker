export function SettingsPanel({settings,onChange,onClose,error}){
 const set=(key,value)=>onChange({...settings,[key]:value});
 return <><span className="brand-kicker">PO TWOJEMU</span><h2>Ustawienia</h2><div className="brand-settings">
  <label>Wielkość przycisków<select aria-label="Wielkość przycisków" value={settings.hudScale} onChange={e=>set('hudScale',+e.target.value)}><option value="1">Standardowe</option><option value="1.25">Większe · 125%</option></select></label>
  <label className="brand-toggle"><input type="checkbox" checked={settings.leftHanded} onChange={e=>set('leftHanded',e.target.checked)}/>Sterowanie leworęczne</label>
  <label>Muzyka · {Math.round(settings.musicVolume*100)}%<input aria-label="Głośność muzyki" type="range" min="0" max="1" step=".05" value={settings.musicVolume} onChange={e=>set('musicVolume',+e.target.value)}/></label>
  <label>Efekty · {Math.round(settings.effectsVolume*100)}%<input aria-label="Głośność efektów" type="range" min="0" max="1" step=".05" value={settings.effectsVolume} onChange={e=>set('effectsVolume',+e.target.value)}/></label>
  <label>Jakość grafiki<select aria-label="Jakość grafiki" value={settings.quality} onChange={e=>set('quality',e.target.value)}><option value="auto">Automatyczna</option><option value="low">Oszczędna</option><option value="high">Wysoka</option></select></label>
  <label className="brand-toggle"><input type="checkbox" checked={settings.shake} disabled={settings.reducedMotion} onChange={e=>set('shake',e.target.checked)}/>Wstrząsy kamery</label>
  <label className="brand-toggle"><input type="checkbox" checked={settings.reducedMotion} onChange={e=>set('reducedMotion',e.target.checked)}/>Ogranicz ruch i efekty</label>
 </div>{error&&<p role="status">Ustawienia działają w tej karcie. Przeglądarka nie pozwala ich zapisać.</p>}<button className="brand-primary" onClick={onClose}>Gotowe</button></>;
}
