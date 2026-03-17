import { type FormEvent, useState } from "react";
import type { FinancialTransferCreatePayload } from "../api/financialSettingsApi";
import "./NewTransactionModal.css";

type NewTransactionModalProps = {
  onClose: () => void;
  onSubmit: (payload: FinancialTransferCreatePayload) => Promise<void> | void;
};

export function NewTransactionModal({ onClose, onSubmit }: NewTransactionModalProps) {
  const [fromCapital, setFromCapital] = useState("Capital ahorrado");
  const [toCapital, setToCapital] = useState("Capital a invertir");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Introduce un monto valido mayor que 0.");
      return;
    }
    if (fromCapital === toCapital) {
      setErrorMessage("El capital saliente y entrante no pueden ser iguales.");
      return;
    }

    const payload: FinancialTransferCreatePayload = {
      capital_saliente: fromCapital,
      capital_entrante: toCapital,
      monto: parsedAmount,
    };

    try {
      setErrorMessage("");
      setIsSubmitting(true);
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo realizar la transaccion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-transaction-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="new-transaction-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="new-transaction-close-button"
          onClick={onClose}
          aria-label="Cerrar formulario"
        >
          x
        </button>
        <div className="new-transaction-content">
          <h2>Nueva Transaccion</h2>
          <form className="transaction-form" onSubmit={handleSubmit}>
            <div className="transaction-field">
              <label htmlFor="transaction-from-capital">Capital saliente</label>
              <select
                id="transaction-from-capital"
                value={fromCapital}
                onChange={(event) => setFromCapital(event.target.value)}
              >
                <option value="Capital ahorrado">Capital ahorrado</option>
                <option value="Capital a invertir">Capital a invertir</option>
                <option value="Capital disponible para gastos">Capital disponible para gastos</option>
              </select>
            </div>

            <div className="transaction-field">
              <label htmlFor="transaction-to-capital">Capital entrante</label>
              <select id="transaction-to-capital" value={toCapital} onChange={(event) => setToCapital(event.target.value)}>
                <option value="Capital ahorrado">Capital ahorrado</option>
                <option value="Capital a invertir">Capital a invertir</option>
                <option value="Capital disponible para gastos">Capital disponible para gastos</option>
              </select>
            </div>

            <div className="transaction-field">
              <label htmlFor="transaction-amount">Monto</label>
              <input
                id="transaction-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="transaction-submit-row">
              {errorMessage ? <p className="transaction-error">{errorMessage}</p> : null}
              <button type="submit" className="transaction-submit-button" disabled={isSubmitting}>
                {isSubmitting ? "Procesando..." : "Realiza Transaccion"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
