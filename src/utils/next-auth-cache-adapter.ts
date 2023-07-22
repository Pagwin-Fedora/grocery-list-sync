import type {Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken} from "next-auth/adapters";
import {FallibleCache, FallibleObjectCache} from "~/utils/cache";


type acc_arg = Pick<AdapterAccount,"provider"| "providerAccountId">;
export class CacheAdapter implements Adapter<true>{
    // using & here so createUser is type safe for use in this project
    underlying:Adapter<true>;
    userIdCache:FallibleCache<AdapterUser> = new FallibleCache();
    userEmailCache:FallibleCache<AdapterUser> = new FallibleCache();
    userAccountCache:FallibleObjectCache<acc_arg,AdapterUser> = new FallibleObjectCache();
    sessionCache:FallibleCache<{user:AdapterUser, session:AdapterSession}> = new FallibleCache();
    verTokenCache:FallibleObjectCache<{identifier:string,token:string},VerificationToken> = new FallibleObjectCache();

    constructor(underlying:Adapter<true>){
	this.underlying = underlying;
    }
    // currently assuming this doesn't invalidate any caches that wouldn't be invalid via other means
    createUser = async (user:Omit<AdapterUser,"id">)=>{
	return await this.underlying.createUser(user);
    }
    // doesn't mutate
    getUser = async (id:string)=>{
	return await this.userIdCache.getAsync(id,async id=>await this.underlying.getUser(id));
    }
    // doen't mutate
    getUserByEmail = async (email:string)=>{
	return await this.userEmailCache.getAsync(email,async email=>await this.underlying.getUserByEmail(email));
    }
    // doesn't mutate
    getUserByAccount = async (account:Pick<AdapterAccount,"provider"| "providerAccountId"> )=>{
	return await this.userAccountCache.getAsync(account,async account=>await this.underlying.getUserByAccount(account));
    }
    updateUser = async (user:Partial<AdapterUser> & Pick<AdapterUser, "id">)=>{
	this.userIdCache.invalidate(user.id);
	if(user.email)this.userEmailCache.invalidate(user.email);

	return await this.underlying.updateUser(user);
    }
    deleteUser = async (userId:string)=>{
	const user = await this.userIdCache.getAsync(userId,async id=>await this.underlying.getUser(id));
	if(user !== null) this.userEmailCache.invalidate(user.email);
	this.userIdCache.invalidate(userId);

	if(this.underlying.deleteUser) await this.underlying.deleteUser(userId);
    }
    // invalidates the account cache
    linkAccount = async (account:AdapterAccount)=>{
	this.userAccountCache.invalidate(account);

	// just so you know future me, I hate this
	return <AdapterAccount | null | undefined> await this.underlying.linkAccount(account);
    }
    // invalidates account cache 
    unlinkAccount = async (account:Pick<AdapterAccount, "provider" | "providerAccountId">)=>{
	this.userAccountCache.invalidate(account);

	// just so you know future me, I hate this
	return <AdapterAccount | undefined> await this.underlying.unlinkAccount?.(account);
    }
    // currently assuming this doesn't invalidate any caches that wouldn't be invalid via other means
    createSession = async (session:AdapterSession)=>{
	return await this.underlying.createSession(session);
    }
    // doesn't mutate
    getSessionAndUser = async (sessionToken:string)=>{
	const pair = await this.sessionCache.getAsync(sessionToken,async sessionToken=>await this.underlying.getSessionAndUser(sessionToken));
	if(!pair) return pair;

	// code to have the session taken out of the cache when it expires
	const time_left = pair.session.expires.getTime()-Date.now();
	//if we're coming up on the invalidation of the session then we shouldn't keep it in the cache anymore
	if(time_left < 100) this.sessionCache.invalidate(sessionToken);
	else this.sessionCache.setLifespan(sessionToken, time_left);
	return pair;
    }
    updateSession = async (session:Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">)=>{
	this.sessionCache.invalidate(session.sessionToken);

	return await this.underlying.updateSession?.(session);
    }
    deleteSession = async (sessionToken:string)=>{
	this.sessionCache.invalidate(sessionToken);
	// just so you know future me, I hate this
	return <AdapterSession | null | undefined>await this.underlying.deleteSession(sessionToken);
    }
    createVerificationToken = async (token:VerificationToken)=>{
        return this.underlying.createVerificationToken(token);
    }

    useVerificationToken = async (params:{identifier:string,token:string})=>{
        const val = await this.verTokenCache.getAsync(params,async params=>this.underlying.useVerificationToken(params));
        if(val === null) return null;
        const time_left = Date.now()-val.expires.getTime();
        if(time_left<100) this.verTokenCache.invalidate(params);
        else this.verTokenCache.setLifespan(params, time_left);
        return val;
    }
}
