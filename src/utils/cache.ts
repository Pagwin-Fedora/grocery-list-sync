export class Cache<T> implements GenericCache<T>{
    /// implementation detail
    underlying:Map<string,{cleanUpHandle?:number,val:T}> = new Map();
    get(key:string, onMiss:(key:string)=>T):T{
	const tmp = this.underlying.get(key);
	if(tmp){
	    return tmp.val;
	}
	else{
	    const val = onMiss(key);
	    this.underlying.set(key,{cleanUpHandle:undefined,val});
	    return val;
	}
    }
    async getAsync(key:string, onMiss:(key:string)=>Promise<T>):Promise<T>{
	const tmp = this.underlying.get(key);
	if(tmp){
	    return tmp.val;
	}
	else{
	    const val = await onMiss(key);
	    this.underlying.set(key,{cleanUpHandle:undefined,val});
	    return val;
	}
    }
    invalidate(key:string):void{
	this.underlying.delete(key);
    }
    hasLifespan(key:string):boolean{
	const val = this.underlying.get(key);
	if(!val) return false;
	return !(val.cleanUpHandle === undefined);
    }
    setLifespan(key:string, time:number):void{
	const val = this.underlying.get(key);
	if(!val) return;
	if(val.cleanUpHandle !== undefined){
	    clearTimeout(val.cleanUpHandle);
	}
	val.cleanUpHandle = window.setTimeout(this.invalidate.bind(this,key),time);
    }
    clearLifespan(key:string):void{
	const val = this.underlying.get(key);
	if(!val) return;
	if(val.cleanUpHandle !== undefined){
	    clearTimeout(val.cleanUpHandle);
	}
    }
    clear():void{
	this.underlying.clear();
    }
}

//cache where the miss operation is fallible
export class FallibleCache<T> implements GenericCache<T>{
    // Cache<T> is null or undefined only for convenience, it'll never actually hold onto any null or undefined items
    underlying:Cache<T|null|undefined> = new Cache();
    get(key:string, onMiss:(key:string)=>T|null|undefined):T | null{
	let tmp = this.underlying.get(key, onMiss);
	if(tmp === null || tmp === undefined){
	    this.underlying.invalidate(key);
	    tmp = null;
	}
	return tmp;
    }
    async getAsync(key:string, onMiss:(key:string)=>Promise<T | null | undefined>):Promise<T | null>{
	let tmp = await this.underlying.getAsync(key, onMiss);
	if(tmp === null || tmp === undefined){
	    this.underlying.invalidate(key);
	    tmp = null;
	}
	return tmp;
    }
    invalidate(key:string):void{
	this.underlying.invalidate(key);
    }
    clear():void{
	this.underlying.clear();
    }
    hasLifespan(key:string):boolean{
	return this.underlying.hasLifespan(key);
    }
    setLifespan(key:string, time:number):void{
	return this.underlying.setLifespan(key,time);
    }
    clearLifespan(key:string):void{
	return this.underlying.clearLifespan(key);
    }
    
}
export interface GenericCache<T>{
    get(key:string, onMiss:(key:string)=>T|null|undefined):T | null;
    getAsync(key:string, onMiss:(key:string)=>Promise<T | null | undefined>):Promise<T | null>;
    invalidate(key:string):void;
    clear():void;
    //might not want these on the base generic interface
    hasLifespan(key:string):boolean;
    setLifespan(key:string, time:number):void;
    clearLifespan(key:string):void;
}

interface GenObCache<K,V>{
    get(key:K, onMiss:(key:K)=>V|null|undefined):V | null;
    getAsync(key:K, onMiss:(key:K)=>Promise<V | null | undefined>):Promise<V | null>;
    invalidate(key:K):void;
    clear():void;
}
export class FallibleObjectCache<K,V> implements GenObCache<K,V>{
    // if you're wondering why I'm not using Map<K,V> as the underlying it's because js objects are references so Map.get({}) will never match anything ever instead I'm using JSON.stringify and at that point why not just use the existing utility of FallibleCache
    underlying:FallibleCache<V> = new FallibleCache();
    get(key:K, onMiss:(key:K)=>V|null|undefined):V | null{
	const str = JSON.stringify(key);
	return this.underlying.get(str,(_)=>onMiss(key));
    }
    async getAsync(key:K, onMiss:(key:K)=>Promise<V | null | undefined>):Promise<V | null>{
	const str = JSON.stringify(key);
	return await this.underlying.getAsync(str,async (_)=>await onMiss(key));

    }
    invalidate(key:K):void{
	this.underlying.invalidate(JSON.stringify(key));
    }
    clear():void{
	this.underlying.clear();
    }
    setLifespan(key:K, time:number):void{
	this.underlying.setLifespan(JSON.stringify(key),time);
    }
}
export class ObjectCache<K,V> implements GenObCache<K,V>{
    // if you're wondering why I'm not using Map<K,V> as the underlying it's because js objects are references so Map.get({}) will never match anything ever instead I'm using JSON.stringify and at that point why not just use the existing utility of FallibleCache
    underlying:Cache<V> = new Cache();
    get(key:K, onMiss:(key:K)=>V):V{
	const str = JSON.stringify(key);
	return this.underlying.get(str,(_)=>onMiss(key));
    }
    async getAsync(key:K, onMiss:(key:K)=>Promise<V>):Promise<V>{
	const str = JSON.stringify(key);
	return await this.underlying.getAsync(str,async (_)=>await onMiss(key));

    }
    invalidate(key:K):void{
	this.underlying.invalidate(JSON.stringify(key));
    }
    clear():void{
	this.underlying.clear();
    }
    setLifespan(key:K, time:number):void{
	this.underlying.setLifespan(JSON.stringify(key),time);
    }
}
