/**
 * 犬API（グループ内）
 */
import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { dogs, groupMembers } from "../db/schema";
import { requireAuth } from "../middleware/auth";

const createDogSchema = z.object({
  name: z.string().min(1).max(100),
  breed: z.string().max(100).optional(),
  birthday: z.string().max(20).optional(),
  iconUrl: z.string().max(500).optional(),
});

const updateDogSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  breed: z.string().max(100).optional().nullable(),
  birthday: z.string().max(20).optional().nullable(),
  iconUrl: z.string().max(500).optional().nullable(),
});

type DogsEnv = {
  Bindings: { DB: D1Database };
  Variables: { userId: string };
};

async function checkGroupMember(
  db: ReturnType<typeof drizzle>,
  groupId: string,
  userId: string
): Promise<boolean> {
  const [member] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return !!member;
}

export function createDogsApp() {
  return new Hono<DogsEnv>()
    .use("/*", requireAuth)
    .get("/", async (c) => {
    const groupId = c.req.param("groupId");
    if (!groupId) return c.json({ error: "Bad request" }, 400);
    const userId = c.get("userId");
    const db = drizzle(c.env.DB);

    const ok = await checkGroupMember(db, groupId, userId);
    if (!ok) return c.json({ error: "Forbidden" }, 403);

    const list = await db.select().from(dogs).where(eq(dogs.groupId, groupId));

    return c.json({
      dogs: list.map((d) => ({
        id: d.id,
        groupId: d.groupId,
        name: d.name,
        breed: d.breed,
        birthday: d.birthday,
        iconUrl: d.iconUrl,
        createdAt: d.createdAt,
      })),
    });
  })
  .post("/", zValidator("json", createDogSchema), async (c) => {
    const groupId = c.req.param("groupId");
    if (!groupId) return c.json({ error: "Bad request" }, 400);
    const userId = c.get("userId");
    const { name, breed, birthday, iconUrl } = c.req.valid("json");
    const db = drizzle(c.env.DB);

    const ok = await checkGroupMember(db, groupId, userId);
    if (!ok) return c.json({ error: "Forbidden" }, 403);

    const now = Math.floor(Date.now() / 1000);
    const id = uuidv7();

    await db.insert(dogs).values({
      id,
      groupId,
      name,
      breed: breed ?? null,
      birthday: birthday ?? null,
      iconUrl: iconUrl ?? null,
      createdAt: now,
    });

    const [created] = await db.select().from(dogs).where(eq(dogs.id, id)).limit(1);

    return c.json(
      {
        id: created!.id,
        groupId: created!.groupId,
        name: created!.name,
        breed: created!.breed,
        birthday: created!.birthday,
        iconUrl: created!.iconUrl,
        createdAt: created!.createdAt,
      },
      201
    );
  })
  .patch("/:dogId", zValidator("json", updateDogSchema), async (c) => {
    const groupId = c.req.param("groupId");
    const dogId = c.req.param("dogId");
    if (!groupId || !dogId) return c.json({ error: "Bad request" }, 400);
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = drizzle(c.env.DB);

    const ok = await checkGroupMember(db, groupId, userId);
    if (!ok) return c.json({ error: "Forbidden" }, 403);

    const [dog] = await db
      .select()
      .from(dogs)
      .where(and(eq(dogs.id, dogId), eq(dogs.groupId, groupId)))
      .limit(1);

    if (!dog) return c.json({ error: "Not found" }, 404);

    const updates: Partial<{
      name: string;
      breed: string | null;
      birthday: string | null;
      iconUrl: string | null;
    }> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.breed !== undefined) updates.breed = body.breed;
    if (body.birthday !== undefined) updates.birthday = body.birthday;
    if (body.iconUrl !== undefined) updates.iconUrl = body.iconUrl;

    if (Object.keys(updates).length === 0) {
      return c.json({
        id: dog.id,
        groupId: dog.groupId,
        name: dog.name,
        breed: dog.breed,
        birthday: dog.birthday,
        iconUrl: dog.iconUrl,
        createdAt: dog.createdAt,
      });
    }

    await db.update(dogs).set(updates).where(eq(dogs.id, dogId));

    const [updated] = await db.select().from(dogs).where(eq(dogs.id, dogId)).limit(1);

    return c.json({
      id: updated!.id,
      groupId: updated!.groupId,
      name: updated!.name,
      breed: updated!.breed,
      birthday: updated!.birthday,
      iconUrl: updated!.iconUrl,
      createdAt: updated!.createdAt,
    });
  });
}
