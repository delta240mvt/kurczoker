const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function cameraTarget({viewport,bounds,actor,projectile,rope,mode,overviewCenter,dt,previous}) {
  const aspect=Math.max(.2,viewport.width/Math.max(1,viewport.height));
  let visibleHeight=Math.min(10,Math.max(6,viewport.height/64));
  let x=(projectile??actor).x+(projectile?0:clamp((actor.vx??0)*.15,-1,1));
  let y=(projectile??actor).y+(projectile?0:-.35);
  if(mode==='overview') {
    visibleHeight=Math.max(bounds.height+4,(bounds.width+4)/aspect)/(overviewCenter?.zoom??1);
    x=overviewCenter?.x??bounds.width/2;y=overviewCenter?.y??bounds.height/2;
  } else if(rope && !projectile) {
    visibleHeight=Math.min(18,viewport.height/44*1.1,Math.max(visibleHeight,Math.abs(rope.anchor.y-actor.y)+3));
  }
  const halfWidth=visibleHeight*aspect/2;
  x=halfWidth*2>=bounds.width?bounds.width/2:clamp(x,halfWidth,bounds.width-halfWidth);
  y=clamp(y,visibleHeight*.05,bounds.height+visibleHeight*.1);
  const alpha=1-Math.exp(-8*Math.max(0,dt));
  // Orientation changes update zoom immediately but keep the world target.
  const smoothing=previous && previous.mode===mode;
  return {x:smoothing?previous.x+(x-previous.x)*alpha:x,
    y:smoothing?previous.y+(y-previous.y)*alpha:y,visibleHeight,
    zoom:viewport.height/visibleHeight,mode};
}
