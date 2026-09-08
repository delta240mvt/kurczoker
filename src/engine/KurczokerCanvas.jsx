import {useEffect,useState} from 'react';
import {ExpeditionApp} from './ExpeditionApp.jsx';
export function KurczokerCanvas(){
 const [ready,setReady]=useState(false);useEffect(()=>setReady(true),[]);
 return ready?<ExpeditionApp/>:<div className="brand-game-menu" role="status">Przygotowujemy KURCZOKERA…</div>;
}
export default KurczokerCanvas;
