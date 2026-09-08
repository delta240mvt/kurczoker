const MODES=new Set(['move','aim','rope','tool','overview','menu']);
const ACTIONS=new Set(['left','right','jump','reel-in','reel-out']);
export function createInputRouter(emit) {
  const held=new Map();let mode='move';
  function publish(){
    const actions=new Set(held.values());
    emit({type:'rope.reel',rate:(actions.has('reel-out')?1:0)-(actions.has('reel-in')?1:0)});
    emit({type:'move',direction:(actions.has('right')?1:0)-(actions.has('left')?1:0)});
  }
  function clear(){held.clear();publish();}
  return {
    press(id,action){
      if(['menu','overview','tool'].includes(mode)||!ACTIONS.has(action)||held.has(id))return;
      held.set(id,action);if(action==='jump')emit({type:'jump'});publish();
    },
    release(id){held.delete(id);publish();},clear,
    setMode(next){if(MODES.has(next)&&next!==mode){clear();mode=next;}},
    mode:()=>mode,
  };
}
export function bindInput({router,target=window,document=globalThis.document,onPause=()=>{},onRope=()=>{}}) {
  const actions={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',ArrowUp:'jump',KeyW:'reel-in',KeyS:'reel-out'};
  const editable=e=>/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)||e.target?.isContentEditable;
  function down(e){
    if(editable(e))return;
    if(!actions[e.code]&&!['Escape','KeyR'].includes(e.code))return;
    e.preventDefault();if(e.repeat)return;
    if(e.code==='Escape'){router.clear();onPause();}
    else if(e.code==='KeyR'){if(router.mode()!=='menu')onRope();}
    else router.press('key:'+e.code,actions[e.code]);
  }
  function up(e){if(actions[e.code])router.release('key:'+e.code);}
  const clear=()=>router.clear();
  const bindings=[[target,'keydown',down],[target,'keyup',up],[target,'blur',clear],
    [target,'orientationchange',clear],[document,'visibilitychange',clear]];
  bindings.forEach(([t,k,f])=>t.addEventListener(k,f));
  return ()=>{clear();bindings.forEach(([t,k,f])=>t.removeEventListener(k,f));};
}
