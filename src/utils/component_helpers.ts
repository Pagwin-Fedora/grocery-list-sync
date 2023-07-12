import type {ChangeEvent} from "react";

/// return a function to pass to onInput when making an input that you then click a button to submit
export const onInputHelper = (setInput:(_:string)=>void)=>(e:ChangeEvent<HTMLInputElement>)=>setInput(e.target.value);
