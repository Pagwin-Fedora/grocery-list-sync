import {api, vanilla_api} from "~/utils/api";
import {onInputHelper} from "~/utils/component_helpers";
import {useState} from "react";
import {signIn, signOut} from "next-auth/react";
import Head from "next/head";
export function SignButton({hasSession}:{hasSession:boolean}){
    return <button
	    className="rounded-full px-10 py-3 text-black font-semibold no-underline bg-gray-400 ease-in-out hover:text-white hover:bg-gray-700 hover:duration-300"
	    onClick={hasSession ? () => void signOut() : () => void signIn()}
	  >
	    {hasSession ? "Sign out" : "Sign in"}
	  </button>;
}
export function AddListButton(){
    const mutation = api.itemList.createList.useMutation();
    const [listName, setListName] = useState("");
    return <>
	<input className="ease-in-out duration-200 focus:border-blue-500 outline-none p-2 rounded-full border-blue-300 border-4" placeholder="list name" value={listName} onInput={onInputHelper(setListName)}/>
	<button className="m-4 rounded-full px-10 py-3 bg-black/90 text-white" onClick={()=>{
	    mutation.mutate({name:listName});
	    setListName("");
	}}>add list</button></>
}
export function RemListInput(){
    const [input, setInput] = useState("");
    const mut_hook = api.itemList.deleteList.useMutation();
    return <>
	<button className="rounded-full px-10 py-3 bg-black/90 text-white" onClick={()=>{
	    mut_hook.mutate(input);
	    setInput("");
	}}>delete list</button>
	<input placeholder="remove list id" value={input} onInput = {onInputHelper(setInput)}></input>
    </>
}
function add_list(hook:{mutate:()=>void}){
    const a = hook.mutate();
    console.log(a)
}

export function AddItem(){
    const mut_hook = api.itemList.addItem.useMutation();
    const [content, setContent] = useState("");
    const [list_id, setListId] = useState("");
    return <>
	<button onClick={add_item.bind(null,mut_hook,content, list_id)}>add item</button>
	<input placeholder="item contents" onInput={onInputHelper(setContent)}></input>
	<input placeholder="list id" onInput={onInputHelper(setListId)}></input>
    </>;
}
function add_item(hook:{mutate:(input:{list_id:string, item_content:string})=>void}, content:string, list_id:string){
    hook.mutate({list_id,item_content:content});
    return;
}
export function ItemList({list_id}:{list_id:string}){
    const data = api.itemList.getItems.useQuery({list_id},{refetchInterval:500});
    const name = api.itemList.getListName.useQuery({list_id});
    //check if we're fetching
    if(!data.data)return <p>loading list</p>
    const items = data.data.map((data)=>{
	return <>
	    <Item key={data.id} id={data.id} content={data.content}/>
	    <br/>
	</>;
    });
    return <><h1 className="text-white font-bold text-3xl">{name.data}</h1> {items}</>
}
function Item(item:{id:string, content:string}){

    
    return <>
	<ItemDisp>{item.content}</ItemDisp>
	<RemItemBut id={item.id}/>
    </>;
}
function ItemDisp({children}:{children:string}){
    return <div className="text-white">{children}</div>
}
function RemItemBut({id}:{id:string}){
    const rem_item = api.itemList.delItem.useMutation();
    return <button className="m-1 rounded-full bg-red-600 p-1 text-white" onClick={()=>rem_item.mutate({item_id:id})}>Delete item</button>;
}
export function ListList(){
    const lists = api.itemList.getLists.useQuery(undefined,{
	refetchInterval:100
    });
    if(!lists.data) <p>loading</p>;
    // using the vanilla api here might be bad practice but I don't know how to get around this otherwise
    const list_items = lists.data?.map((attrs)=>{
	return <tr className="m-0" key={attrs.id}>
	    <td><a className="text-lg underline text-blue-800" href={"/list/"+attrs.id} key={attrs.id}>{attrs.name}</a></td>
	    <td><button className="hover:ease-in-out hover:duration-500 hover:bg-red-800 active:ease-in-out active:duration-100 active:bg-red-900 outline-none text-white bg-red-600 font-bold text-lg border-3 border-black rounded-full bg-contain m-3 p-1" onClick={()=>{const _ = vanilla_api.itemList.deleteList.mutate(attrs.id)}}>delete list</button></td>
	</tr>
    });
    // idk why key is needed but typescript got angy otherwise
    return <table>{list_items}</table>
}
export function AddItemButton(attrs:{list_id:string}){
    const mutation = api.itemList.addItem.useMutation();
    const [contents,setContents] = useState("");
    return <>
	<input placeholder="item contents" onInput={onInputHelper(setContents)} value={contents}/>
	<button className="text-white border-1 border-white" onClick={()=>{
	    setContents("");
	    mutation.mutate({list_id:attrs.list_id,item_content:contents});
	}}>add item</button>
    </>;
}
export function ShareListButton(attrs:{list_id:string}){
    const mutation = api.itemList.shareWith.useMutation();

    const [shareId, setShareId] = useState("");
    return <>
	<input placeholder="share id" onInput={onInputHelper(setShareId)}/>
	<button onClick={()=>mutation.mutate({list_id:attrs.list_id,people:[shareId]})}>Share list</button>
    </>
}
export function ShareIdDisplay(attrs:{user_id:string}){
    
    return <div className="text-white m-0 p-0">share id: <button className="underline" onClick={()=>navigator.clipboard.writeText(attrs.user_id)}>{attrs.user_id}</button></div>
}

export function StandardElements(){
    return <>
    <Head>
	<script>
	    document.body.className = "bg-gray-900";
	</script>
    </Head>
    </>
}
