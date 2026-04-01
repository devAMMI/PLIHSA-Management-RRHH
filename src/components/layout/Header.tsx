import { Bell, Search, Building2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useCompany } from '../../contexts/CompanyContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { activeCompany, allCompanies, setActiveCompany, canSwitchCompany, loading } = useCompany();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 px-8 h-[104px] flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
          </div>

          {canSwitchCompany && !loading && activeCompany && (
            <div className="relative">
              <button
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium"
              >
                <Building2 className="w-4 h-4" />
                <span>{activeCompany.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showCompanyMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowCompanyMenu(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                      Cambiar Empresa
                    </div>
                    {allCompanies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => {
                          setActiveCompany(company);
                          setShowCompanyMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition flex items-center gap-2 ${
                          activeCompany.id === company.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-xs text-slate-500">{company.code}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {!canSwitchCompany && !loading && activeCompany && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{activeCompany.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-64"
            />
          </div>

          <button className="relative p-2 hover:bg-slate-100 rounded-lg transition">
            <Bell className="w-6 h-6 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
