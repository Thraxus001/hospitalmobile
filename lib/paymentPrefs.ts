import { storage } from "./storage";
import type { UserPaymentPref } from "./types";

export const SAVED_CARD_PREF_KEY = "saved_card_pref";

export const METHOD_LABELS: Record<string, string> = {
  mpesa: "M-Pesa",
  card: "Card / Bank",
  insurance: "Insurance",
};

export const DEFAULT_INSURERS = [
  "AAR Insurance",
  "Jubilee Health",
  "CIC Insurance",
  "Madison Health",
  "APA Insurance",
  "Britam Health",
  "Sanlam Health",
  "Liberty Health",
];

export const ALLOWED_BANKS = [
  "Equity Bank",
  "KCB Bank (Kenya Commercial Bank)",
  "Co-operative Bank of Kenya",
  "NCBA Bank",
  "Standard Chartered Bank",
  "Absa Bank Kenya",
  "Stanbic Bank Kenya",
  "Diamond Trust Bank (DTB)",
  "I&M Bank",
  "Family Bank",
];

export type CardOrBankType = "card" | "bank";

export interface SavedCardPref {
  cardOrBankType: CardOrBankType;
  cardHolder: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
}

export interface SavedPrefItem {
  key: string;
  label: string;
  value: string;
  isDefault?: boolean;
}

export function detectCardBrand(num: string): string {
  const clean = num.replace(/\D/g, "");
  if (clean.startsWith("4")) return "VISA";
  if (/^5[1-5]/.test(clean)) return "MASTERCARD";
  if (/^3[47]/.test(clean)) return "AMEX";
  return "CARD";
}

export function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

export async function loadSavedCardPref(): Promise<SavedCardPref | null> {
  const raw = await storage.getItem(SAVED_CARD_PREF_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    return {
      cardOrBankType: p.cardOrBankType === "bank" ? "bank" : "card",
      cardHolder: p.cardHolder ?? "",
      cardNumber: p.cardNumber ?? "",
      cardExpiry: p.cardExpiry ?? "",
      cardCvv: p.cardCvv ?? "",
      bankName: p.bankName ?? "",
      bankAccount: p.bankAccount ?? "",
      bankHolder: p.bankHolder ?? "",
    };
  } catch {
    return null;
  }
}

export async function saveCardPref(pref: SavedCardPref): Promise<void> {
  await storage.setItem(SAVED_CARD_PREF_KEY, JSON.stringify(pref));
}

export function buildSavedPrefItems(
  pref: UserPaymentPref | null,
  cardPref: SavedCardPref | null
): SavedPrefItem[] {
  const items: SavedPrefItem[] = [];
  const preferred = pref?.preferred_method ?? null;

  if (preferred) {
    let methodText = METHOD_LABELS[preferred] ?? preferred;
    if (preferred === "card") {
      methodText =
        cardPref?.cardOrBankType === "bank"
          ? "Bank Account (Card / Bank)"
          : "Debit / Credit Card (Card / Bank)";
    } else if (preferred === "bank") {
      methodText = "Bank Account";
    }
    items.push({ key: "preferred", label: "Preferred method", value: methodText });
  }

  if (pref?.mpesa_phone?.trim()) {
    items.push({
      key: "mpesa",
      label: "M-Pesa number",
      value: pref.mpesa_phone.trim(),
      isDefault: preferred === "mpesa",
    });
  }

  const cardDigits = (cardPref?.cardNumber ?? "").replace(/\D/g, "");
  if (cardDigits.length >= 4) {
    const brand = detectCardBrand(cardDigits);
    const parts = [
      `${brand} •••• ${cardDigits.slice(-4)}`,
      cardPref?.cardHolder?.trim(),
      cardPref?.cardExpiry?.trim() ? `Exp ${cardPref.cardExpiry.trim()}` : "",
    ].filter(Boolean);
    items.push({
      key: "card",
      label: "Debit / Credit Card",
      value: parts.join(" · "),
      isDefault: preferred === "card" && cardPref?.cardOrBankType !== "bank",
    });
  }

  if (cardPref?.bankName?.trim() || cardPref?.bankAccount?.trim()) {
    const acctDigits = (cardPref.bankAccount ?? "").replace(/\D/g, "");
    const acctText =
      acctDigits.length > 4
        ? `A/C •••• ${acctDigits.slice(-4)}`
        : cardPref.bankAccount?.trim()
        ? `A/C ${cardPref.bankAccount.trim()}`
        : "";
    const parts = [
      cardPref.bankName?.trim(),
      acctText,
      cardPref.bankHolder?.trim(),
    ].filter(Boolean);
    items.push({
      key: "bank",
      label: "Bank Account",
      value: parts.join(" · "),
      isDefault:
        (preferred === "card" && cardPref?.cardOrBankType === "bank") ||
        preferred === "bank",
    });
  }

  if (pref?.insurance_provider?.trim() || pref?.insurance_member_no?.trim()) {
    const parts = [
      pref.insurance_provider?.trim(),
      pref.insurance_member_no?.trim()
        ? `Member #${pref.insurance_member_no.trim()}`
        : "",
    ].filter(Boolean);
    items.push({
      key: "insurance",
      label: "Insurance",
      value: parts.join(" · "),
      isDefault: preferred === "insurance",
    });
  }

  return items;
}
