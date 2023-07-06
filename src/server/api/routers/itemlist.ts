import {z} from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import {Prisma} from "@prisma/client";
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
	.input(z.string())
	.mutation(async ({ctx:{prisma, session}, input})=>{
	    console.log("LOG: ",input)
	    const list = prisma.itemList.findUnique({
		where: {
		    id:input,
		}
	    });
	    if((await list.authorized())?.some(({id})=>id===session.user.id)){
		await prisma.itemList.delete({
		    where: {
			id:input
		    }
		});
		return true;
	    }
	    else return false;
    })
});
export type itemListRouter = typeof itemListRouter;
