import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  createFinancialTransfer,
  createFinancialIncome,
  createFinancialExpense,
  deleteFinancialTransaction,
  getFinancialBalance,
  getFinancialCapitalSeries,
  getFinancialLiquiditySeries,
  getFinancialSettings,
  getFinancialTransactionDetail,
  getFinancialTransactions,
  processDailyFinancialMovements,
  saveFinancialSettings,
  type FinancialBalanceResponse,
  type FinancialCapitalKey,
  type FinancialExpenseCreatePayload,
  type FinancialIncomeCreatePayload,
  type FinancialTransferCreatePayload,
  type LiquidityRange,
  type LiquiditySeriesPoint,
  type FinancialTransactionDetail,
  type FinancialTransaction,
} from "../api/financialSettingsApi";
import type { AuthenticatedUser } from "../auth/types";
import { LiquidityChartPanel } from "../components/LiquidityChartPanel";
import { InvestCapitalPanel } from "../components/InvestCapitalPanel";
import { createInitialSettingsDraft, SettingsPanel, type SettingsDraft } from "../components/SettingsPanel";
import { NewExpenseModal } from "../components/NewExpenseModal";
import { NewIncomeModal } from "../components/NewIncomeModal";
import { NewTransactionModal } from "../components/NewTransactionModal";
import { TransactionDetailModal } from "../components/TransactionDetailModal";
import { TransactionHistoryPanel } from "../components/TransactionHistoryPanel";
import { UserCard } from "../components/UserCard";
import { UserMenuButtonWeb } from "../components/UserMenuButtonWeb";
import {
  buildFinancialUpsertPayload,
  createDefaultFinancialSettingsDraft,
  financialResponseToDraft,
} from "../services/financialSettingsService";
import "./HomeScreen.css";

type HomeScreenProps = {
  user: AuthenticatedUser;
  onLogout: () => void;
};

const EMPTY_BALANCE: FinancialBalanceResponse = {
  user_id: 0,
  capital_ahorrado: 0,
  capital_invertido: 0,
  capital_gastos: 0,
  capital_ineco: 0,
  last_auto_calc_date: null,
  last_ineco_month: null,
};

const CAPITAL_FILTER_LABELS: Record<FinancialCapitalKey, string> = {
  CAPITAL_AHORRADO: "Capital ahorrado",
  CAPITAL_INVERTIDO: "Capital a invertir",
  CAPITAL_GASTOS: "Capital disponible para gastos",
  CAPITAL_INECO: "Tarjeta de Ineco",
};

export function HomeScreen({ user, onLogout }: HomeScreenProps) {
  const [isMobileLayout, setIsMobileLayout] = useState(() => detectMobileLayout());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savedSettings, setSavedSettings] = useState<SettingsDraft>(() =>
    createInitialSettingsDraft(user, createDefaultFinancialSettingsDraft()),
  );
  const [balance, setBalance] = useState<FinancialBalanceResponse>(EMPTY_BALANCE);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [liquidityRange, setLiquidityRange] = useState<LiquidityRange>("month");
  const [liquidityPoints, setLiquidityPoints] = useState<LiquiditySeriesPoint[]>([]);
  const [isLiquidityLoading, setIsLiquidityLoading] = useState(true);
  const [isInvestPanelOpen, setIsInvestPanelOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isNewIncomeOpen, setIsNewIncomeOpen] = useState(false);
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransactionDetail | null>(null);
  const [selectedCapitalFilter, setSelectedCapitalFilter] = useState<FinancialCapitalKey | null>(null);
  const [mutationTick, setMutationTick] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobileLayout(detectMobileLayout());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("home-no-scroll", !isMobileLayout);

    return () => {
      document.body.classList.remove("home-no-scroll");
    };
  }, [isMobileLayout]);

  useEffect(() => {
    let active = true;

    const initializeHomeData = async () => {
      const [settingsResult, dailyResult] = await Promise.allSettled([
        getFinancialSettings(user.userId),
        processDailyFinancialMovements(user.userId),
      ]);

      if (!active) {
        return;
      }

      if (settingsResult.status === "fulfilled") {
        setSavedSettings((prev) => ({
          ...prev,
          financial: financialResponseToDraft(settingsResult.value),
        }));
      }

      if (dailyResult.status === "fulfilled") {
        setBalance(dailyResult.value.balance);
        setMutationTick((value) => value + 1);
        return;
      }

      try {
        const loadedBalance = await getFinancialBalance(user.userId);
        if (!active) {
          return;
        }
        setBalance(loadedBalance);
      } catch {
        if (!active) {
          return;
        }
      }
    };

    void initializeHomeData();

    return () => {
      active = false;
    };
  }, [user.userId]);

  useEffect(() => {
    let active = true;

    const loadTransactions = async () => {
      setIsTransactionsLoading(true);
      try {
        const loadedTransactions = await getFinancialTransactions(user.userId, {
          limit: 80,
          offset: 0,
          capital: selectedCapitalFilter ?? undefined,
        });
        if (!active) {
          return;
        }
        setTransactions(loadedTransactions);
      } catch {
        if (!active) {
          return;
        }
      } finally {
        if (active) {
          setIsTransactionsLoading(false);
        }
      }
    };

    void loadTransactions();

    return () => {
      active = false;
    };
  }, [user.userId, selectedCapitalFilter]);

  useEffect(() => {
    let active = true;

    const loadLiquiditySeries = async () => {
      setIsLiquidityLoading(true);
      try {
        const series = selectedCapitalFilter
          ? await getFinancialCapitalSeries(user.userId, selectedCapitalFilter, liquidityRange)
          : await getFinancialLiquiditySeries(user.userId, liquidityRange);
        if (!active) {
          return;
        }
        setLiquidityPoints(series.points);
      } catch {
        if (!active) {
          return;
        }
        setLiquidityPoints([]);
      } finally {
        if (active) {
          setIsLiquidityLoading(false);
        }
      }
    };

    void loadLiquiditySeries();

    return () => {
      active = false;
    };
  }, [user.userId, liquidityRange, mutationTick, selectedCapitalFilter]);

  const selectedCapitalLabel = selectedCapitalFilter ? CAPITAL_FILTER_LABELS[selectedCapitalFilter] : null;

  const displayUser: AuthenticatedUser = useMemo(
    () => ({
      ...user,
      nombre: savedSettings.personal.displayName || user.nombre,
      correo: savedSettings.personal.contactEmail || user.correo,
    }),
    [savedSettings.personal.contactEmail, savedSettings.personal.displayName, user],
  );

  const prependTransaction = (transaction: FinancialTransaction, affectsCurrentFilter: boolean) => {
    if (!affectsCurrentFilter) {
      return;
    }
    setTransactions((current) => [transaction, ...current.filter((item) => item.id !== transaction.id)].slice(0, 80));
  };

  return (
    <main className={`home-screen${isMobileLayout ? " mobile-layout" : ""}`}>
      {isMobileLayout ? (
        <header className="mobile-top-bar">
          <img className="mobile-top-logo" src="/assets/capify-logo.png" alt="Capify" />
          <UserMenuButtonWeb
            user={displayUser}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLogout={onLogout}
          />
        </header>
      ) : null}

      <LayoutGroup id="invest-capital-layout">
        <section className="capital-cards">
          <article
            className={`capital-card capital-card-interactive${selectedCapitalFilter === "CAPITAL_AHORRADO" ? " capital-card-filter-active" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedCapitalFilter("CAPITAL_AHORRADO")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedCapitalFilter("CAPITAL_AHORRADO");
              }
            }}
          >
            <p>Capital ahorrado</p>
            <strong>{formatEuro(balance.capital_ahorrado)}</strong>
          </article>
          {isInvestPanelOpen ? (
            <article className="capital-card capital-card-placeholder" aria-hidden="true" />
          ) : (
            <motion.article
              layoutId="invest-capital-card"
              className="capital-card capital-card-interactive"
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedCapitalFilter("CAPITAL_INVERTIDO");
                if (!isMobileLayout) {
                  setIsInvestPanelOpen(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedCapitalFilter("CAPITAL_INVERTIDO");
                  if (!isMobileLayout) {
                    setIsInvestPanelOpen(true);
                  }
                }
              }}
            >
              <p>Capital a invertir</p>
              <strong>{formatEuro(balance.capital_invertido)}</strong>
            </motion.article>
          )}
          <article
            className={`capital-card capital-card-interactive${selectedCapitalFilter === "CAPITAL_GASTOS" ? " capital-card-filter-active" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedCapitalFilter("CAPITAL_GASTOS")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedCapitalFilter("CAPITAL_GASTOS");
              }
            }}
          >
            <p>Capital disponible para gastos</p>
            <strong>{formatEuro(balance.capital_gastos)}</strong>
          </article>
          <article
            className={`capital-card capital-card-interactive${selectedCapitalFilter === "CAPITAL_INECO" ? " capital-card-filter-active" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedCapitalFilter("CAPITAL_INECO")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedCapitalFilter("CAPITAL_INECO");
              }
            }}
          >
            <p>Capital disponble tarjeta Ineco</p>
            <strong>{formatEuro(balance.capital_ineco)}</strong>
          </article>
        </section>
        <AnimatePresence>
          {isInvestPanelOpen ? (
            <InvestCapitalPanel
              userId={user.userId}
              amount={balance.capital_invertido}
              onClose={() => setIsInvestPanelOpen(false)}
            />
          ) : null}
        </AnimatePresence>
      </LayoutGroup>

      <div className="new-expense-anchor">
        {selectedCapitalFilter ? (
          <button type="button" className="new-income-button" onClick={() => setSelectedCapitalFilter(null)}>
            Quitar filtro
          </button>
        ) : null}
        <button type="button" className="new-income-button" onClick={() => setIsNewTransactionOpen(true)}>
          Nueva transaccion
        </button>
        <button type="button" className="new-income-button" onClick={() => setIsNewIncomeOpen(true)}>
          Nuevo Ingreso
        </button>
        <button type="button" className="new-expense-button" onClick={() => setIsNewExpenseOpen(true)}>
          Nuevo Gasto
        </button>
      </div>

      <div className="liquidity-chart-anchor">
        <LiquidityChartPanel
          points={liquidityPoints}
          range={liquidityRange}
          isLoading={isLiquidityLoading}
          onRangeChange={setLiquidityRange}
          title={selectedCapitalLabel ? `Evolucion de ${selectedCapitalLabel}` : undefined}
          subtitle={
            selectedCapitalLabel
              ? `Movimientos historicos del capital ${selectedCapitalLabel.toLowerCase()}.`
              : undefined
          }
        />
      </div>

      <div className="transactions-anchor">
        <TransactionHistoryPanel
          items={transactions}
          isLoading={isTransactionsLoading}
          onSelectTransaction={async (transactionId) => {
            try {
              const detail = await getFinancialTransactionDetail(user.userId, transactionId);
              setSelectedTransaction(detail);
            } catch {
              // Sin logs visuales en home.
            }
          }}
        />
      </div>

      {!isMobileLayout ? (
        <div className="user-card-anchor">
          <UserCard user={displayUser} onLogout={onLogout} onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>
      ) : null}

      {isSettingsOpen ? (
        <SettingsPanel
          user={displayUser}
          initialSettings={savedSettings}
          onSave={async (nextSettings) => {
            const payload = buildFinancialUpsertPayload(nextSettings.financial);
            const response = await saveFinancialSettings(user.userId, payload);

            setSavedSettings({
              ...nextSettings,
              financial: financialResponseToDraft(response),
            });
            setIsSettingsOpen(false);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      ) : null}

      {isNewExpenseOpen ? (
        <NewExpenseModal
          onClose={() => setIsNewExpenseOpen(false)}
          onSubmit={async (payload) => {
            const result = await createFinancialExpense(user.userId, payload);
            setBalance(result.balance);
            prependTransaction(
              result.transaction,
              shouldIncludeExpenseInFilter(selectedCapitalFilter, payload),
            );
            setMutationTick((value) => value + 1);
          }}
        />
      ) : null}

      {isNewIncomeOpen ? (
        <NewIncomeModal
          onClose={() => setIsNewIncomeOpen(false)}
          onSubmit={async (payload) => {
            const result = await createFinancialIncome(user.userId, payload);
            setBalance(result.balance);
            prependTransaction(
              result.transaction,
              shouldIncludeIncomeInFilter(selectedCapitalFilter, payload),
            );
            setMutationTick((value) => value + 1);
          }}
        />
      ) : null}

      {isNewTransactionOpen ? (
        <NewTransactionModal
          onClose={() => setIsNewTransactionOpen(false)}
          onSubmit={async (payload) => {
            const result = await createFinancialTransfer(user.userId, payload);
            setBalance(result.balance);
            prependTransaction(
              result.transaction,
              shouldIncludeTransferInFilter(selectedCapitalFilter, payload),
            );
            setMutationTick((value) => value + 1);
          }}
        />
      ) : null}

      {selectedTransaction ? (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onDelete={async (transactionId) => {
            const result = await deleteFinancialTransaction(user.userId, transactionId);
            setBalance(result.balance);
            setTransactions((current) => current.filter((item) => item.id !== transactionId));
            setMutationTick((value) => value + 1);
            setSelectedTransaction(null);
          }}
        />
      ) : null}
    </main>
  );
}

function detectMobileLayout(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  return window.innerWidth <= 900 || (coarsePointer && window.innerWidth <= 1024);
}

function shouldIncludeExpenseInFilter(
  selectedFilter: FinancialCapitalKey | null,
  payload: FinancialExpenseCreatePayload,
): boolean {
  if (!selectedFilter) return true;
  const payment = payload.forma_pago.trim().toLowerCase();
  if (payment === "tarjeta de ineco") {
    return selectedFilter === "CAPITAL_INECO";
  }
  return selectedFilter === "CAPITAL_GASTOS";
}

function shouldIncludeIncomeInFilter(
  selectedFilter: FinancialCapitalKey | null,
  payload: FinancialIncomeCreatePayload,
): boolean {
  if (!selectedFilter) return true;
  const target = payload.ingresar_en.trim().toLowerCase();
  if (target === "capital ahorrado") return selectedFilter === "CAPITAL_AHORRADO";
  if (target === "capital a invertir") return selectedFilter === "CAPITAL_INVERTIDO";
  if (target === "capital disponible para gastos") return selectedFilter === "CAPITAL_GASTOS";
  if (target === "tarjeta de ineco") return selectedFilter === "CAPITAL_INECO";
  return false;
}

function shouldIncludeTransferInFilter(
  selectedFilter: FinancialCapitalKey | null,
  payload: FinancialTransferCreatePayload,
): boolean {
  if (!selectedFilter) return true;
  const outgoing = toTransferFilter(payload.capital_saliente);
  const incoming = toTransferFilter(payload.capital_entrante);
  return selectedFilter === outgoing || selectedFilter === incoming;
}

function toTransferFilter(label: string): FinancialCapitalKey | null {
  const normalized = label.trim().toLowerCase();
  if (normalized === "capital ahorrado") return "CAPITAL_AHORRADO";
  if (normalized === "capital a invertir") return "CAPITAL_INVERTIDO";
  if (normalized === "capital disponible para gastos") return "CAPITAL_GASTOS";
  if (normalized === "tarjeta de ineco") return "CAPITAL_INECO";
  return null;
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
