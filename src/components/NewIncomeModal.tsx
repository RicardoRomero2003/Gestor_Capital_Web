import { type FormEvent, useState } from "react";
import type { FinancialIncomeCreatePayload } from "../api/financialSettingsApi";
import "./NewIncomeModal.css";

type NewIncomeModalProps = {
  onClose: () => void;
  onSubmit: (payload: FinancialIncomeCreatePayload) => Promise<void> | void;
};

export function NewIncomeModal({ onClose, onSubmit }: NewIncomeModalProps) {
  const [targetCapital, setTargetCapital] = useState("Capital ahorrado");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState("Bizum");
  const [senderName, setSenderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Introduce un monto valido mayor que 0.");
      return;
    }

    const normalizedDescription = description.trim();
    if (!normalizedDescription) {
      setErrorMessage("La descripcion es obligatoria.");
      return;
    }

    const normalizedSender = senderName.trim();
    if (!normalizedSender) {
      setErrorMessage("El nombre del remitente es obligatorio.");
      return;
    }

    const payload: FinancialIncomeCreatePayload = {
      ingresar_en: targetCapital,
      monto: parsedAmount,
      descripcion: normalizedDescription,
      metodo: sourceType,
      nombre_remitente: normalizedSender,
    };

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo registrar el ingreso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-income-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="new-income-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="new-income-close-button" onClick={onClose} aria-label="Cerrar formulario">
          x
        </button>
        <div className="new-income-content">
          <h2>Nuevo Ingreso</h2>
          <form className="income-form" onSubmit={handleSubmit}>
            <div className="income-field">
              <label htmlFor="income-target-capital">Ingresar en</label>
              <select
                id="income-target-capital"
                value={targetCapital}
                onChange={(event) => setTargetCapital(event.target.value)}
              >
                <option value="Capital ahorrado">Capital ahorrado</option>
                <option value="Capital a invertir">Capital a invertir</option>
                <option value="Capital disponible para gastos">Capital disponible para gastos</option>
                <option value="Tarjeta de Ineco">Tarjeta de Ineco</option>
              </select>
            </div>

            <div className="income-field">
              <label htmlFor="income-amount">Monto</label>
              <input
                id="income-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="income-field">
              <label htmlFor="income-description">Descripcion</label>
              <input
                id="income-description"
                type="text"
                placeholder="Descripcion del ingreso"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="income-field">
              <label htmlFor="income-source-type">Metodo</label>
              <select
                id="income-source-type"
                value={sourceType}
                onChange={(event) => setSourceType(event.target.value)}
              >
                <option value="Bizum">Bizum</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>

            <div className="income-field">
              <label htmlFor="income-sender-name">Nombre del remitente</label>
              <input
                id="income-sender-name"
                type="text"
                placeholder="Nombre del remitente"
                value={senderName}
                onChange={(event) => setSenderName(event.target.value)}
              />
            </div>

            <div className="income-submit-row">
              {errorMessage ? <p className="income-error">{errorMessage}</p> : null}
              <button type="submit" className="income-submit-button" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Añadir Ingreso"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
