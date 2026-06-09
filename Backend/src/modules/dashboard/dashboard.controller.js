import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { dashboardService } from './dashboard.service.js';

export const getMetrics = asyncHandler(async (req, res) => {
  const metrics = await dashboardService.getMetrics();
  return successResponse(res, { message: 'Dashboard metrics retrieved', data: metrics });
});

export const getRecentOrders = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 5;
  const orders = await dashboardService.getRecentOrders(limit);
  return successResponse(res, { message: 'Recent orders retrieved', data: orders });
});
