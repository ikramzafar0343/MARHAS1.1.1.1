import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { productService } from './product.service.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { products, pagination } = await productService.listProducts(req.query);
  return successResponse(res, {
    message: 'Products retrieved',
    data: products,
    meta: { pagination }
  });
});

export const getBestSellers = asyncHandler(async (req, res) => {
  const { products, pagination } = await productService.getBestSellers(req.query);
  return successResponse(res, {
    message: 'Best sellers retrieved',
    data: products,
    meta: { pagination }
  });
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { products, pagination } = await productService.searchProducts(req.query);
  return successResponse(res, {
    message: 'Search results retrieved',
    data: products,
    meta: { pagination }
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  return successResponse(res, { message: 'Product retrieved', data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(
    req.body,
    req.files || [],
    req.user._id.toString()
  );
  return successResponse(res, {
    message: 'Product created',
    data: product,
    statusCode: 201
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.body,
    req.files || [],
    req.user._id.toString()
  );
  return successResponse(res, { message: 'Product updated', data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const data = await productService.deleteProduct(req.params.id, req.user._id.toString());
  return successResponse(res, { message: 'Product deleted', data });
});
