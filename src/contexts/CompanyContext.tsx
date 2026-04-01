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
  const { user, userRole } = useAuth();
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const canSwitchCompany = userRole === 'superadmin';

  useEffect(() => {
    if (user) {
      loadCompanies();
    }
  }, [user, userRole]);

  const loadCompanies = async () => {
    try {
      setLoading(true);

      if (canSwitchCompany) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name, code')
          .order('name');

        setAllCompanies(companies || []);

        const savedCompanyId = localStorage.getItem('activeCompanyId');
        const savedCompany = companies?.find(c => c.id === savedCompanyId);

        if (savedCompany) {
          setActiveCompanyState(savedCompany);
        } else if (companies && companies.length > 0) {
          setActiveCompanyState(companies[0]);
        }
      } else {
        const { data: systemUser } = await supabase
          .from('system_users')
          .select('company_id, companies(id, name, code)')
          .eq('user_id', user?.id)
          .single();

        if (systemUser?.companies) {
          const company = systemUser.companies as unknown as Company;
          setActiveCompanyState(company);
          setAllCompanies([company]);
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
