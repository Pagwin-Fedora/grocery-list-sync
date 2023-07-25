import {z} from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import {TRPCError} from "@trpc/server";
  
import type {PrismaClient} from "@prisma/client";
import {FallibleCache, ObjectCache} from "~/utils/cache";

const user_list_cache:FallibleCache<{id:string, name:string}[] | null> = new FallibleCache();
const list_item_cache:FallibleCache<{content:string,id:string}[] | null> = new FallibleCache();
export const itemListRouter = createTRPCRouter({
    createList: protectedProcedure
	.input(z.object({name:z.string()}))
	.mutation(async ({ctx, input:{name}})=>{
	    const res = await ctx.prisma.itemList.create({
		data:{
		    name,
		    authorized: {
			connect: [{id:ctx.session.user.id}]
		    }
		}
	    });
	    // kinda sucks that all the users's lists need to be invalidated at once but oh well
	    user_list_cache.invalidate(ctx.session.user.id);
	    return res;
    }),
    deleteList: protectedProcedure
	.input(z.string().cuid())
	.mutation(async ({ctx:{prisma, session}, input:list_id})=>{
	    // if we don't check for existence beforehand we'll get told that we aren't authorized later
	    if(!await listExists(prisma, list_id)){
		// technically this should do nothing, practicall it seems to fix a bug
		user_list_cache.invalidate(session.user.id);
		list_item_cache.invalidate(list_id);
		return;
	    }
	    if(await isUserAuthorized(prisma,list_id,session.user.id)){
		// kinda sucks that all the users's lists need to be invalidated at once but oh well
		user_list_cache.invalidate(session.user.id);

		user_list_auth_cache.invalidate({user_id:session.user.id, list_id})
		list_item_cache.invalidate(list_id);
		await prisma.item.deleteMany({
		    where: {
			listId: list_id
		    }
		});
		await prisma.itemList.delete({
		    where: {
			id:list_id
		    }
		});
		return;
	    }
	    else throw new TRPCError({
		code:"UNAUTHORIZED",
		message: "not authorized to delete this list"
	    });
    }),
    getListName: protectedProcedure
	.input(z.object({
	    list_id: z.string().cuid()
	}))
	.query(async ({ctx:{prisma, session}, input:{list_id}})=>{
	    if(!await isUserAuthorized(prisma,list_id,session.user.id)){
		throw new TRPCError({
		    code:"UNAUTHORIZED",
		    message: "not authorized to view this list"
		});
	    }
	    //theoretically I could use a cache here but with the caches that exist that would be annoying
	    const list = await prisma.itemList.findUnique({
		where:{
		    id:list_id
		}
	    });
	    if(list === null){
		throw new TRPCError({
		    code:"NOT_FOUND",
		    message: "couldn't find list"
		});
	    }
	    return list.name;
	}),
    addItem: protectedProcedure
	.input(z.object({
	    list_id: z.string().cuid(),
	    item_content: z.string()
	}))
	.mutation(async ({ctx:{prisma,session}, input:{list_id,item_content}})=>{
	    if(!await isUserAuthorized(prisma,list_id,session.user.id)) return false;
	    list_item_cache.invalidate(list_id);
	    await prisma.itemList.update({
		where:{
		    id:list_id
		},
		data:{
		    items:{
			create:[{content:item_content, current_count:0, target_count:0}]
		    }
		}
	    });
	    list_item_cache.invalidate(list_id);
	    return true;
	}),
    getItems: protectedProcedure
	.input(z.object({list_id:z.string().cuid()}))
	.query(async ({ctx:{prisma,session}, input:{list_id}})=>{
	    // is the user supposed to be able to see this list?
	    if(!await isUserAuthorized(prisma,list_id,session.user.id)) return false;
	    const tmp = await list_item_cache.getAsync(list_id,async (list_id:string)=>{
		const list = prisma.itemList.findUnique({
		    where:{
			id:list_id
		    }
		});
		return await list.items();
	    });
	    // if something goes wrong we don't wanna cache that
	    if(tmp === null) list_item_cache.invalidate(list_id);
	    return tmp;
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
	    list_item_cache.invalidate(list_id);
	    await prisma.item.delete({
		where:{
		    id:item_id
		}
	    });
	    list_item_cache.invalidate(list_id);
	    return true;
	}),
    getLists: protectedProcedure.query(async ({ctx:{prisma, session}})=>{
	const val = await user_list_cache.getAsync(session.user.id,async (id)=>{
	    return await (prisma.user.findUnique({
		where:{
		    id
		}
	    }).lists());
	
	});
	if(val === null) user_list_cache.invalidate(session.user.id);
	return val;
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
		user_list_auth_cache
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

const user_list_auth_cache:ObjectCache<{user_id:string,list_id:string},boolean> = new ObjectCache();
async function isUserAuthorized(prisma:PrismaClient, list_id:string, user_id:string):Promise<boolean>{
    return user_list_auth_cache.getAsync({user_id,list_id}, async ({user_id,list_id})=>{
	const list = prisma.itemList.findUnique({
	    where:{
		id:list_id
	    }
	});
	return !!(await list.authorized())?.some(({id})=>id===user_id);

    });
}
async function listExists(prisma:PrismaClient, list_id:string){
    const val = await prisma.itemList.findUnique({
	where:{
	    id:list_id
	}
    });
    return val!==null;
}
export type ItemListRouter = typeof itemListRouter;
// use this function in an admin dashboard if this scales sufficiently where the memory leaks in these caches become a problem
export function clear_caches(){
    user_list_cache.clear();
    list_item_cache.clear();
    user_list_auth_cache.clear();
}
