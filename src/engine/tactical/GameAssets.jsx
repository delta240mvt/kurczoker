import {createContext,useContext,useEffect,useState} from 'react';
import {useThree} from '@react-three/fiber';
import {loadGameAssets} from './assets.js';
const Context=createContext(null);
export const useGameAssets=()=>useContext(Context);
export function GameAssets({children,onError,onProgress}){
 const {gl}=useThree(),[assets,setAssets]=useState(null);
 useEffect(()=>{let cancelled=false,owned;
  loadGameAssets({renderer:gl,onProgress:value=>{if(!cancelled)onProgress(value)}}).then(value=>{if(cancelled){value.dispose();return}owned=value;setAssets(value)}).catch(e=>{if(!cancelled)onError(e)});
  return ()=>{cancelled=true;owned?.dispose()};
 },[gl,onError,onProgress]);
 return assets?<Context.Provider value={assets}>{children}</Context.Provider>:null;
}
