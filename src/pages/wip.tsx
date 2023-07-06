import {useSession, signIn, signOut} from "next-auth/react";
import {api} from "~/utils/api";
export default function FunctionalityTest(){
    const {data:session} = useSession();
    if(session?.user === undefined){
	return <SignButton hasSession={false}/>;
    }
    //api.itemList.
    //session.
}
function SignButton({hasSession}:{hasSession:boolean}){
    return <button
	    className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
	    onClick={hasSession ? () => void signOut() : () => void signIn()}
	  >
	    {hasSession ? "Sign out" : "Sign in"}
	  </button>;
}
function AddListButton(){
    return <button></button>
}
