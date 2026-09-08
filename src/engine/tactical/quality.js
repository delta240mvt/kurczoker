export function qualityProfile(choice='auto',width=1000,slow=false){
 // Contact shadows are part of the model. Shadow maps cost too much on fallback GPUs.
 if(choice==='high')return {id:'high',dpr:1.5,shadows:false,particles:12};
 if(choice==='low')return {id:'low',dpr:.75,shadows:false,particles:6};
 if(slow)return {id:'auto-low',dpr:.65,shadows:false,particles:6};
 return {id:'auto',dpr:width<900?.85:1,shadows:false,particles:width<900?6:10};
}
