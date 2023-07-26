import {useSession} from "next-auth/react";
import {SignButton, AddListButton, ListList, ShareIdDisplay, StandardElements} from "~/utils/components";
export default function FunctionalityTest(){
    const {data:session, status} = useSession();

    if(status === "loading") return <div>loading</div>
    if(session === null) return <SignButton hasSession={false}/>;
    if(session?.user === undefined){
	return <SignButton hasSession={false}/>;
    }

    else return <div className="object-center w-max flex justify-center">
	<StandardElements/>
	<SignButton hasSession={true}/>
	<ShareIdDisplay user_id={session.user.id}/>
	<ListList/>
	<AddListButton/>
    </div>
}
