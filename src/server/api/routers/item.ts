import {z} from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
export const itemRouter = createTRPCRouter({
    updateContent:protectedProcedure
	.input(z.object({item_id:z.string().cuid(), content:z.string()}))
	.mutation(async ({ctx:{prisma},input:{item_id, content}})=>{
	    await prisma.item.update({
		where:{
		    id:item_id
		},
		data:{
		    content
		}
	    });
	})
});
export type ItemRouter = typeof itemRouter;
