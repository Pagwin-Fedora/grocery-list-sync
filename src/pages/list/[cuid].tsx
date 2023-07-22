import {useRouter} from "next/router";
import {ItemList, AddItemButton, ShareListButton} from "~/utils/components";

export default function Page(){
    const router = useRouter();
    const id = router.query.cuid;
    if(id === undefined) return <p>loading</p>
    if(typeof id != "string") return <span>error invalid id</span>
    return <>
	<ItemList list_id={id}/>
	<br/>
	<AddItemButton list_id={id}/>
	<br/>
	<ShareListButton list_id={id}/>
    </>;
}
