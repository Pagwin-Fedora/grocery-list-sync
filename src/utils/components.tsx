import {api} from "~/utils/api";
import {useState,type ChangeEvent} from "react";
import {signIn, signOut} from "next-auth/react";
export function SignButton({hasSession}:{hasSession:boolean}){
    return <button
	    className="rounded-full px-10 py-3 text-black font-semibold no-underline bg-black/20"
	    onClick={hasSession ? () => void signOut() : () => void signIn()}
	  >
	    {hasSession ? "Sign out" : "Sign in"}
	  </button>;
}
export function AddListButton(){
    const mut_hook = api.itemList.createList.useMutation();
    return <button className="rounded-full px-10 py-3 bg-black/90 text-white" onClick={add_list.bind(null,mut_hook)}>add list</button>
}
export function RemListInput(){
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

export function AddItem(){
    const mut_hook = api.itemList.addItem.useMutation();
    const [content, setContent] = useState("");
    const [list_id, setListId] = useState("");
    return <>
	<button onClick={add_item.bind(null,mut_hook,content, list_id)}>add item</button>
	<input placeholder="item contents" onInput={(e:ChangeEvent<HTMLInputElement>)=>setContent(e.target.value)}></input>
	<input placeholder="list id" onInput={(e:ChangeEvent<HTMLInputElement>)=>setListId(e.target.value)}></input>
    </>;
}
function add_item(hook:{mutate:(input:{list_id:string, item_content:string})=>void}, content:string, list_id:string){
    hook.mutate({list_id,item_content:content});
    return;
}
export function ItemList({list_id}:{list_id:string}){
    const data = api.itemList.getItems.useQuery({list_id});
    //check if we're fetching
    if(!data.data)return <p>loading list</p>

    
    return <>{data.data.map(Item)}</>
}
function Item(item:{content:string}){
    <>{item.content}</>
}
export function ListList(){
    const lists = api.itemList.getLists.useQuery();
    if(!lists.data) <p>loading</p>
    // idk why key is needed but typescript got angy otherwise
    return <>{lists.data?.map(({id})=><p key={id}>{id}</p>)}</>
}
