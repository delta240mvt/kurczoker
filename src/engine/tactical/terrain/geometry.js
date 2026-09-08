/** The same merged boxes feed terrain visuals and physics. */
export function buildTerrainBoxes(snapshot, chunkIds) {
  const {columns,rows,cellSize,chunkCells,cells}=snapshot;
  const chunkColumns=Math.ceil(columns/chunkCells),chunkRows=Math.ceil(rows/chunkCells);
  const chunks=chunkIds ?? Array.from({length:chunkColumns*chunkRows},(_,i)=>i);
  const boxes=[];
  for(const chunkId of chunks) {
    const left=(chunkId%chunkColumns)*chunkCells,bottom=Math.floor(chunkId/chunkColumns)*chunkCells;
    const right=Math.min(columns,left+chunkCells),top=Math.min(rows,bottom+chunkCells);
    let active=new Map();
    const rects=[];
    for(let row=bottom;row<top;row++) {
      const next=new Map();
      for(let col=left;col<right;) {
        const material=cells[row*columns+col];
        if(!material){col++;continue;}
        const start=col;
        while(col<right && cells[row*columns+col]===material) col++;
        const width=col-start,key=`${start}:${width}:${material}`;
        let rect=active.get(key);
        if(rect) rect.height++;
        else {rect={left:start,bottom:row,width,height:1,material};rects.push(rect);}
        next.set(key,rect);
      }
      active=next;
    }
    rects.forEach((r,i)=>{
      const x1=r.left*cellSize,y1=r.bottom*cellSize;
      const x2=Math.min(snapshot.width,(r.left+r.width)*cellSize);
      const y2=Math.min(snapshot.height,(r.bottom+r.height)*cellSize);
      boxes.push({id:`${chunkId}:${i}`,chunkId,x:(x1+x2)/2,y:(y1+y2)/2,
        width:x2-x1,height:y2-y1,material:r.material});
    });
  }
  return boxes;
}

/** Offset visible contour corners into free space, avoiding collider seams. */
export function boundaryCorners({columns,rows,cellSize,cells}) {
  const filled=(x,y)=>x>=0&&y>=0&&x<columns&&y<rows&&cells[y*columns+x]!==0;
  const corners=[],offset=cellSize*.22;
  for(let y=0;y<=rows;y++) for(let x=0;x<=columns;x++) {
    const quadrants=[[-1,-1,filled(x-1,y-1)],[1,-1,filled(x,y-1)],
      [-1,1,filled(x-1,y)],[1,1,filled(x,y)]];
    const count=quadrants.filter(q=>q[2]).length;
    if(count!==1 && count!==3) continue;
    const q=quadrants.find(q=>count===1?q[2]:!q[2]),sign=count===1?-1:1;
    corners.push({x:x*cellSize+q[0]*offset*sign,y:y*cellSize+q[1]*offset*sign});
  }
  return corners;
}
