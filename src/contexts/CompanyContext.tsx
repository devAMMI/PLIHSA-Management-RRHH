import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  name: string;
  code: string;
}

interface CompanyContextType {
  activeCompany: Company | null;
  allCompanies: Company[];
  setActiveCompany: (company: Company) => void;
  loading: boolean;
  canSwitchCompany: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, systemUser } = useAuth();
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const canSwitchCompany = systemUser?.role === 'superadmin' || systemUser?.role === 'rrhh';

  useEffect(() => {
    if (user && systemUser) {
      loadCompanies();
    }
  }, [user, systemUser]);

  const loadCompanies = async () => {
    try {
      setLoading(true);

      if (systemUser?.role === 'superadmin') {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name, code')
          .order('name') as unknown as { data: Company[] | null };

        setAllCompanies(companies || []);

        const savedCompanyId = localStorage.getItem('activeCompanyId');
        const savedCompany = companies?.find(c => c.id === savedCompanyId);

        if (savedCompany) {
          setActiveCompanyState(savedCompany);
        } else if (companies && companies.length > 0) {
          setActiveCompanyState(companies[0]);
        }
      } else {
        const { data: suData } = await supabase
          .from('system_users')
          .select('company_id, accessible_company_ids, companies(id, name, code)')
          .eq('user_id', user?.id || '')
          .maybeSingle() as unknown as { data: { company_id: string; accessible_company_ids: string[] | null; companies: Company } | null };

        if (suData?.companies) {
          const primaryCompany = suData.companies;
          const accessibleIds = suData.accessible_company_ids;

          let companiesList: Company[] = [primaryCompany];

          if (accessibleIds && accessibleIds.length > 0) {
            const { data: accessibleCompanies } = await supabase
              .from('companies')
              .select('id, name, code')
              .in('id', accessibleIds)
              .order('name') as unknown as { data: Company[] | null };

            if (accessibleCompanies) {
              const seen = new Set([primaryCompany.id]);
              companiesList = [primaryCompany, ...accessibleCompanies.filter(c => !seen.has(c.id) && seen.add(c.id))];
            }
          }

          setAllCompanies(companiesList);

          const savedCompanyId = localStorage.getItem('activeCompanyId');
          const savedCompany = companiesList.find(c => c.id === savedCompanyId);
          setActiveCompanyState(savedCompany || primaryCompany);
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const setActiveCompany = (company: Company) => {
    setActiveCompanyState(company);
    localStorage.setItem('activeCompanyId', company.id);
  };

  return (
    <CompanyContext.Provider
      value={{
        activeCompany,
        allCompanies,
        setActiveCompany,
        loading,
        canSwitchCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
