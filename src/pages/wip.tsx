import {useSession} from "next-auth/react";
import {SignButton, AddListButton, RemListInput, AddItem, ListList, ShareIdDisplay} from "~/utils/components";
export default function FunctionalityTest(){
    const {data:session, status} = useSession();

    if(status === "loading") return <div>loading</div>
    if(session === null) return <SignButton hasSession={false}/>;
    if(session?.user === undefined){
	return <SignButton hasSession={false}/>;
    }

    else return <>
	<SignButton hasSession={true}/>
	<AddListButton/>
	<RemListInput/>
	<AddItem/>
	<ListList/>
	<ShareIdDisplay user_id={session.user.id}/>
    </>
}
