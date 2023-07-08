import {useSession, signIn, signOut} from "next-auth/react";
import {api} from "~/utils/api";
import {useState,type ChangeEvent} from "react";

export default function FunctionalityTest(){
    const {data:session, status} = useSession();
    if(status === "loading") return <div>loading</div>
    if(session === null) return <SignButton hasSession={false}/>;
    if(session?.user === undefined){
	return <SignButton hasSession={false}/>;
    }
    else return <><SignButton hasSession={true}/><AddListButton/><RemListInput/></>
}
function SignButton({hasSession}:{hasSession:boolean}){
    return <button
	    className="rounded-full px-10 py-3 text-black font-semibold no-underline bg-black/20"
	    onClick={hasSession ? () => void signOut() : () => void signIn()}
	  >
	    {hasSession ? "Sign out" : "Sign in"}
	  </button>;
}
function AddListButton(){
    const mut_hook = api.itemList.createList.useMutation();
    return <button className="rounded-full px-10 py-3 bg-black/90 text-white" onClick={add_list.bind(null,mut_hook)}>add list</button>
}
function RemListInput(){
    const [input, setInput] = useState("");
    const mut_hook = api.itemList.deleteList.useMutation();
    return <>
	<button className="rounded-full px-10 py-3 bg-black/90 text-white" onClick={rem_list.bind(null,mut_hook,input)}>delete list</button>
	<input placeholder="remove list id" value={input} onInput = {(e:ChangeEvent<HTMLInputElement>)=>setInput(e.target.value)}></input>
    </>
}
function add_list(hook:{mutate:()=>void}){
    const a = hook.mutate();
    console.log(a)
}
function rem_list(hook:{mutate:(id:string)=>void}, id:string){
    hook.mutate(id);
}
