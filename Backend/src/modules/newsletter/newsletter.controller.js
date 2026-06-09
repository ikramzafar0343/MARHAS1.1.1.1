import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { newsletterService } from './newsletter.service.js';

export const subscribe = asyncHandler(async (req, res) => {
  const subscriber = await newsletterService.subscribe(req.body.email, req.body.source);
  return successResponse(res, {
    message: 'Successfully subscribed to newsletter',
    data: subscriber,
    statusCode: 201
  });
});
