import {useSession, signIn, signOut} from "next-auth/react";
import {vanilla_api} from "~/utils/api";
import {useState,type ChangeEvent} from "react";

export default function FunctionalityTest(){
    const {data:session, status} = useSession();
    if(status === "loading") return <div>loading</div>
    if(session === null) return <SignButton hasSession={false}/>;
    if(session?.user === undefined){
	return <SignButton hasSession={false}/>;
    }
    else return <><SignButton hasSession={true}/><AddListButton/><RemListInput/></>
    //api.itemList.
    //session.
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
    return <button className="rounded-full px-10 py-3 bg-black/90 text-white" onClick={()=>void add_list()}>add list</button>
}
function RemListInput(){
    const [input, setInput] = useState("");
    return <>
	<button className="rounded-full px-10 py-3 bg-black/90 text-white" onClick={()=>{void rem_list(input);}}>delete list</button>
	<input value={input} onInput = {(e:ChangeEvent<HTMLInputElement>)=>setInput(e.target.value)}></input>
    </>
}
async function add_list(){
    const a = await vanilla_api.itemList.createList.mutate();
    console.log(a)
}
async function rem_list(id:string){
    await vanilla_api.itemList.deleteList.mutate(id);
}
