import React, { useState } from 'react';
import type { PolicyRule, Resource } from '../types';
import { api } from '../services/api';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';

interface PolicyStudioTabProps {
  policies: PolicyRule[];
  resources: Resource[];
  onRefresh: () => void;
}

export const PolicyStudioTab: React.FC<PolicyStudioTabProps> = ({ policies, resources, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newRuleDesc, setNewRuleDesc] = useState<string>('');
  const [maxRisk, setMaxRisk] = useState<number>(50);
  const [requireMfa, setRequireMfa] = useState<boolean>(true);

  const handleTogglePolicy = async (pol: PolicyRule) => {
    try {
      await api.createPolicy({
        ...pol,
        enabled: !pol.enabled,
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPolicy({
        name: newRuleName,
        description: newRuleDesc,
        max_risk_allowed: maxRisk,
        require_mfa: requireMfa,
        allow_after_hours: false,
        enabled: true,
      });
      setShowAddModal(false);
      setNewRuleName('');
      setNewRuleDesc('');
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Add Action */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-[24px] font-bold text-[#101828] tracking-[-0.01em]">
            Authorization Policies
          </h1>
          <p className="text-[13px] text-[#667085] mt-1">
            Rules evaluated during each access request. Changes hot-reload across PEP gatekeepers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-medium transition cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Rule</span>
        </button>
      </div>

      {/* Clean Minimalist Policy Table */}
      <div className="bg-white rounded-xl border border-[#eaecf0] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#eaecf0] text-[11px] font-semibold text-[#667085] uppercase tracking-wider bg-[#fafbfc]">
              <th className="py-3 px-4">Policy</th>
              <th className="py-3 px-4">Max Risk</th>
              <th className="py-3 px-4">MFA</th>
              <th className="py-3 px-4">Schedule</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaecf0]">
            {policies.map((p) => (
              <tr key={p.id} className="hover:bg-[#fafbfc] transition">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#101828]">{p.name}</div>
                  <div className="text-[12px] text-[#667085] line-clamp-1">{p.description}</div>
                </td>
                <td className="py-3.5 px-4 font-mono font-medium text-[#101828]">
                  &le; {p.max_risk_allowed}
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px]">
                  {p.require_mfa ? (
                    <span className="text-[#b45309] font-semibold">Required</span>
                  ) : (
                    <span className="text-[#667085]">Conditional</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-[12px] text-[#667085]">
                  {p.allow_after_hours ? '24/7' : '08:00 - 18:00'}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleTogglePolicy(p)}
                    className="text-[#98a2b3] hover:text-[#101828] cursor-pointer inline-block"
                  >
                    {p.enabled ? (
                      <ToggleRight className="w-7 h-7 text-[#2563eb]" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-[#d0d5dd]" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-[#eaecf0]">
            <h3 className="text-[15px] font-semibold text-[#101828] mb-1">New Policy Rule</h3>
            <p className="text-[12px] text-[#667085] mb-4">Define a new PDP constraint.</p>

            <form onSubmit={handleCreatePolicy} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-[#667085] block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Remote Worker MFA Constraint"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full text-[13px] px-3 py-2 rounded-lg border border-[#d0d5dd] outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#667085] block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Policy explanation..."
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  className="w-full text-[13px] p-2.5 rounded-lg border border-[#d0d5dd] outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#667085] block mb-1">Max Risk Allowed</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={maxRisk}
                  onChange={(e) => setMaxRisk(Number(e.target.value))}
                  className="w-full text-[13px] px-3 py-1.5 rounded-lg border border-[#d0d5dd]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-lg border border-[#d0d5dd] text-[13px] text-[#344054] hover:bg-[#fafbfc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#2563eb] text-white text-[13px] font-medium hover:bg-[#1d4ed8]"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
