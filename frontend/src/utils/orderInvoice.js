import {
  formatOrderDate,
  formatPaymentMethod,
  formatPrice,
  resolveOrderItems
} from './cart';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildInvoiceHtml = (order, resolvedItems) => {
  const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const shipping = order.shippingFee ?? 0;
  const tax = order.taxAmount ?? 0;
  const taxLabel = order.taxLabel || 'GST';

  const itemRows = resolvedItems
    .map(
      ({ item, product }) => `
        <tr>
          <td>
            <strong>${escapeHtml(product.name)}</strong><br />
            <span class="meta">${escapeHtml([item.color, item.size ? `Size ${item.size}` : null, `Qty ${item.quantity}`].filter(Boolean).join(' · '))}</span>
          </td>
          <td class="amount">${escapeHtml(formatPrice(product.price * item.quantity))}</td>
        </tr>
      `
    )
    .join('');

  const taxRow =
    tax > 0
      ? `<tr><td>${escapeHtml(taxLabel)}${order.taxRate ? ` (${order.taxRate}%)` : ''}</td><td class="amount">${escapeHtml(formatPrice(tax))}</td></tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>MARHAS Invoice ${escapeHtml(order.id)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #1f1f1f; margin: 32px; }
    h1 { font-size: 28px; letter-spacing: 0.35em; font-weight: 400; margin: 0 0 8px; }
    .sub { color: #8a8278; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 28px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #8a8278; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 10px 0; border-bottom: 1px solid #ece4da; text-align: left; vertical-align: top; }
    th:last-child, td.amount { text-align: right; white-space: nowrap; }
    .meta { font-size: 12px; color: #8a8278; }
    .totals { margin-top: 16px; width: 100%; max-width: 320px; margin-left: auto; }
    .totals td { border-bottom: none; padding: 6px 0; }
    .totals .final td { font-weight: 600; padding-top: 12px; border-top: 1px solid #1f1f1f; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>MARHAS</h1>
  <p class="sub">Tax Invoice</p>
  <div class="grid">
    <div>
      <p class="label">Invoice</p>
      <p><strong>${escapeHtml(order.id)}</strong></p>
      <p>${escapeHtml(formatOrderDate(order.createdAt))}</p>
      <p>${escapeHtml(formatPaymentMethod(order.paymentMethod))}</p>
    </div>
    <div>
      <p class="label">Bill To</p>
      <p>${escapeHtml(order.fullName || order.customer)}</p>
      <p>${escapeHtml(order.email)}</p>
      <p>${escapeHtml(order.phone)}</p>
    </div>
  </div>
  <div>
    <p class="label">Ship To</p>
    <p>${escapeHtml(order.address)}</p>
    <p>${escapeHtml([order.city, order.postalCode].filter(Boolean).join(', '))}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <table class="totals">
    <tr><td>Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})</td><td class="amount">${escapeHtml(formatPrice(order.subtotal))}</td></tr>
    <tr><td>Shipping</td><td class="amount">${shipping === 0 ? 'Free' : escapeHtml(formatPrice(shipping))}</td></tr>
    ${taxRow}
    <tr class="final"><td>Total Paid</td><td class="amount">${escapeHtml(formatPrice(order.total))}</td></tr>
  </table>
</body>
</html>`;
};

export const downloadOrderInvoice = (order) => {
  if (!order) {
    return;
  }

  const resolvedItems = resolveOrderItems(order.items || []);

  if (!resolvedItems.length) {
    return;
  }

  const html = buildInvoiceHtml(order, resolvedItems);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank', 'noopener,noreferrer');

  if (!printWindow) {
    URL.revokeObjectURL(url);
    return;
  }

  printWindow.addEventListener('load', () => {
    printWindow.focus();
    printWindow.print();
    URL.revokeObjectURL(url);
  });
};
