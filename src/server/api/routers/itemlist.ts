import {z} from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import type {PrismaClient} from "@prisma/client";
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
	    return true;
	}),
    getItems: protectedProcedure
	.input(z.string().cuid())
	.query(async ({ctx:{prisma,session}, input:list_id})=>{
	    if(!await isUserAuthorized(prisma,list_id,session.user.id)) return false;
	    const list = prisma.itemList.findUnique({
		where:{
		    id:list_id
		}
	    });

	    return await list.items();
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
	})
});

async function isUserAuthorized(prisma:PrismaClient, list_id:string, user_id:string):Promise<boolean>{
	const list = prisma.itemList.findUnique({
	    where: {
		id:list_id,
	    }
	});
	return !!(await list.authorized())?.some(({id})=>id===user_id);
}
export type ItemListRouter = typeof itemListRouter;
