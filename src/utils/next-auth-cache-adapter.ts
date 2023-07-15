import type { Adapter, AdapterUser, AdapterAccount ,AdapterSession} from "@auth/core/adapters";
import {Cache} from "~/utils/cache";

export class CacheAdapter{
    underlying:Adapter;
    constructor(underlying:Adapter){
	this.underlying = underlying;
    }
    async createUser(user:AdapterUser) {
      return await this.underlying.createUser?.(user);
    }
    async getUser(id:string) {
      return await this.underlying.getUser?.(id);
    }
    async getUserByEmail(email:string) {
      return await this.underlying.getUserByEmail?.(email);
    }
    async getUserByAccount(account:AdapterAccount) {
      return await this.underlying.getUserByAccount?.(account);
    }
    async updateUser(user:AdapterUser) {
      return await this.underlying.updateUser?.(user);
    }
    async deleteUser(userId:string) {
      return await this.underlying.deleteUser?.(userId);
    }
    async linkAccount(account:AdapterAccount) {
      return await this.underlying.linkAccount?.(account);
    }
    async unlinkAccount(account:AdapterAccount) {
      return await this.underlying.unlinkAccount?.(account);
    }
    async createSession(session:AdapterSession) {
      return await this.underlying.createSession?.(session);
    }
    async getSessionAndUser(sessionToken:string) {
      return await this.underlying.getSessionAndUser?.(sessionToken);
    }
    async updateSession(session:AdapterSession) {
      return await this.underlying.updateSession?.(session);
    }
    async deleteSession(sessionToken:string) {
      return await this.underlying.deleteSession?.(sessionToken);
    }
}
