import {useEffect,useRef} from 'react';
export function GameDialog({title,onClose,children}){
 const ref=useRef();useEffect(()=>{const dialog=ref.current,previous=document.activeElement;dialog.showModal();return ()=>{dialog.close();previous?.focus?.()}},[]);
 return <dialog ref={ref} className="brand-dialog" aria-label={title} onCancel={e=>{e.preventDefault();e.stopPropagation();onClose()}} onKeyDown={e=>e.stopPropagation()}><section>{children}</section></dialog>;
}
