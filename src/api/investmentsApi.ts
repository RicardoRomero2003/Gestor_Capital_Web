import { apiFetch } from "./client";
export type WatchlistItem = {
  id: number;
  symbol: string;
  display_name: string | null;
  market: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WatchlistCreatePayload = {
  symbol: string;
  display_name?: string;
  market?: string;
};

type WatchlistResponse = {
  items: WatchlistItem[];
};

export type InvestmentOperationCreatePayload = {
  symbol: string;
  amount_eur: number;
  executed_at: string;
  fee_eur?: number;
  execution_price?: number;
};

export type InvestmentOperation = {
  id: number;
  symbol: string;
  operation_type: "BUY" | "SELL" | string;
  amount_eur: number;
  execution_price: number;
  quantity: number;
  fee_eur: number;
  executed_at_utc: string;
  realized_pnl_eur: number;
};

export type InvestmentPosition = {
  symbol: string;
  quantity: number;
  avg_price: number;
  invested_total_eur: number;
  current_price: number;
  market_value_eur: number;
  unrealized_pnl_eur: number;
  unrealized_pnl_pct: number;
  as_of_utc: string;
};

type PositionsResponse = {
  items: InvestmentPosition[];
};

export type InvestmentPerformanceRange = "week" | "month" | "year" | "all";

export type InvestmentPerformancePoint = {
  timestamp_utc: string;
  price: number;
  quantity: number;
  invested_eur: number;
  market_value_eur: number;
  pnl_eur: number;
  pnl_pct: number;
};

export type InvestmentPerformanceResponse = {
  symbol: string;
  range: InvestmentPerformanceRange;
  points: InvestmentPerformancePoint[];
};

export type InvestmentOperationCreateResponse = {
  operation: InvestmentOperation;
  position: InvestmentPosition;
};

async function parseApiError(response: Response): Promise<Error> {
  const errorData = (await response.json().catch(() => null)) as { detail?: string } | null;
  return new Error(errorData?.detail ?? "Error en la llamada a la API de inversiones.");
}

export async function getWatchlist(userId: number): Promise<WatchlistItem[]> {
  const response = await apiFetch(`/investments/${userId}/watchlist`);
  if (!response.ok) {
    throw await parseApiError(response);
  }
  const data = (await response.json()) as WatchlistResponse;
  return data.items;
}

export async function addWatchlistSymbol(
  userId: number,
  payload: WatchlistCreatePayload,
): Promise<WatchlistItem> {
  const response = await apiFetch(`/investments/${userId}/watchlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as WatchlistItem;
}

export async function removeWatchlistSymbol(userId: number, watchlistId: number): Promise<void> {
  const response = await apiFetch(`/investments/${userId}/watchlist/${watchlistId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
}

export async function createManualBuyOperation(
  userId: number,
  payload: InvestmentOperationCreatePayload,
): Promise<InvestmentOperationCreateResponse> {
  const response = await apiFetch(`/investments/${userId}/buy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as InvestmentOperationCreateResponse;
}

export async function createManualSellOperation(
  userId: number,
  payload: InvestmentOperationCreatePayload,
): Promise<InvestmentOperationCreateResponse> {
  const response = await apiFetch(`/investments/${userId}/sell`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as InvestmentOperationCreateResponse;
}

export async function getInvestmentPositions(userId: number): Promise<InvestmentPosition[]> {
  const response = await apiFetch(`/investments/${userId}/positions`);
  if (!response.ok) {
    throw await parseApiError(response);
  }
  const data = (await response.json()) as PositionsResponse;
  return data.items;
}

export async function getInvestmentPerformance(
  userId: number,
  symbol: string,
  range: InvestmentPerformanceRange = "month",
): Promise<InvestmentPerformanceResponse> {
  const query = new URLSearchParams({
    symbol: symbol.trim().toUpperCase(),
    range,
  });
  const response = await apiFetch(`/investments/${userId}/performance?${query.toString()}`);
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as InvestmentPerformanceResponse;
}
