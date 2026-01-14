/**
 * API Key Scopes Selector Component
 */

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SCOPE_CATEGORIES, SCOPE_DESCRIPTIONS, SCOPE_ICONS, API_KEY_SCOPES } from '../types'

interface ScopesSelectorProps {
  selectedScopes: string[]
  onScopesChange: (scopes: string[]) => void
  disabled?: boolean
}

export function ScopesSelector({
  selectedScopes,
  onScopesChange,
  disabled,
}: ScopesSelectorProps) {
  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      onScopesChange(selectedScopes.filter((s) => s !== scope))
    } else {
      onScopesChange([...selectedScopes, scope])
    }
  }

  const selectAll = () => {
    onScopesChange([...API_KEY_SCOPES])
  }

  const clearAll = () => {
    onScopesChange([])
  }

  const toggleCategory = (categoryScopes: readonly string[]) => {
    const allSelected = categoryScopes.every((s) => selectedScopes.includes(s))
    if (allSelected) {
      onScopesChange(selectedScopes.filter((s) => !categoryScopes.includes(s)))
    } else {
      const newScopes = new Set([...selectedScopes, ...categoryScopes])
      onScopesChange([...newScopes])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Scopes *</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            disabled={disabled}
            className="text-xs h-7"
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs h-7"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden divide-y">
        {Object.entries(SCOPE_CATEGORIES).map(([category, scopes]) => {
          const categorySelected = scopes.filter((s) => selectedScopes.includes(s)).length
          const allCategorySelected = categorySelected === scopes.length

          return (
            <div key={category} className="bg-card">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(scopes)}
                disabled={disabled}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {SCOPE_ICONS[category] || '🔑'}
                  </span>
                  <span className="font-medium text-sm">{category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {categorySelected}/{scopes.length}
                  </span>
                  <Checkbox
                    checked={allCategorySelected}
                    onCheckedChange={() => toggleCategory(scopes)}
                    disabled={disabled}
                  />
                </div>
              </button>

              {/* Scopes */}
              <div className="px-3 pb-3 space-y-1">
                {scopes.map((scope) => (
                  <label
                    key={scope}
                    className={`
                      flex items-center gap-3 p-2.5 rounded-lg cursor-pointer
                      transition-colors hover:bg-muted/50
                      ${selectedScopes.includes(scope) ? 'bg-primary/5' : ''}
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <Checkbox
                      checked={selectedScopes.includes(scope)}
                      onCheckedChange={() => toggleScope(scope)}
                      disabled={disabled}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{scope}</p>
                      <p className="text-xs text-muted-foreground">
                        {SCOPE_DESCRIPTIONS[scope as keyof typeof SCOPE_DESCRIPTIONS]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selectedScopes.length === 0 && (
        <p className="text-xs text-destructive">At least one scope is required</p>
      )}
    </div>
  )
}
