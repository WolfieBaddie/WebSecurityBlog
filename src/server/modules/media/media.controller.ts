import type { Context } from 'hono';
import { mediaService } from './media.service';
import { responder, AppError } from '../../common/response';

export class MediaController {
  async upload(c: Context) {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      throw AppError.badRequest('No valid file supplied under form field "file"');
    }

    const altText = typeof body['altText'] === 'string' ? body['altText'] : undefined;
    const caption = typeof body['caption'] === 'string' ? body['caption'] : undefined;
    // Default admin UUID until full session RBAC is tied in
    const uploaderId = (body['uploaderId'] as string) || '00000000-0000-0000-0000-000000000000';

    const asset = await mediaService.processAndUploadImage(file, uploaderId, altText, caption);
    return responder.created(c, asset);
  }

  async list(c: Context) {
    const assets = await mediaService.getRecentAssets();
    return responder.success(c, assets, 200, { total: assets.length });
  }
}

export const mediaController = new MediaController();