'use client';

import React, { useCallback } from "react";
import { X } from "lucide-react";
import Select, { SingleValue } from "react-select";
import { toast } from 'sonner';

type RuleAction =
  | { type: 'update'; index: number; value: string }
  | { type: 'add' }
  | { type: 'remove'; index: number };

type SetupFormState = {
  name: string;
  description: string;
  rules: string[];
  type: string;
  market: string;
  conditions: string;
};

type SetupFormProps = {
  initialData?: Partial<SetupFormState>;
  onCancel: () => void;
  onSave: (data: SetupFormState) => void;
};

type SelectOption = { value: string; label: string };

const typeOptions: SelectOption[] = [
  { value: 'Swing Trading', label: 'Swing Trading' },
  { value: 'Options Strategy', label: 'Options Strategy' },
  { value: 'Scalping', label: 'Scalping' },
  { value: 'Day Trading', label: 'Day Trading' },
];

const biasOptions: SelectOption[] = [
  { value: 'bullish', label: 'Bullish' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'bearish', label: 'Bearish' },
];

// Reducer to handle rules efficiently
function rulesReducer(state: string[], action: RuleAction): string[] {
  switch (action.type) {
    case 'update': {
      const newRules = [...state];
      newRules[action.index] = action.value;
      return newRules;
    }
    case 'add':
      return [...state, ''];
    case 'remove':
      if (state.length > 1) return state.filter((_, i) => i !== action.index);
      return state;
    default:
      return state;
  }
}

export default function SetupForm({ initialData, onCancel, onSave }: SetupFormProps) {
  const [state, setState] = React.useState<SetupFormState>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    rules: initialData?.rules || [''],
    type: initialData?.type || '',
    market: initialData?.market || '',
    conditions: initialData?.conditions || '',
  });

  const [rules, dispatchRules] = React.useReducer(rulesReducer, state.rules);

  const handleRuleChange = useCallback((index: number, value: string) => {
    dispatchRules({ type: 'update', index, value });
  }, []);

  const addRule = useCallback(() => dispatchRules({ type: 'add' }), []);
  const removeRule = useCallback((index: number) => dispatchRules({ type: 'remove', index }), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validRules = rules.filter(r => r.trim() !== '');
    onSave({ ...state, rules: validRules });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-white w-full max-w-md rounded-xl shadow-lg p-2 border border-slate-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[80vh] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
        >
          <div className="flex items-center mb-4">
            <div className="w-10" />
            <div className="flex-1 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {initialData ? "Edit Setup" : "Build Your New Setup"}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="w-10 flex items-center justify-center text-gray-600 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Setup Name <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={state.name}
              onChange={(e) =>
                setState((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Bull Flag Breakout"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              required
            />
          </div>

          {/* Type & Market */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Type <span className="text-orange-500">*</span>
              </label>
              <Select
                value={typeOptions.find((opt) => opt.value === state.type) || null}
                onChange={(opt: SingleValue<SelectOption>) =>
                  setState((prev) => ({ ...prev, type: opt?.value || '' }))
                }
                required
                options={typeOptions}
                placeholder="Select type"
                styles={{
                  control: (base) => ({ ...base, minHeight: 40, height: 31, fontSize: 14 }),
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Market Bias <span className="text-orange-500">*</span>
              </label>
              <Select
                value={biasOptions.find((opt) => opt.value === state.market) || null}
                onChange={(opt: SingleValue<SelectOption>) =>
                  setState((prev) => ({ ...prev, market: opt?.value || '' }))
                }
                required
                options={biasOptions}
                placeholder="Select bias"
                styles={{
                  control: (base) => ({ ...base, minHeight: 40, height: 31, fontSize: 14 }),
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Description <span className="text-orange-500">*</span>
            </label>
            <textarea
              value={state.description}
              onChange={(e) =>
                setState((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Brief description of setup ..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              required
            />
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Entry / Exit Rules <span className="text-orange-500">*</span>
            </label>
            {rules.map((rule, index) => (
              <RuleInput
                key={index}
                value={rule}
                index={index}
                onChange={handleRuleChange}
                onRemove={removeRule}
                removable={rules.length > 1}
              />
            ))}
            <button
              type="button"
              onClick={addRule}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              + Add Rule
            </button>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Market Conditions
            </label>
            <textarea
              value={state.conditions}
              onChange={(e) =>
                setState((prev) => ({ ...prev, conditions: e.target.value }))
              }
              placeholder="When to use this setup ..."
              rows={2}
              className="w-full px-3 py-2 text-gray-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {initialData ? "Update Setup" : "+ Create Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Memoized Rule Input with explicit displayName
type RuleInputProps = {
  value: string;
  index: number;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  removable: boolean;
};

const RuleInput = React.memo(function RuleInputComponent({
  value,
  index,
  onChange,
  onRemove,
  removable,
}: RuleInputProps) {
  return (
    <div className="flex gap-2 mb-2 items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
        placeholder={`Rule ${index + 1}`}
        className="flex-1 px-2 py-2 text-gray-900 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        required
      />
      {removable && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
});

RuleInput.displayName = "RuleInput";