import {useSession, signIn, signOut} from "next-auth/react";
import {api} from "~/utils/api";
export default function FunctionalityTest(){
getServerSession
    const {data:session} = getServerSession();
    if(session?.user === undefined){
	return <SignButton hasSession={false}/>;
    }
    else return <><SignButton hasSession={true}/><AddListButton/></>
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
function logID<T>(value:T):T{
    console.log("LOG: ",value);
    return value;
}
