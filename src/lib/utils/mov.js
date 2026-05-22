/**
 * Minimum Order Value (MOV) Configuration
 * ----------------------------------------
 * Update these values to change MOV rules system-wide without code changes.
 *
 * MOV is evaluated against the Grand Total (subtotal + GST, before delivery charge).
 * If grandTotal < MOV_AMOUNT and user agrees → MOV_DELIVERY_CHARGE is appended to order.
 */

export const MOV_AMOUNT = 3500;          // INR — minimum grand total (incl. GST)
export const MOV_DELIVERY_CHARGE = 250;  // INR — extra delivery charge for below-MOV orders
