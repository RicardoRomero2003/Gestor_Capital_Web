import { type FormEvent, useState } from "react";
import type { FinancialExpenseCreatePayload } from "../api/financialSettingsApi";
import "./NewExpenseModal.css";

type NewExpenseModalProps = {
  onClose: () => void;
  onSubmit: (payload: FinancialExpenseCreatePayload) => Promise<void> | void;
};

export function NewExpenseModal({ onClose, onSubmit }: NewExpenseModalProps) {
  const [category, setCategory] = useState("DEPORTE");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [transportType, setTransportType] = useState("Transporte Publico");
  const [price, setPrice] = useState("");
  const [expenseDate, setExpenseDate] = useState(getTodayTextDate());
  const [expenseKind, setExpenseKind] = useState("MENSUALIDAD");
  const [paymentMethod, setPaymentMethod] = useState("Cuenta de gastos");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory);
    if (nextCategory === "OTROS" || nextCategory === "COMIDA") {
      setExpenseKind("PUNTUAL");
      if (nextCategory === "OTROS") {
        setExpenseDate(getTodayTextDate());
      }
    } else if (expenseKind === "PUNTUAL") {
      setExpenseKind("MENSUALIDAD");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPrice = Number(price.replace(",", "."));
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      setErrorMessage("Introduce un precio valido mayor que 0.");
      return;
    }

    const apiDate = parseDateToApiDate(expenseDate);
    if (!apiDate) {
      setErrorMessage("Fecha invalida. Usa formato DD/MM/AAAA o YYYY-MM-DD.");
      return;
    }

    const normalizedName = name.trim();
    const normalizedLocation = location.trim();
    const normalizedTransportType = transportType.trim();

    if ((category === "DEPORTE" || category === "OCIO" || category === "OTROS" || category === "COMIDA") && !normalizedName) {
      setErrorMessage("El campo nombre es obligatorio para esta categoria.");
      return;
    }
    if (category === "TRANSPORTE" && !normalizedTransportType) {
      setErrorMessage("Selecciona un tipo de transporte.");
      return;
    }
    if (category === "OCIO" && !normalizedLocation) {
      setErrorMessage("La ubicacion es obligatoria para ocio.");
      return;
    }

    const resolvedExpenseKind = category === "OTROS" || category === "COMIDA" ? "PUNTUAL" : expenseKind;

    const payload: FinancialExpenseCreatePayload = {
      categoria: category,
      precio: normalizedPrice,
      fecha: apiDate,
      tipo: resolvedExpenseKind,
      forma_pago: paymentMethod,
      nombre:
        category === "DEPORTE" || category === "OCIO" || category === "OTROS" || category === "COMIDA"
          ? normalizedName
          : undefined,
      tipo_transporte: category === "TRANSPORTE" ? normalizedTransportType : undefined,
      ubicacion: category === "OCIO" ? normalizedLocation : undefined,
    };

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar el gasto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-expense-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="new-expense-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="new-expense-close-button" onClick={onClose} aria-label="Cerrar formulario">
          x
        </button>
        <div className="new-expense-content">
          <h2>Nuevo Gasto</h2>
          <form className="expense-form" onSubmit={handleSubmit}>
            <div className="expense-field">
              <label htmlFor="expense-category">Categoria</label>
              <select id="expense-category" value={category} onChange={(event) => handleCategoryChange(event.target.value)}>
                <option value="DEPORTE">DEPORTE</option>
                <option value="TRANSPORTE">TRANSPORTE</option>
                <option value="OCIO">OCIO</option>
                <option value="COMIDA">COMIDA</option>
                <option value="OTROS">OTROS</option>
              </select>
            </div>

            {category === "DEPORTE" || category === "OCIO" || category === "OTROS" || category === "COMIDA" ? (
              <div className="expense-field">
                <label htmlFor="expense-name">Nombre</label>
                <input
                  id="expense-name"
                  type="text"
                  placeholder="Nombre del gasto"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            ) : null}

            {category === "TRANSPORTE" ? (
              <div className="expense-field">
                <label htmlFor="expense-transport-type">Tipo de transporte</label>
                <select
                  id="expense-transport-type"
                  value={transportType}
                  onChange={(event) => setTransportType(event.target.value)}
                >
                  <option value="Transporte Publico">Transporte Publico</option>
                  <option value="Uber">Uber</option>
                  <option value="Gasolina">Gasolina</option>
                </select>
              </div>
            ) : null}

            {category === "OCIO" ? (
              <div className="expense-field">
                <label htmlFor="expense-location">Ubicacion</label>
                <input
                  id="expense-location"
                  type="text"
                  placeholder="Introduce la calle"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </div>
            ) : null}

            <div className="expense-field">
              <label htmlFor="expense-price">Precio</label>
              <input
                id="expense-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>

            <div className="expense-field">
              <label htmlFor="expense-date">Fecha</label>
              <input
                id="expense-date"
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
                readOnly={category === "OTROS"}
              />
            </div>

            {category === "OTROS" ? null : category === "COMIDA" ? (
              <div className="expense-field">
                <label htmlFor="expense-kind-fixed">Tipo</label>
                <input id="expense-kind-fixed" type="text" value="PUNTUAL" readOnly />
              </div>
            ) : (
              <div className="expense-field">
                <label htmlFor="expense-kind">Tipo</label>
                <select id="expense-kind" value={expenseKind} onChange={(event) => setExpenseKind(event.target.value)}>
                  <option value="MENSUALIDAD">Mensualidad</option>
                  <option value="PUNTUAL">Puntual</option>
                </select>
              </div>
            )}

            <div className="expense-field">
              <label htmlFor="expense-payment-method">Forma de Pago</label>
              <select
                id="expense-payment-method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="Cuenta de gastos">Cuenta de gastos</option>
                <option value="Tarjeta de Ineco">Tarjeta de Ineco</option>
              </select>
            </div>

            <div className="expense-submit-row">
              {errorMessage ? <p className="expense-error">{errorMessage}</p> : null}
              <button type="submit" className="expense-submit-button" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Añadir Gasto"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function getTodayTextDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseDateToApiDate(raw: string): string | null {
  const normalized = raw.trim();
  if (!normalized) {
    return null;
  }

  const slashPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

  if (slashPattern.test(normalized)) {
    const [, day, month, year] = normalized.match(slashPattern) ?? [];
    if (!isValidDateParts(Number(year), Number(month), Number(day))) {
      return null;
    }
    return `${year}-${month}-${day}`;
  }

  if (isoPattern.test(normalized)) {
    const [, year, month, day] = normalized.match(isoPattern) ?? [];
    if (!isValidDateParts(Number(year), Number(month), Number(day))) {
      return null;
    }
    return `${year}-${month}-${day}`;
  }

  return null;
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 3000) {
    return false;
  }
  if (month < 1 || month > 12) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }

  const testDate = new Date(year, month - 1, day);
  return (
    testDate.getFullYear() === year &&
    testDate.getMonth() === month - 1 &&
    testDate.getDate() === day
  );
}
