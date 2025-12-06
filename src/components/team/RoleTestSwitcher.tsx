import { useState } from 'react';
import { TestTube, RotateCcw, ChevronDown } from 'lucide-react';
import { Role, TestRole, TEST_ROLES, getRoleColor, ROLE_COLORS, canSwitchToTestMode, isTestRole, getBaseRole } from '../../lib/permissions';

interface RoleTestSwitcherProps {
  currentRole: Role;
  activeTestRole: TestRole | null;
  onSwitchToTest: (testRole: TestRole) => void;
  onSwitchBack: () => void;
}

export function RoleTestSwitcher({ currentRole, activeTestRole, onSwitchToTest, onSwitchBack }: RoleTestSwitcherProps) {
  const [showMenu, setShowMenu] = useState(false);

  if (!canSwitchToTestMode(currentRole)) {
    return null;
  }

  const currentRoleColor = ROLE_COLORS[currentRole];
  const activeTestRoleColor = activeTestRole ? getRoleColor(activeTestRole) : null;

  return (
    <div className="relative">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <TestTube className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Test Mode</h3>
            <p className="text-xs text-gray-600 mb-3">
              Als {currentRoleColor.label} kun je tijdelijk schakelen naar andere rollen om functies te testen.
            </p>

            {activeTestRole ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-600">Actieve test rol:</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${activeTestRoleColor?.bg} ${activeTestRoleColor?.text}`}>
                    {activeTestRoleColor?.label}
                  </span>
                </div>
                <button
                  onClick={onSwitchBack}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Terug naar {currentRoleColor.label}
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <TestTube className="w-3.5 h-3.5" />
                  Selecteer test rol
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-40 max-h-80 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {TEST_ROLES.map((testRole) => {
                          const baseRole = getBaseRole(testRole);
                          const roleColor = getRoleColor(testRole);
                          return (
                            <button
                              key={testRole}
                              onClick={() => {
                                onSwitchToTest(testRole);
                                setShowMenu(false);
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                                  {roleColor.label}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
