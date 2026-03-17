import { useState } from "react";
import type { FinancialTransactionDetail } from "../api/financialSettingsApi";
import "./TransactionDetailModal.css";

type TransactionDetailModalProps = {
  transaction: FinancialTransactionDetail;
  onClose: () => void;
  onDelete: (transactionId: number) => Promise<void> | void;
};

export function TransactionDetailModal({ transaction, onClose, onDelete }: TransactionDetailModalProps) {
  const variant = getTransactionVariant(transaction.tipo, transaction.categoria);
  const isIncome = variant === "income";
  const isTransfer = variant === "transfer";
  const title = isTransfer ? "Transaccion" : isIncome ? "Ingreso" : "Gasto";
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError("");
      await onDelete(transaction.id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "No se pudo eliminar la transaccion.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="transaction-detail-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="transaction-detail-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="transaction-detail-delete"
          onClick={() => void handleDelete()}
          disabled={isDeleting}
          aria-label="Eliminar transaccion"
        >
          {isDeleting ? "Eliminando..." : "Eliminar transaccion"}
        </button>
        <button type="button" className="transaction-detail-close" onClick={onClose} aria-label="Cerrar detalle">
          x
        </button>
        <header className="transaction-detail-header">
          <h2 className={variant}>{title}</h2>
        </header>
        {deleteError ? <p className="transaction-detail-error">{deleteError}</p> : null}

        <div className="transaction-detail-grid">
          <DetailItem
            label="Monto"
            value={`${isTransfer ? "" : isIncome ? "+" : "-"}${formatEuro(transaction.monto)}`}
            variant={variant}
          />
          <DetailItem label="Categoria" value={transaction.categoria} />
          <DetailItem label="Fecha operacion" value={transaction.fecha_operacion} />
          <DetailItem label="Creado en" value={transaction.created_at} />
          {transaction.descripcion ? <DetailItem label="Descripcion" value={transaction.descripcion} /> : null}

          {Object.entries(transaction.detail).map(([key, rawValue]) => (
            <DetailItem key={key} label={formatLabel(key)} value={formatValue(rawValue)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DetailItem({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "income" | "expense" | "transfer";
}) {
  return (
    <div className={`transaction-detail-item ${variant}`}>
      <p className="transaction-detail-label">{label}</p>
      <p className="transaction-detail-value">{value}</p>
    </div>
  );
}

function formatLabel(raw: string): string {
  return raw.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatValue(value: string | number | null): string {
  if (value === null || value === "") {
    return "-";
  }
  if (typeof value === "number") {
    return formatEuro(value);
  }
  return String(value);
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
