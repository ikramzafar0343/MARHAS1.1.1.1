import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { orderService } from './order.service.js';

export const checkout = asyncHandler(async (req, res) => {
  const userId = req.user?._id ?? null;
  const order = await orderService.checkout(req.body, userId);

  return successResponse(res, {
    message: 'Order placed successfully',
    data: order,
    statusCode: 201
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const { orders, pagination } = await orderService.getMyOrders(req.user._id, req.query);

  return successResponse(res, {
    message: 'Orders retrieved',
    data: orders,
    meta: { pagination }
  });
});

export const getOrderByNumber = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderByNumber(req.params.orderNumber, req.user ?? null);

  return successResponse(res, {
    message: 'Order retrieved',
    data: order
  });
});

export const listAdminOrders = asyncHandler(async (req, res) => {
  const { orders, pagination } = await orderService.listAdminOrders(req.query);

  return successResponse(res, {
    message: 'Orders retrieved',
    data: orders,
    meta: { pagination }
  });
});

export const getAdminOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getAdminOrderById(req.params.id);

  return successResponse(res, {
    message: 'Order retrieved',
    data: order
  });
});

export const updateAdminOrder = asyncHandler(async (req, res) => {
  const order = await orderService.updateAdminOrder(
    req.params.id,
    req.body,
    req.user._id.toString()
  );

  return successResponse(res, {
    message: 'Order updated',
    data: order
  });
});

export const updateAdminOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.user._id.toString()
  );

  return successResponse(res, {
    message: 'Order status updated',
    data: order
  });
});

export const cancelAdminOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(
    req.params.id,
    req.body.reason,
    req.user._id.toString()
  );

  return successResponse(res, {
    message: 'Order cancelled',
    data: order
  });
});
