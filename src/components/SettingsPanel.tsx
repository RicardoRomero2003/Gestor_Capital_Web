import { useState } from "react";
import type { AuthenticatedUser } from "../auth/types";
import {
  createDefaultFinancialSettingsDraft,
  normalizeDecimalTextInput,
  type FinancialSalaryDraft,
  type FinancialSettingsDraft,
  validateFinancialDraft,
} from "../services/financialSettingsService";
import { PopUpAlerta } from "./popUpAlerta";
import "./SettingsPanel.css";

type SettingsPanelProps = {
  user: AuthenticatedUser;
  initialSettings: SettingsDraft;
  onSave: (settings: SettingsDraft) => Promise<void> | void;
  onClose: () => void;
};

type SettingsSection = "general" | "financial" | "personal" | "security";

export type SettingsDraft = {
  general: {
    language: string;
    timezone: string;
  };
  financial: FinancialSettingsDraft;
  personal: {
    displayName: string;
    contactEmail: string;
  };
  security: {
    newPassword: string;
  };
};

const SETTINGS_OPTIONS: Array<{ key: SettingsSection; label: string }> = [
  { key: "general", label: "General" },
  { key: "financial", label: "Datos financieros" },
  { key: "personal", label: "Informacion personal" },
  { key: "security", label: "Seguridad" },
];

export function createInitialSettingsDraft(
  user: AuthenticatedUser,
  financialDraft: FinancialSettingsDraft = createDefaultFinancialSettingsDraft(),
): SettingsDraft {
  return {
    general: {
      language: "es-ES",
      timezone: "Europe/Madrid",
    },
    financial: financialDraft,
    personal: {
      displayName: user.nombre,
      contactEmail: user.correo,
    },
    security: {
      newPassword: "",
    },
  };
}

export function SettingsPanel({ user, initialSettings, onSave, onClose }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [draft, setDraft] = useState<SettingsDraft>(initialSettings);
  const [newSalaryAmount, setNewSalaryAmount] = useState("");
  const [newSalaryDay, setNewSalaryDay] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExitAlertOpen, setIsExitAlertOpen] = useState(false);
  const hasUnsavedChanges = isDraftDirty(draft, initialSettings);

  const requestClose = () => {
    if (isSaving) {
      return;
    }

    if (hasUnsavedChanges) {
      setIsExitAlertOpen(true);
      return;
    }

    onClose();
  };

  const applyAndSave = async () => {
    const validationError = validateFinancialDraft(draft.financial);
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setIsSaving(true);
    setSaveError("");
    try {
      await onSave(draft);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo guardar la configuracion.");
    } finally {
      setIsSaving(false);
    }
  };

  const addSalary = () => {
    const amount = normalizeDecimalTextInput(newSalaryAmount);
    const day = newSalaryDay.trim();
    const amountValue = Number(amount);
    const dayValue = Number(day);

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setSaveError("Introduce un sueldo valido mayor que 0.");
      return;
    }

    if (!Number.isInteger(dayValue) || dayValue < 1 || dayValue > 31) {
      setSaveError("El dia de cobro debe estar entre 1 y 31.");
      return;
    }

    setDraft((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        salaries: [
          ...prev.financial.salaries,
          {
            monto: amountValue.toFixed(2),
            diaCobro: String(dayValue),
            activo: true,
          },
        ],
      },
    }));
    setNewSalaryAmount("");
    setNewSalaryDay("");
    setSaveError("");
  };

  const updateSalary = (index: number, nextSalary: Partial<FinancialSalaryDraft>) => {
    setDraft((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        salaries: prev.financial.salaries.map((salary, itemIndex) =>
          itemIndex === index ? { ...salary, ...nextSalary } : salary,
        ),
      },
    }));
  };

  const removeSalary = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        salaries: prev.financial.salaries.filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  };

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true" onClick={requestClose}>
      <section className="settings-panel" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="settings-close-button"
          onClick={requestClose}
          aria-label="Cerrar configuracion"
          disabled={isSaving}
        >
          x
        </button>
        <h2 className="settings-title">Configuración</h2>
        <div className="settings-body">
          <nav className="settings-menu" aria-label="Opciones de configuracion">
            {SETTINGS_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`settings-menu-item ${activeSection === option.key ? "active" : ""}`}
                onClick={() => setActiveSection(option.key)}
              >
                {option.label}
              </button>
            ))}
          </nav>
          <section className="settings-content">
            <SettingsSectionContent
              section={activeSection}
              user={user}
              draft={draft}
              newSalaryAmount={newSalaryAmount}
              newSalaryDay={newSalaryDay}
              onNewSalaryAmountChange={setNewSalaryAmount}
              onNewSalaryDayChange={setNewSalaryDay}
              onDraftChange={setDraft}
              onAddSalary={addSalary}
              onUpdateSalary={updateSalary}
              onRemoveSalary={removeSalary}
            />
          </section>
        </div>
        <footer className="settings-footer">
          {saveError ? <p className="settings-error">{saveError}</p> : null}
          <button type="button" className="settings-save-button" onClick={applyAndSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </footer>
      </section>
      {isExitAlertOpen ? (
        <PopUpAlerta
          title="Cambios sin guardar"
          message="Hay cambios en memoria que no se han guardado. Si sales ahora se perderan."
          confirmText="Salir sin guardar"
          cancelText="Cancelar"
          onCancel={() => setIsExitAlertOpen(false)}
          onConfirm={() => {
            setIsExitAlertOpen(false);
            onClose();
          }}
        />
      ) : null}
    </div>
  );
}

type SettingsSectionContentProps = {
  section: SettingsSection;
  user: AuthenticatedUser;
  draft: SettingsDraft;
  newSalaryAmount: string;
  newSalaryDay: string;
  onNewSalaryAmountChange: (value: string) => void;
  onNewSalaryDayChange: (value: string) => void;
  onDraftChange: (updater: (prev: SettingsDraft) => SettingsDraft) => void;
  onAddSalary: () => void;
  onUpdateSalary: (index: number, nextSalary: Partial<FinancialSalaryDraft>) => void;
  onRemoveSalary: (index: number) => void;
};

function SettingsSectionContent({
  section,
  user,
  draft,
  newSalaryAmount,
  newSalaryDay,
  onNewSalaryAmountChange,
  onNewSalaryDayChange,
  onDraftChange,
  onAddSalary,
  onUpdateSalary,
  onRemoveSalary,
}: SettingsSectionContentProps) {
  if (section === "general") {
    return (
      <div className="settings-section">
        <h3>General</h3>
        <p>Preferencias base de la cuenta y visualizacion.</p>
        <label>
          Idioma
          <select
            value={draft.general.language}
            onChange={(event) =>
              onDraftChange((prev) => ({
                ...prev,
                general: {
                  ...prev.general,
                  language: event.target.value,
                },
              }))
            }
          >
            <option value="es-ES">Español</option>
            <option value="en-US">English</option>
          </select>
        </label>
        <label>
          Zona horaria
          <select
            value={draft.general.timezone}
            onChange={(event) =>
              onDraftChange((prev) => ({
                ...prev,
                general: {
                  ...prev.general,
                  timezone: event.target.value,
                },
              }))
            }
          >
            <option value="Europe/Madrid">Europe/Madrid</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
      </div>
    );
  }

  if (section === "financial") {
    return (
      <div className="settings-section">
        <h3>Datos financieros</h3>
        <p>Porcentajes y sueldos con dia de cobro.</p>

        <div className="financial-grid">
          <label>
            % Gastos
            <input
              type="text"
              inputMode="decimal"
              value={draft.financial.pctGastos}
              onChange={(event) =>
                onDraftChange((prev) => ({
                  ...prev,
                  financial: {
                    ...prev.financial,
                    pctGastos: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label>
            % Ahorro
            <input
              type="text"
              inputMode="decimal"
              value={draft.financial.pctAhorro}
              onChange={(event) =>
                onDraftChange((prev) => ({
                  ...prev,
                  financial: {
                    ...prev.financial,
                    pctAhorro: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label>
            % Inversion
            <input
              type="text"
              inputMode="decimal"
              value={draft.financial.pctInversion}
              onChange={(event) =>
                onDraftChange((prev) => ({
                  ...prev,
                  financial: {
                    ...prev.financial,
                    pctInversion: event.target.value,
                  },
                }))
              }
            />
          </label>
        </div>

        <label>
          Capital fijo tarjeta Ineco (mensual)
          <input type="text" value={`${draft.financial.inecoFijoMensual}€`} readOnly />
        </label>

        <div className="salary-block">
          <p className="salary-title">Sueldos</p>
          <div className="salary-input-row">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Monto"
              value={newSalaryAmount}
              onChange={(event) => onNewSalaryAmountChange(event.target.value)}
            />
            <input
              type="number"
              min={1}
              max={31}
              placeholder="Dia"
              value={newSalaryDay}
              onChange={(event) => onNewSalaryDayChange(event.target.value)}
            />
            <button type="button" className="settings-secondary-btn" onClick={onAddSalary}>
              Añadir
            </button>
          </div>
          {draft.financial.salaries.length === 0 ? (
            <p className="salary-empty">No hay sueldos añadidos.</p>
          ) : (
            <ul className="salary-list">
              {draft.financial.salaries.map((salary, index) => (
                <li key={`${salary.id ?? "new"}-${index}`} className="salary-item">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={salary.monto}
                    onChange={(event) =>
                      onUpdateSalary(index, {
                        monto: event.target.value,
                      })
                    }
                    aria-label={`Sueldo ${index + 1}`}
                  />
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={salary.diaCobro}
                    onChange={(event) =>
                      onUpdateSalary(index, {
                        diaCobro: event.target.value,
                      })
                    }
                    aria-label={`Dia de cobro ${index + 1}`}
                  />
                  <button type="button" className="salary-remove-button" onClick={() => onRemoveSalary(index)}>
                    x
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (section === "personal") {
    return (
      <div className="settings-section">
        <h3>Informacion personal</h3>
        <p>Datos de perfil visibles en la plataforma.</p>
        <label>
          Nombre visible
          <input
            type="text"
            value={draft.personal.displayName}
            onChange={(event) =>
              onDraftChange((prev) => ({
                ...prev,
                personal: {
                  ...prev.personal,
                  displayName: event.target.value,
                },
              }))
            }
          />
        </label>
        <label>
          Correo de contacto
          <input
            type="email"
            value={draft.personal.contactEmail}
            onChange={(event) =>
              onDraftChange((prev) => ({
                ...prev,
                personal: {
                  ...prev.personal,
                  contactEmail: event.target.value,
                },
              }))
            }
          />
        </label>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h3>Seguridad</h3>
      <p>Opciones de acceso y proteccion de la cuenta.</p>
      <label>
        Cambiar contraseña
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={draft.security.newPassword}
          onChange={(event) =>
            onDraftChange((prev) => ({
              ...prev,
              security: {
                ...prev.security,
                newPassword: event.target.value,
              },
            }))
          }
        />
      </label>
      <button type="button" className="settings-secondary-btn">
        Cerrar sesiones activas
      </button>
      <p className="security-note">Usuario: {user.nombre}</p>
    </div>
  );
}

function isDraftDirty(current: SettingsDraft, initial: SettingsDraft): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial);
}
