import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { inventoryService } from './inventory.service.js';

export const listInventory = asyncHandler(async (req, res) => {
  const result = await inventoryService.listInventory(req.query);
  return successResponse(res, {
    message: 'Inventory retrieved',
    data: result.items,
    meta: { pagination: result.pagination }
  });
});

export const getInventoryItem = asyncHandler(async (req, res) => {
  const result = await inventoryService.getInventoryItem(req.params.id);
  return successResponse(res, { message: 'Inventory item retrieved', data: result });
});

export const updateInventory = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateInventory(req.params.id, req.body, req.user._id.toString());
  return successResponse(res, { message: 'Inventory item updated', data: item });
});

export const updateStock = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateStock(
    req.params.id,
    req.body.stock,
    req.user._id.toString()
  );
  return successResponse(res, { message: 'Stock updated', data: item });
});

export const restockItem = asyncHandler(async (req, res) => {
  const result = await inventoryService.restock(
    req.params.id,
    req.body.quantity,
    req.body.note,
    req.user._id.toString()
  );
  return successResponse(res, { message: 'Product restocked', data: result });
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const result = await inventoryService.deleteInventory(req.params.id, req.user._id.toString());
  return successResponse(res, { message: 'Inventory item deleted', data: result });
});
