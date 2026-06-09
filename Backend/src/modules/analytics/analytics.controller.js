import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { analyticsService } from './analytics.service.js';

export const getKpis = asyncHandler(async (req, res) => {
  const kpis = await analyticsService.getKpis(req.query.period);
  return successResponse(res, { message: 'Analytics KPIs retrieved', data: kpis });
});

export const getRevenueChart = asyncHandler(async (req, res) => {
  const chart = await analyticsService.getRevenueChart(req.query.period);
  return successResponse(res, { message: 'Revenue chart retrieved', data: chart });
});

export const getOrdersChart = asyncHandler(async (req, res) => {
  const chart = await analyticsService.getOrdersChart(req.query.period);
  return successResponse(res, { message: 'Orders chart retrieved', data: chart });
});

export const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const categories = await analyticsService.getCategoryBreakdown(req.query.period);
  return successResponse(res, { message: 'Category breakdown retrieved', data: categories });
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const products = await analyticsService.getTopProducts(req.query.period, req.query.limit);
  return successResponse(res, { message: 'Top products retrieved', data: products });
});
