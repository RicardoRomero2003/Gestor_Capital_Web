export type DecimalValue = string;
export type DateISO = string;
export type DateTimeISO = string;

export type FinanzasConfigModel = {
  idusuario: number;
  pct_gastos: DecimalValue;
  pct_ahorro: DecimalValue;
  pct_inversion: DecimalValue;
  ineco_fijo_mensual: DecimalValue;
  updated_at: DateTimeISO;
};

export type FinanzasBalanceModel = {
  idusuario: number;
  capital_ahorrado: DecimalValue;
  capital_invertido: DecimalValue;
  capital_gastos: DecimalValue;
  capital_ineco: DecimalValue;
  last_auto_calc_date: DateISO | null;
  last_ineco_month: string | null;
  updated_at: DateTimeISO;
};

export type SueldoUsuarioModel = {
  id: number;
  idusuario: number;
  monto: DecimalValue;
  dia_cobro: number;
  activo: boolean;
  ultima_aplicacion: DateISO | null;
  created_at: DateTimeISO;
  updated_at: DateTimeISO;
};

export type SueldoEjecucionModel = {
  id: number;
  idsueldo: number;
  fecha_programada: DateISO;
  fecha_ejecutada: DateTimeISO;
  monto: DecimalValue;
};
