import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { storefrontService } from './storefront.service.js';

export const getPublicStorefront = asyncHandler(async (req, res) => {
  const content = await storefrontService.getPublic();
  return successResponse(res, { message: 'Storefront content retrieved', data: content });
});

export const getAdminStorefront = asyncHandler(async (req, res) => {
  const content = await storefrontService.getAdmin();
  return successResponse(res, { message: 'Admin storefront content retrieved', data: content });
});

export const updateStorefront = asyncHandler(async (req, res) => {
  const content = await storefrontService.update(req.body, req.user._id.toString());
  return successResponse(res, { message: 'Storefront content updated', data: content });
});

export const resetStorefront = asyncHandler(async (req, res) => {
  const content = await storefrontService.resetDefaults(req.user._id.toString());
  return successResponse(res, { message: 'Storefront content reset to defaults', data: content });
});
