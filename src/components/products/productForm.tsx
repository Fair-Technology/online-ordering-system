import { useMemo } from 'react';

export const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tmp-${Math.random().toString(36).slice(2, 10)}`;

export type MoneyInput = {
  amount: number;
  currency?: string;
};

export type VariantDraft = {
  id: string;
  name: string;
  basePrice: MoneyInput;
  isActive: boolean;
};

export type VariantGroupDraft = {
  id: string;
  name: string;
  variants: VariantDraft[];
};

export type AddonOptionDraft = {
  id: string;
  name: string;
  priceDelta: MoneyInput;
  isActive: boolean;
};

export type AddonGroupDraft = {
  id: string;
  name: string;
  required: boolean;
  maxSelectable?: number;
  options: AddonOptionDraft[];
};

export type ProductFormState = {
  title: string;
  description: string;
  isActive: boolean;
  variantGroups: VariantGroupDraft[];
  addonGroups: AddonGroupDraft[];
  defaultCurrency: string;
  selectedCategoryIds: string[];
  simplePriceAmount: string;
  simplePriceCurrency: string;
};

export const defaultMoney = (currency = 'USD'): MoneyInput => ({
  amount: 0,
  currency,
});

export const emptyVariant = (currency = 'USD'): VariantDraft => ({
  id: createId(),
  name: '',
  basePrice: defaultMoney(currency),
  isActive: true,
});

export const emptyVariantGroup = (currency = 'USD'): VariantGroupDraft => ({
  id: createId(),
  name: 'Primary sizes',
  variants: [emptyVariant(currency)],
});

export const emptyAddonOption = (
  currency = 'USD',
  name = 'Extra shot'
): AddonOptionDraft => ({
  id: createId(),
  name,
  priceDelta: defaultMoney(currency),
  isActive: true,
});

export const emptyAddonGroup = (currency = 'USD'): AddonGroupDraft => ({
  id: createId(),
  name: 'Add-ons',
  required: false,
  maxSelectable: 0,
  options: [emptyAddonOption(currency)],
});

export const createDefaultProductFormState = (): ProductFormState => ({
  title: '',
  description: '',
  isActive: true,
  variantGroups: [],
  addonGroups: [],
  defaultCurrency: 'USD',
  selectedCategoryIds: [],
  simplePriceAmount: '',
  simplePriceCurrency: 'USD',
});

export const useHasAtLeastOneVariant = (variantGroups: VariantGroupDraft[]) =>
  useMemo(
    () =>
      variantGroups.some((group) =>
        group.variants.some((variant) => variant.name.trim())
      ),
    [variantGroups]
  );

export const StepIndicator = ({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) => (
  <div className="flex justify-between gap-3 text-xs font-medium text-gray-500">
    {steps.map((step, index) => {
      const stepNumber = index + 1;
      const isCurrent = stepNumber === currentStep;
      const isComplete = stepNumber < currentStep;
      return (
        <div key={step} className="flex-1">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
              isCurrent
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : isComplete
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white'
            }`}
          >
            <span>{stepNumber}</span>
            <span className="truncate">{step}</span>
          </div>
        </div>
      );
    })}
  </div>
);

export const VariantGroupsEditor = ({
  groups,
  onChange,
  defaultCurrency = 'USD',
}: {
  groups: VariantGroupDraft[];
  onChange: (next: VariantGroupDraft[]) => void;
  defaultCurrency?: string;
}) => {
  const updateGroup = (groupId: string, updates: Partial<VariantGroupDraft>) => {
    onChange(
      groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
  };

  const updateVariant = (
    groupId: string,
    variantId: string,
    updates: Partial<VariantDraft>
  ) => {
    onChange(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              variants: group.variants.map((variant) =>
                variant.id === variantId ? { ...variant, ...updates } : variant
              ),
            }
          : group
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Variant groups</p>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:underline"
          onClick={() => onChange([...groups, emptyVariantGroup(defaultCurrency)])}
        >
          Add group
        </button>
      </div>
      {groups.map((group) => (
        <div key={group.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">
              Group name
            </label>
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={() =>
                onChange(groups.filter((candidate) => candidate.id !== group.id))
              }
            >
              Delete group
            </button>
          </div>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            value={group.name}
            onChange={(event) =>
              updateGroup(group.id, { name: event.target.value })
            }
          />
          <div className="space-y-2">
            {group.variants.map((variant) => (
              <div
                key={variant.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 grid gap-3 md:grid-cols-4"
              >
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Variant name
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    value={variant.name}
                    onChange={(event) =>
                      updateVariant(group.id, variant.id, {
                        name: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    value={variant.basePrice.amount}
                    onChange={(event) =>
                      updateVariant(group.id, variant.id, {
                        basePrice: {
                          ...variant.basePrice,
                          amount: Number(event.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Currency
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 uppercase"
                    value={variant.basePrice.currency ?? 'USD'}
                    onChange={(event) =>
                      updateVariant(group.id, variant.id, {
                        basePrice: {
                          ...variant.basePrice,
                          currency: event.target.value.toUpperCase(),
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">
                    Active
                  </label>
                  <input
                    type="checkbox"
                    checked={variant.isActive}
                    onChange={(event) =>
                      updateVariant(group.id, variant.id, {
                        isActive: event.target.checked,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-xs font-medium text-blue-600 hover:underline"
            onClick={() =>
              updateGroup(group.id, {
                variants: [
                  ...group.variants,
                  emptyVariant(defaultCurrency),
                ],
              })
            }
          >
            Add variant
          </button>
        </div>
      ))}
    </div>
  );
};

export const AddonGroupsEditor = ({
  groups,
  onChange,
  defaultCurrency = 'USD',
}: {
  groups: AddonGroupDraft[];
  onChange: (next: AddonGroupDraft[]) => void;
  defaultCurrency?: string;
}) => {
  const updateGroup = (groupId: string, updates: Partial<AddonGroupDraft>) => {
    onChange(
      groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
  };

  const updateOption = (
    groupId: string,
    optionId: string,
    updates: Partial<AddonOptionDraft>
  ) => {
    onChange(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, ...updates } : option
              ),
            }
          : group
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Addon groups</p>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:underline"
          onClick={() => onChange([...groups, emptyAddonGroup(defaultCurrency)])}
        >
          Add group
        </button>
      </div>
      {groups.map((group) => (
        <div key={group.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">
              Group name
            </label>
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={() =>
                onChange(groups.filter((candidate) => candidate.id !== group.id))
              }
            >
              Delete group
            </button>
          </div>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            value={group.name}
            onChange={(event) =>
              updateGroup(group.id, { name: event.target.value })
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Required
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={group.required}
                  onChange={(event) =>
                    updateGroup(group.id, { required: event.target.checked })
                  }
                />
                <span className="text-xs text-gray-600">Must pick one</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Max selectable
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={group.maxSelectable ?? 0}
                onChange={(event) =>
                  updateGroup(group.id, {
                    maxSelectable: Number(event.target.value),
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            {group.options.map((option) => (
              <div
                key={option.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 grid gap-3 md:grid-cols-4"
              >
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Option name
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    value={option.name}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        name: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    value={option.priceDelta.amount}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        priceDelta: {
                          ...option.priceDelta,
                          amount: Number(event.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Currency
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 uppercase"
                    value={option.priceDelta.currency ?? 'USD'}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        priceDelta: {
                          ...option.priceDelta,
                          currency: event.target.value.toUpperCase(),
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">
                    Active
                  </label>
                  <input
                    type="checkbox"
                    checked={option.isActive}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        isActive: event.target.checked,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-xs font-medium text-blue-600 hover:underline"
            onClick={() =>
              updateGroup(group.id, {
                options: [
                  ...group.options,
                  emptyAddonOption(defaultCurrency),
                ],
              })
            }
          >
            Add option
          </button>
        </div>
      ))}
    </div>
  );
};
