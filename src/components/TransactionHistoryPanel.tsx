import type { FinancialTransaction } from "../api/financialSettingsApi";
import "./TransactionHistoryPanel.css";

type TransactionHistoryPanelProps = {
  items: FinancialTransaction[];
  isLoading: boolean;
  onSelectTransaction: (transactionId: number) => void;
};

export function TransactionHistoryPanel({
  items,
  isLoading,
  onSelectTransaction,
}: TransactionHistoryPanelProps) {
  return (
    <section className="transactions-panel" aria-label="Historial de transacciones">
      <header className="transactions-header">
        <h2>Historial de transacciones</h2>
      </header>
      {isLoading ? (
        <p className="transactions-empty">Cargando transacciones...</p>
      ) : items.length === 0 ? (
        <p className="transactions-empty">Todavia no hay movimientos.</p>
      ) : (
        <ul className="transactions-list">
          {items.map((item) => {
            const variant = getTransactionVariant(item.tipo, item.categoria);
            const isIncome = variant === "income";
            const isTransfer = variant === "transfer";
            return (
              <li
                key={item.id}
                className={`transaction-item ${variant}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelectTransaction(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectTransaction(item.id);
                  }
                }}
              >
                <div className="transaction-main">
                  <p className="transaction-title">{isTransfer ? "Transaccion" : isIncome ? "Ingreso" : "Gasto"}</p>
                  <p className="transaction-meta">
                    {item.fecha_operacion} · {item.categoria}
                  </p>
                </div>
                <strong className="transaction-amount">
                  {isTransfer ? "" : isIncome ? "+" : "-"}
                  {formatEuro(item.monto)}
                </strong>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getTransactionVariant(
  tipo: string,
  categoria: string,
): "income" | "expense" | "transfer" {
  const normalizedTipo = tipo.trim().toLowerCase();
  const normalizedCategoria = categoria.trim().toLowerCase();

  if (
    normalizedTipo === "transferencia" ||
    normalizedTipo === "transaccion" ||
    normalizedCategoria.includes("transfer")
  ) {
    return "transfer";
  }

  return normalizedTipo === "ingreso" ? "income" : "expense";
}
