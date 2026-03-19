import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

type ProjectionCtx = QueryCtx | MutationCtx;

export type MemberProfile = {
  memberId: Id<"members">;
  userId: Id<"users">;
  name: string;
  image?: string;
  role: Doc<"members">["role"];
};

export async function getMemberProfile(
  ctx: ProjectionCtx,
  memberId: Id<"members">
): Promise<MemberProfile | null> {
  const member = await ctx.db.get(memberId);
  if (!member) {
    return null;
  }

  const user = await ctx.db.get(member.userId);

  return {
    memberId: member._id,
    userId: member.userId,
    name: user?.name ?? "Unknown",
    image: user?.image,
    role: member.role,
  };
}
