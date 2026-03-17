import { useEffect, useState } from "react";
import {
  createManualBuyOperation,
  createManualSellOperation,
  type InvestmentOperationCreatePayload,
} from "../api/investmentsApi";
import { ExecutionPricePopup } from "./ExecutionPricePopup";

type ManualInvestmentFormProps = {
  userId: number;
  symbols: string[];
  preferredSymbol: string;
  onOperationSaved: (symbol: string) => Promise<void> | void;
};

export function ManualInvestmentForm({
  userId,
  symbols,
  preferredSymbol,
  onOperationSaved,
}: ManualInvestmentFormProps) {
  const [operationSymbol, setOperationSymbol] = useState("");
  const [operationType, setOperationType] = useState<"BUY" | "SELL">("BUY");
  const [operationAmount, setOperationAmount] = useState("");
  const [operationFee, setOperationFee] = useState("");
  const [operationDateTimeText, setOperationDateTimeText] = useState(getDefaultDateTimeText());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingManualPriceOperation, setPendingManualPriceOperation] = useState<PendingOperation | null>(null);
  const [isExecutionPricePopupOpen, setIsExecutionPricePopupOpen] = useState(false);

  useEffect(() => {
    if (preferredSymbol && symbols.includes(preferredSymbol)) {
      setOperationSymbol(preferredSymbol);
      return;
    }

    if (symbols.length === 0) {
      setOperationSymbol("");
      return;
    }

    if (!operationSymbol || !symbols.includes(operationSymbol)) {
      setOperationSymbol(symbols[0]);
    }
  }, [preferredSymbol, symbols, operationSymbol]);

  const handleSubmit = async () => {
    const normalizedSymbol = operationSymbol.trim().toUpperCase();
    if (!normalizedSymbol) {
      setErrorMessage("Selecciona un simbolo para la operacion.");
      return;
    }

    const parsedAmount = Number(operationAmount.replace(",", "."));
    const parsedFee = operationFee.trim() ? Number(operationFee.replace(",", ".")) : 0;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Introduce un monto valido mayor que 0.");
      return;
    }
    if (!Number.isFinite(parsedFee) || parsedFee < 0) {
      setErrorMessage("La comision debe ser 0 o mayor.");
      return;
    }

    const executedAtIso = parseDateTimeTextToIso(operationDateTimeText);
    if (!executedAtIso) {
      setErrorMessage("Fecha y hora invalidas. Usa formato DD/MM/YYYY, HH:mm.");
      return;
    }

    const pendingOperation: PendingOperation = {
      symbol: normalizedSymbol,
      operationType,
      amount_eur: parsedAmount,
      fee_eur: parsedFee,
      executed_at: executedAtIso,
    };

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await submitOperation(pendingOperation);
    } catch (error) {
      if (shouldRequestManualExecutionPrice(error)) {
        setPendingManualPriceOperation(pendingOperation);
        setIsExecutionPricePopupOpen(true);
        setErrorMessage("");
      } else {
        setErrorMessage(error instanceof Error ? error.message : "No se pudo registrar la operacion.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOperation = async (
    operation: PendingOperation,
    executionPrice: number | null = null,
  ) => {
    const payload: InvestmentOperationCreatePayload = {
      symbol: operation.symbol,
      amount_eur: operation.amount_eur,
      fee_eur: operation.fee_eur,
      executed_at: operation.executed_at,
      execution_price: executionPrice ?? undefined,
    };

    if (operation.operationType === "BUY") {
      await createManualBuyOperation(userId, payload);
    } else {
      await createManualSellOperation(userId, payload);
    }

    await onOperationSaved(operation.symbol);
    setOperationAmount("");
    setOperationFee("");
    setOperationDateTimeText(getDefaultDateTimeText());
  };

  return (
    <>
      <article className="invest-card manual-investment-card">
        <h3>Registrar inversion manual</h3>
        <div className="manual-investment-content">
          <div className="invest-operation-form">
            <label>
              Simbolo
              <select value={operationSymbol} onChange={(event) => setOperationSymbol(event.target.value)}>
                {symbols.length === 0 ? <option value="">Sin simbolos</option> : null}
                {symbols.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <select
                value={operationType}
                onChange={(event) => setOperationType(event.target.value === "SELL" ? "SELL" : "BUY")}
              >
                <option value="BUY">Compra</option>
                <option value="SELL">Venta</option>
              </select>
            </label>
            <label>
              Monto (€)
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={operationAmount}
                onChange={(event) => setOperationAmount(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <label>
              Comision (€)
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={operationFee}
                onChange={(event) => setOperationFee(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <label>
              Fecha y hora de inversion
              <input
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/YYYY, HH:mm"
                value={operationDateTimeText}
                onChange={(event) => setOperationDateTimeText(formatDateTimeTextInput(event.target.value))}
              />
            </label>
            <button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Procesando..." : "Guardar operacion"}
            </button>
            {errorMessage ? <p className="invest-error">{errorMessage}</p> : null}
          </div>
        </div>
      </article>

      {isExecutionPricePopupOpen && pendingManualPriceOperation ? (
        <ExecutionPricePopup
          symbol={pendingManualPriceOperation.symbol}
          onClose={() => {
            setIsExecutionPricePopupOpen(false);
            setPendingManualPriceOperation(null);
          }}
          onConfirm={async (executionPrice) => {
            await submitOperation(pendingManualPriceOperation, executionPrice);
            setPendingManualPriceOperation(null);
            setIsExecutionPricePopupOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

type PendingOperation = {
  symbol: string;
  operationType: "BUY" | "SELL";
  amount_eur: number;
  fee_eur: number;
  executed_at: string;
};

function shouldRequestManualExecutionPrice(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes("no se pudo obtener precio historico");
}

function getDefaultDateTimeText(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

function parseDateTimeTextToIso(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, " ");
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, dayText, monthText, yearText, hourText, minuteText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 1900 ||
    year > 3000 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hour, minute);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() != year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  ) {
    return null;
  }
  return parsed.toISOString();
}

function formatDateTimeTextInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  const hour = digits.slice(8, 10);
  const minute = digits.slice(10, 12);

  let result = "";
  if (day) {
    result += day;
  }
  if (month) {
    result += `/${month}`;
  }
  if (year) {
    result += `/${year}`;
  }
  if (hour) {
    result += `, ${hour}`;
  }
  if (minute) {
    result += `:${minute}`;
  }
  return result;
}
