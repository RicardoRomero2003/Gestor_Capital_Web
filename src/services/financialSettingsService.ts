import type {
  FinancialSettingsResponse,
  FinancialSettingsUpsertPayload,
  SalaryItemPayload,
} from "../api/financialSettingsApi";

export type FinancialSalaryDraft = {
  id?: number;
  monto: string;
  diaCobro: string;
  activo: boolean;
};

export type FinancialSettingsDraft = {
  pctGastos: string;
  pctAhorro: string;
  pctInversion: string;
  inecoFijoMensual: string;
  salaries: FinancialSalaryDraft[];
};

export function createDefaultFinancialSettingsDraft(): FinancialSettingsDraft {
  return {
    pctGastos: "50.00",
    pctAhorro: "40.00",
    pctInversion: "10.00",
    inecoFijoMensual: "125.00",
    salaries: [],
  };
}

export function financialResponseToDraft(response: FinancialSettingsResponse): FinancialSettingsDraft {
  return {
    pctGastos: formatDecimal(response.pct_gastos),
    pctAhorro: formatDecimal(response.pct_ahorro),
    pctInversion: formatDecimal(response.pct_inversion),
    inecoFijoMensual: formatDecimal(response.ineco_fijo_mensual),
    salaries: response.sueldos.map((salary) => ({
      id: salary.id,
      monto: formatDecimal(salary.monto),
      diaCobro: String(salary.dia_cobro),
      activo: salary.activo,
    })),
  };
}

export function validateFinancialDraft(draft: FinancialSettingsDraft): string | null {
  const pctGastos = parseDecimal(draft.pctGastos);
  const pctAhorro = parseDecimal(draft.pctAhorro);
  const pctInversion = parseDecimal(draft.pctInversion);

  if (pctGastos === null || pctAhorro === null || pctInversion === null) {
    return "Introduce porcentajes validos en gastos, ahorro e inversion.";
  }

  if (pctGastos < 0 || pctAhorro < 0 || pctInversion < 0) {
    return "Los porcentajes no pueden ser negativos.";
  }

  if (pctGastos > 100 || pctAhorro > 100 || pctInversion > 100) {
    return "Cada porcentaje debe estar entre 0 y 100.";
  }

  const total = pctGastos + pctAhorro + pctInversion;
  if (Math.abs(total - 100) > 0.01) {
    return "La suma de porcentajes debe ser 100.";
  }

  for (const salary of draft.salaries) {
    const amount = parseDecimal(salary.monto);
    const day = parseInteger(salary.diaCobro);

    if (amount === null || amount <= 0) {
      return "Cada sueldo debe tener un monto mayor que 0.";
    }

    if (day === null || day < 1 || day > 31) {
      return "Cada sueldo debe tener un dia de cobro entre 1 y 31.";
    }
  }

  return null;
}

export function buildFinancialUpsertPayload(draft: FinancialSettingsDraft): FinancialSettingsUpsertPayload {
  const validationError = validateFinancialDraft(draft);
  if (validationError) {
    throw new Error(validationError);
  }

  const pctGastos = parseDecimal(draft.pctGastos);
  const pctAhorro = parseDecimal(draft.pctAhorro);
  const pctInversion = parseDecimal(draft.pctInversion);

  if (pctGastos === null || pctAhorro === null || pctInversion === null) {
    throw new Error("No se pudo convertir los porcentajes.");
  }

  const sueldos: SalaryItemPayload[] = draft.salaries.map((salary) => {
    const monto = parseDecimal(salary.monto);
    const diaCobro = parseInteger(salary.diaCobro);

    if (monto === null || diaCobro === null) {
      throw new Error("No se pudo convertir un sueldo a formato API.");
    }

    return {
      id: salary.id,
      monto,
      dia_cobro: diaCobro,
      activo: salary.activo,
    };
  });

  return {
    pct_gastos: pctGastos,
    pct_ahorro: pctAhorro,
    pct_inversion: pctInversion,
    sueldos,
  };
}

export function normalizeDecimalTextInput(value: string): string {
  return value.replace(/\s+/g, "").replace(",", ".");
}

function parseDecimal(raw: string): number | null {
  const normalized = normalizeDecimalTextInput(raw);
  if (!normalized) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

function parseInteger(raw: string): number | null {
  const normalized = raw.trim();
  if (!normalized) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isInteger(value)) {
    return null;
  }

  return value;
}

function formatDecimal(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.00";
  }
  return value.toFixed(2);
}
