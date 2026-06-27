/**
 * Current standard PPN (VAT) rate, snapshotted onto each invoice at creation
 * time. Changing this constant only affects invoices created from now on —
 * it must never be read dynamically when computing totals for existing
 * invoices, since their legally applicable rate is whatever was in effect
 * when they were issued.
 */
export const CURRENT_VAT_RATE = 0.11;
