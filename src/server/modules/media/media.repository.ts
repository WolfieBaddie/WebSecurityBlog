import { db } from "@/server/db/client";
import { assets } from "../../db/schema"
import {eq, desc} from "drizzle-orm"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type MediaAsset = InferSelectModel<typeof assets>;
export type NewMediaAsset = InferInsertModel<typeof assets>;


export class MediaRepository
{
    async create(data: NewMediaAsset)
    {
        const [created] =  await db.insert(assets).values(data).returning();
        return created;
    }

    async findById(id: string): Promise<MediaAsset | null> 
    {
        const result = await db.query.assets.findFirst(
            {
                where: eq(assets.id, id)
            });
            
        return result || null; 
    } 

    async findByDriveFileId(driveFileId: string): Promise <MediaAsset | null>
    {
        const result = await db.query.assets.findFirst({
        where: eq(assets.driveFileId, driveFileId),
        });
        return result || null;
    }

    async listRecent(limit: number = 50): Promise<MediaAsset[]>
    {
        return db.select().from(assets).orderBy(desc(assets.createdAt)).limit(limit); 
    }

    async delete(id: string): Promise<MediaAsset | null>
    {
        const [deleted] = await db.delete(assets).where(eq(assets.id, id)).returning();
        return deleted || null;
    }
}

export const mediaRepository = new MediaRepository();