import type { Adapter, AdapterUser, AdapterAccount ,AdapterSession} from "@auth/core/adapters";
import {FallibleCache, FallibleObjectCache} from "~/utils/cache";


//for convenience while figuring out what can be cached and when those caches should be invalidated gonna copy paste some next-auth documentation here
//
// TLDR for now: User should be invalidated when updated or deleted, an account should be invalidated when it's unlinked and a session should be invalidated when it's updated, deleted or when it expires. Users can have multiple accounts and sessions so 
//
//AdapterAccount
// An account is a connection between a user and a provider.
// 
// There are two types of accounts:
// 
//     OAuth/OIDC accounts, which are created when a user signs in with an OAuth provider.
//     Email accounts, which are created when a user signs in with an Email provider.
// 
// One user can have multiple accounts.
//
//
//AdapterSession
// A session holds information about a user's current signin state.
// THIS EXPIRES AFTER AN EXPIRY DATE
//
//AdapterUser
// A user represents a person who can sign in to the application. If a user does not exist yet, it will be created when they sign in for the first time, using the information (profile data) returned by the identity provider. A corresponding account is also created and linked to the user.

export class CacheAdapter{
    underlying:Adapter;
    userIdCache:FallibleCache<AdapterUser> = new FallibleCache();
    userEmailCache:FallibleCache<AdapterUser> = new FallibleCache();
    userAccountCache:FallibleObjectCache<AdapterAccount,AdapterUser> = new FallibleObjectCache();
    sessionCache:FallibleCache<{user:AdapterUser, session:AdapterSession}> = new FallibleCache();
    constructor(underlying:Adapter){
	this.underlying = underlying;
    }
    // currently assuming this doesn't invalidate any caches that wouldn't be invalid via other means
    async createUser(user:AdapterUser) {
	return await this.underlying.createUser?.(user);
    }
    // doesn't mutate
    async getUser(id:string) {
	return await this.userIdCache.getAsync(id,async id=>await this.underlying.getUser?.(id));
    }
    // doen't mutate
    async getUserByEmail(email:string) {
	return await this.userEmailCache.getAsync(email,async email=>await this.underlying.getUserByEmail?.(email));
    }
    // doesn't mutate
    async getUserByAccount(account:AdapterAccount) {
	return await this.userAccountCache.getAsync(account,async account=>await this.underlying.getUserByAccount?.(account));
    }
    // invalidates any cache with a user as a key or a value
    async updateUser(user:AdapterUser) {
	return await this.underlying.updateUser?.(user);
    }
    // invalidates any cache with a user as a key or a value
    async deleteUser(userId:string) {
	return await this.underlying.deleteUser?.(userId);
    }
    // unclear
    async linkAccount(account:AdapterAccount) {
	return await this.underlying.linkAccount?.(account);
    }
    // invalidates any cache with Account as a key or value
    async unlinkAccount(account:AdapterAccount) {
	return await this.underlying.unlinkAccount?.(account);
    }
    // currently assuming this doesn't invalidate any caches that wouldn't be invalid via other means
    async createSession(session:AdapterSession) {
	return await this.underlying.createSession?.(session);
    }
    // doesn't mutate
    async getSessionAndUser(sessionToken:string) {
	const pair = await this.sessionCache.getAsync(sessionToken,async sessionToken=>await this.underlying.getSessionAndUser?.(sessionToken));
	if(!pair) return pair;

	// code to have the session taken out of the cache when it expires
	const time_left = pair.session.expires.getTime()-Date.now();
	//if we're coming up on the invalidation of the session then we shouldn't keep it in the cache anymore
	if(time_left < 100) this.sessionCache.invalidate(sessionToken);
	else this.sessionCache.setLifespan(sessionToken,time_left);
	return pair;
    }
    async updateSession(session:AdapterSession) {
	return await this.underlying.updateSession?.(session);
    }
    async deleteSession(sessionToken:string) {
	return await this.underlying.deleteSession?.(sessionToken);
    }
}
