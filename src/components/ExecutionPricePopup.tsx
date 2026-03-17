import { useState } from "react";
import "./ExecutionPricePopup.css";

type ExecutionPricePopupProps = {
  symbol: string;
  onConfirm: (executionPrice: number) => Promise<void> | void;
  onClose: () => void;
};

export function ExecutionPricePopup({ symbol, onConfirm, onClose }: ExecutionPricePopupProps) {
  const [priceText, setPriceText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConfirm = async () => {
    const parsed = Number(priceText.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setErrorMessage("Introduce un precio de ejecucion valido mayor que 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await onConfirm(parsed);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar la operacion con precio manual.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="execution-price-popup-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="execution-price-popup" onClick={(event) => event.stopPropagation()}>
        <h4>Precio de ejecucion manual</h4>
        <p>No hay historico automatico para {symbol}. Introduce el precio que tenia en ese momento.</p>

        <label htmlFor="execution-price-input">Precio de ejecucion</label>
        <input
          id="execution-price-input"
          type="number"
          min="0"
          step="0.000001"
          inputMode="decimal"
          placeholder="0.000000"
          value={priceText}
          onChange={(event) => setPriceText(event.target.value)}
        />

        {errorMessage ? <p className="execution-price-popup-error">{errorMessage}</p> : null}

        <button type="button" onClick={() => void handleConfirm()} disabled={isSubmitting}>
          {isSubmitting ? "Procesando..." : "OK"}
        </button>
      </section>
    </div>
  );
}
