import {MATERIAL} from '../config.js';

/** @param {import('../contracts.js').MapDef} map */
export function createTerrain(map) {
  const {width,height,cellSize,chunkCells=32}=map;
  if (![width,height,cellSize].every(n=>Number.isFinite(n)&&n>0) ||
      !Number.isInteger(chunkCells) || chunkCells<1) throw new Error('Invalid terrain dimensions');
  const columns=Math.ceil(width/cellSize),rows=Math.ceil(height/cellSize);
  if (columns*rows>2_000_000) throw new Error('Terrain exceeds cell budget');
  const cells=new Uint8Array(columns*rows);
  const chunkColumns=Math.ceil(columns/chunkCells);
  let revision=0;

  function range(x,y,w,h) {
    return {
      left:Math.max(0,Math.floor(x/cellSize)),
      right:Math.min(columns,Math.ceil((x+w)/cellSize)),
      bottom:Math.max(0,Math.floor(y/cellSize)),
      top:Math.min(rows,Math.ceil((y+h)/cellSize)),
    };
  }
  for (const shape of map.shapes) {
    if (shape.kind!=='rect' || ![0,1,2,3].includes(shape.material) ||
        ![shape.x,shape.y,shape.width,shape.height].every(Number.isFinite) ||
        shape.width<=0 || shape.height<=0) throw new Error('Invalid terrain shape');
    const r=range(shape.x,shape.y,shape.width,shape.height);
    for(let row=r.bottom;row<r.top;row++) {
      for(let col=r.left;col<r.right;col++) cells[row*columns+col]=shape.material;
    }
  }

  function materialAt(x,y) {
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=width||y>=height) return MATERIAL.empty;
    return cells[Math.floor(y/cellSize)*columns+Math.floor(x/cellSize)];
  }
  function cut(bounds,contains) {
    const dirty=new Set(),r=range(bounds.x,bounds.y,bounds.width,bounds.height);
    for(let row=r.bottom;row<r.top;row++) for(let col=r.left;col<r.right;col++) {
      const index=row*columns+col,material=cells[index];
      if ((material===MATERIAL.soil||material===MATERIAL.wood) &&
          contains((col+.5)*cellSize,(row+.5)*cellSize)) {
        cells[index]=MATERIAL.empty;
        dirty.add(Math.floor(row/chunkCells)*chunkColumns+Math.floor(col/chunkCells));
      }
    }
    if(dirty.size) revision++;
    return [...dirty].sort((a,b)=>a-b);
  }
  return {
    materialAt,
    cutCircle({x,y,radius}) {
      if(![x,y,radius].every(Number.isFinite)||radius<=0) return [];
      return cut({x:x-radius,y:y-radius,width:radius*2,height:radius*2},
        (px,py)=>(px-x)**2+(py-y)**2<=radius**2);
    },
    cutRect({x,y,width:w,height:h}) {
      if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0) return [];
      return cut({x,y,width:w,height:h},(px,py)=>px>=x&&px<x+w&&py>=y&&py<y+h);
    },
    snapshot() {
      return {revision,width,height,columns,rows,cellSize,chunkCells,cells:Array.from(cells)};
    },
    get revision(){return revision;},
  };
}
