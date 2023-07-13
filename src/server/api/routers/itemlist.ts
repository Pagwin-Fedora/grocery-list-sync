import {z} from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import type {PrismaClient} from "@prisma/client";

let user_list_cache:Map<string,{
    valid:boolean,
    cache:{id:string}[]
}> = new Map();
let list_item_cache:Map<string,{
    valid:boolean,
    cache:{content:string,id:string}[]
}> = new Map();
export const itemListRouter = createTRPCRouter({
    createList: protectedProcedure.mutation(async ({ctx})=>{
	const res = await ctx.prisma.itemList.create({
	    data:{
		authorized: {
		    connect: [{id:ctx.session.user.id}]
		}
	    }
	});
	return res;
    }),
    deleteList: protectedProcedure
	.input(z.string().cuid())
	.mutation(async ({ctx:{prisma, session}, input:list_id})=>{
	    console.log("LOG: ", list_id)
	    if(await isUserAuthorized(prisma,list_id,session.user.id)){
		await prisma.itemList.delete({
		    where: {
			id:list_id
		    }
		});
		const tmp = list_item_cache.get(list_id);
		if(tmp) tmp.valid = false;
		return true;
	    }
	    else return false;
    }),
    addItem: protectedProcedure
	.input(z.object({
	    list_id: z.string().cuid(),
	    item_content: z.string()
	}))
	.mutation(async ({ctx:{prisma,session}, input:{list_id,item_content}})=>{
	    if(!await isUserAuthorized(prisma,list_id,session.user.id)) return false;
	    await prisma.itemList.update({
		where:{
		    id:list_id
		},
		data:{
		    items:{
			create:[{content:item_content}]
		    }
		}
	    });
	    //hate that we need to juggle a reference here
	    const tmp = list_item_cache.get(list_id);
	    if(tmp) tmp.valid = false;
	    return true;
	}),
    getItems: protectedProcedure
	.input(z.object({list_id:z.string().cuid()}))
	.query(async ({ctx:{prisma,session}, input:{list_id}})=>{
	    // is the user supposed to be able to see this list?
	    if(!await isUserAuthorized(prisma,list_id,session.user.id)) return false;
	    // run the cache
	    if(list_item_cache.get(list_id) && list_item_cache.get(list_id)?.valid){
		//console.log("cache hit");
		//console.log("cache hit");
		//console.log("cache hit");
		//console.log("cache hit");
		//console.log("cache hit");
		//console.log("cache hit");
		return list_item_cache.get(list_id)?.cache;
	    }
	    else{
		//get reason for cache miss
		//const reason = list_item_cache.get(list_id)?list_item_cache.get(list_id)?.valid ? "unknown":"invalid":"missing";
		//console.log("cache miss:", reason);
	    }
	    const list = prisma.itemList.findUnique({
		where:{
		    id:list_id
		}
	    });
	    const val = await list.items();
	    if(val === null) return null;
	    list_item_cache.set(list_id,{valid:true,cache:val});
	    return val;
	}),
    delItem: protectedProcedure
	.input(z.object({item_id:z.string().cuid()}))
	.mutation(async ({ctx:{prisma,session},input:{item_id}})=>{
	    const list_id = (await prisma.item.findUnique({
		where:{
		    id:item_id
		}
	    }))?.listId || "if you see this string anywhere go to ~/src/server/api/routers/itemlist.ts";
	    if(!await isUserAuthorized(prisma,list_id,session.user.id)) return false;
	    await prisma.item.delete({
		where:{
		    id:item_id
		}
	    });
	    const tmp = list_item_cache.get(list_id);
	    if(tmp) tmp.valid = false;
	    return true;
	}),
    getLists: protectedProcedure.query(async ({ctx:{prisma, session}})=>{
	if(user_list_cache.get(session.user.id) && user_list_cache.get(session.user.id)?.valid){
	    return user_list_cache.get(session.user.id)?.cache;
	}
	else{
	    const val = await (prisma.user.findUnique({
		where:{
		    id:session.user.id
		}
	    }).lists());
	    if(!val) return null;
	    user_list_cache.set(session.user.id, {valid:true, cache:val});
	    return val;
	}
    }),
    shareWith: protectedProcedure
	.input(z.object({
	    list_id:z.string().cuid(),
	    people:z.array(z.string().cuid())
	}))
	.mutation(async ({ctx:{prisma,session},input:{list_id,people}})=>{
	    const authed = await (prisma.itemList.findUnique({
		where:{
		    id:list_id
		}
	    }).authorized());
	    if(!authed) return false;
	    if(authed.some((user)=>{
		return user.id === session.user.id;
	    })){
		const people_obs = await prisma.user.findMany({
		    where:{
			id: {in: people}
		    }
		});
		authed.concat(people_obs);
		//retyping to have everything be x | undefined instead of x | null
		const new_authed = authed.map(u=>{
		    return {
			id: u.id,
			email:u.email ? u.email:undefined,
			emailVerified: u.emailVerified? u.emailVerified: undefined,
			image: u.image ? u.image:undefined,
			name: u.name ? u.name:undefined
		    };
		});
		await prisma.itemList.update({
		    where:{
			id:list_id
		    },
		    data:{
			authorized:{
			    set:new_authed
			}
		    }
		});
		return true;
	    }
	    else return false;
	}),
    //TODO: make sure this and shareWith updates user_list_auth_cache
    unshareWith: protectedProcedure
	.input(z.null())
	.mutation(async ()=>{
	    await Promise.resolve(3);
	})
});

let user_list_auth_cache:Map<string,boolean> = new Map();
async function isUserAuthorized(prisma:PrismaClient, list_id:string, user_id:string):Promise<boolean>{
    const cache_val = user_list_auth_cache.get(JSON.stringify({user_id,list_id}));
    if(cache_val != undefined){
	console.log("cache hit");
	console.log("cache hit");
	console.log("cache hit");
	console.log("cache hit");
	console.log("cache hit");
	return cache_val;
    }
    else {
	//console.log("cache miss");
	//console.log("cache miss");
	//console.log("cache miss");
	//console.log("cache miss");
	//console.log("cache miss");
    }
    const list = prisma.itemList.findUnique({
	where: {
	    id:list_id,
	}
    });
    const val = !!(await list.authorized())?.some(({id})=>id===user_id);
    user_list_auth_cache.set(JSON.stringify({user_id,list_id}),val);
    return val;
}
export type ItemListRouter = typeof itemListRouter;
// use this function in an admin dashboard if this scales sufficiently where the memory leaks in these caches become a problem
export function clear_caches(){
    user_list_cache = new Map();
    list_item_cache = new Map();
    user_list_auth_cache = new Map();
}
