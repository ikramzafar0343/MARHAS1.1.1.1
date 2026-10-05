/**
 * Map Prisma rows to API entities.
 * Exposes both `id` and `_id` so existing controllers/services keep working.
 */
export const toEntity = (row) => {
  if (!row) return null;
  const { searchVector: _sv, ...rest } = row;
  const id = rest.id;
  return {
    ...rest,
    id,
    _id: id
  };
};

export const toEntities = (rows) => rows.map(toEntity);

export const decimalToNumber = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'number') return value;
  return Number(value);
};

export const normalizeProduct = (row) => {
  const entity = toEntity(row);
  if (!entity) return null;

  const price = decimalToNumber(entity.price);
  const discount = decimalToNumber(entity.discount) || 0;
  const discountType = entity.discountType;
  let effectivePrice = price;
  if (discount > 0) {
    effectivePrice =
      discountType === 'fixed'
        ? Math.max(0, price - discount)
        : Math.max(0, price - (price * discount) / 100);
  }

  let inventoryStatus = 'in-stock';
  if (entity.stock <= 0) inventoryStatus = 'out-of-stock';
  else if (entity.stock <= entity.lowStockThreshold) inventoryStatus = 'low-stock';

  return {
    ...entity,
    price,
    originalPrice: decimalToNumber(entity.originalPrice),
    discount,
    rating: decimalToNumber(entity.rating),
    effectivePrice,
    inventoryStatus,
    wishlist: undefined
  };
};

export const normalizeOrder = (row) => {
  const entity = toEntity(row);
  if (!entity) return null;

  const items = (entity.items || []).map((item) => ({
    ...item,
    id: item.id,
    _id: item.id,
    price: decimalToNumber(item.price),
    productId: item.product
      ? { ...toEntity(item.product), price: decimalToNumber(item.product.price) }
      : item.productId
  }));

  return {
    ...entity,
    subtotal: decimalToNumber(entity.subtotal),
    shippingFee: decimalToNumber(entity.shippingFee),
    taxAmount: decimalToNumber(entity.taxAmount),
    taxRate: decimalToNumber(entity.taxRate),
    total: decimalToNumber(entity.total),
    items,
    userId: entity.user ? toEntity(entity.user) : entity.userId
  };
};

export const notDeleted = { deletedAt: null };

export const softDeleteFilter = (includeDeleted = false) =>
  includeDeleted ? {} : notDeleted;
