import { apiFetch } from "./client";
export type SalaryItemPayload = {
  id?: number;
  monto: number;
  dia_cobro: number;
  activo: boolean;
};

export type FinancialSettingsUpsertPayload = {
  pct_gastos: number;
  pct_ahorro: number;
  pct_inversion: number;
  sueldos: SalaryItemPayload[];
};

export type SalaryItemResponse = {
  id: number;
  monto: number;
  dia_cobro: number;
  activo: boolean;
};

export type FinancialSettingsResponse = {
  user_id: number;
  pct_gastos: number;
  pct_ahorro: number;
  pct_inversion: number;
  ineco_fijo_mensual: number;
  sueldos: SalaryItemResponse[];
};

export type FinancialBalanceResponse = {
  user_id: number;
  capital_ahorrado: number;
  capital_invertido: number;
  capital_gastos: number;
  capital_ineco: number;
  last_auto_calc_date: string | null;
  last_ineco_month: string | null;
};

export type FinancialMovementResponse = {
  user_id: number;
  processing_date: string;
  simulate_payday: boolean;
  processed_salaries: number;
  processed_amount: number;
  applied_ineco: boolean;
  ineco_added: number;
  balance: FinancialBalanceResponse;
};

export type FinancialMovementPayload = {
  processing_date?: string;
};

export type LiquidityRange = "week" | "month" | "year" | "all";
export type FinancialCapitalKey =
  | "CAPITAL_AHORRADO"
  | "CAPITAL_INVERTIDO"
  | "CAPITAL_GASTOS"
  | "CAPITAL_INECO";

export type LiquiditySeriesPoint = {
  transaction_id: number | null;
  timestamp: string;
  total_liquido: number;
  tipo: string | null;
  monto: number | null;
};

export type LiquiditySeriesResponse = {
  range: LiquidityRange;
  points: LiquiditySeriesPoint[];
};

export type CapitalSeriesResponse = {
  range: LiquidityRange;
  capital: FinancialCapitalKey;
  points: LiquiditySeriesPoint[];
};

export type FinancialTransaction = {
  id: number;
  tipo: string;
  categoria: string;
  monto: number;
  descripcion: string | null;
  fecha_operacion: string;
  created_at: string;
};

type FinancialTransactionsResponse = {
  items: FinancialTransaction[];
};

export type FinancialTransactionDetail = {
  id: number;
  tipo: string;
  categoria: string;
  monto: number;
  descripcion: string | null;
  fecha_operacion: string;
  created_at: string;
  detail: Record<string, string | number | null>;
};

export type FinancialTransactionDeleteResponse = {
  transaction_id: number;
  message: string;
  balance: FinancialBalanceResponse;
};

export type FinancialTransactionCreatePayload = {
  tipo: string;
  categoria: string;
  monto: number;
  descripcion?: string;
  fecha_operacion?: string;
};

export type FinancialExpenseCreatePayload = {
  categoria: string;
  nombre?: string;
  precio: number;
  fecha: string;
  tipo: string;
  forma_pago: string;
  tipo_transporte?: string;
  ubicacion?: string;
};

export type FinancialExpenseCreateResponse = {
  expense_id: number;
  message: string;
  balance: FinancialBalanceResponse;
  transaction: FinancialTransaction;
};

export type FinancialIncomeCreatePayload = {
  ingresar_en: string;
  monto: number;
  descripcion: string;
  metodo: string;
  nombre_remitente: string;
};

export type FinancialIncomeCreateResponse = {
  income_id: number;
  message: string;
  balance: FinancialBalanceResponse;
  transaction: FinancialTransaction;
};

export type FinancialTransferCreatePayload = {
  capital_saliente: string;
  capital_entrante: string;
  monto: number;
};

export type FinancialTransferCreateResponse = {
  transfer_id: number;
  message: string;
  balance: FinancialBalanceResponse;
  transaction: FinancialTransaction;
};

async function parseApiError(response: Response): Promise<Error> {
  const errorData = (await response.json().catch(() => null)) as { detail?: string } | null;
  return new Error(errorData?.detail ?? "Error en la llamada a la API.");
}

export async function getFinancialSettings(userId: number): Promise<FinancialSettingsResponse> {
  const response = await apiFetch(`/financial-settings/${userId}`);

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as FinancialSettingsResponse;
}

export async function saveFinancialSettings(
  userId: number,
  payload: FinancialSettingsUpsertPayload,
): Promise<FinancialSettingsResponse> {
  const response = await apiFetch(`/financial-settings/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as FinancialSettingsResponse;
}

export async function getFinancialBalance(userId: number): Promise<FinancialBalanceResponse> {
  const response = await apiFetch(`/financial-settings/${userId}/balance`);

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as FinancialBalanceResponse;
}

async function postFinancialMovement(
  path: string,
  payload?: FinancialMovementPayload,
): Promise<FinancialMovementResponse> {
  const response = await apiFetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as FinancialMovementResponse;
}

export async function processDailyFinancialMovements(
  userId: number,
  payload?: FinancialMovementPayload,
): Promise<FinancialMovementResponse> {
  return postFinancialMovement(`/financial-settings/${userId}/process-daily`, payload);
}

export async function simulatePaydayFinancialMovements(
  userId: number,
  payload?: FinancialMovementPayload,
): Promise<FinancialMovementResponse> {
  return postFinancialMovement(`/financial-settings/${userId}/simulate-payday`, payload);
}

export async function getFinancialLiquiditySeries(
  userId: number,
  range: LiquidityRange = "month",
): Promise<LiquiditySeriesResponse> {
  const response = await apiFetch(`/financial-settings/${userId}/liquidity-series?range=${range}`);

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as LiquiditySeriesResponse;
}

export async function getFinancialTransactions(
  userId: number,
  options: { limit?: number; offset?: number; capital?: FinancialCapitalKey } = {},
): Promise<FinancialTransaction[]> {
  const search = new URLSearchParams();
  if (options.limit) {
    search.set("limit", String(options.limit));
  }
  if (options.offset) {
    search.set("offset", String(options.offset));
  }
  if (options.capital) {
    search.set("capital", options.capital);
  }

  const suffix = search.toString() ? `?${search.toString()}` : "";
  const response = await apiFetch(`/financial-settings/${userId}/transactions${suffix}`);

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const data = (await response.json()) as FinancialTransactionsResponse;
  return data.items;
}

export async function getFinancialCapitalSeries(
  userId: number,
  capital: FinancialCapitalKey,
  range: LiquidityRange = "month",
): Promise<CapitalSeriesResponse> {
  const response = await apiFetch(
    `/financial-settings/${userId}/capital-series?capital=${capital}&range=${range}`,
  );

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as CapitalSeriesResponse;
}

export async function getFinancialTransactionDetail(
  userId: number,
  transactionId: number,
): Promise<FinancialTransactionDetail> {
  const response = await apiFetch(`/financial-settings/${userId}/transactions/${transactionId}`);

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as FinancialTransactionDetail;
}

export async function deleteFinancialTransaction(
  userId: number,
  transactionId: number,
): Promise<FinancialTransactionDeleteResponse> {
  const response = await apiFetch(`/financial-settings/${userId}/transactions/${transactionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as FinancialTransactionDeleteResponse;
}

export async function createFinancialTransaction(
  userId: number,
  payload: FinancialTransactionCreatePayload,
): Promise<FinancialTransaction> {
  const response = await apiFetch(`/financial-settings/${userId}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as FinancialTransaction;
}

export async function createFinancialExpense(
  userId: number,
  payload: FinancialExpenseCreatePayload,
): Promise<FinancialExpenseCreateResponse> {
  const response = await apiFetch(`/financial-settings/${userId}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as FinancialExpenseCreateResponse;
}

export async function createFinancialIncome(
  userId: number,
  payload: FinancialIncomeCreatePayload,
): Promise<FinancialIncomeCreateResponse> {
  const response = await apiFetch(`/financial-settings/${userId}/incomes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as FinancialIncomeCreateResponse;
}

export async function createFinancialTransfer(
  userId: number,
  payload: FinancialTransferCreatePayload,
): Promise<FinancialTransferCreateResponse> {
  const response = await apiFetch(`/financial-settings/${userId}/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as FinancialTransferCreateResponse;
}
