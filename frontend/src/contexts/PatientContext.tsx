import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SelectedPatient {
  _id: string;
  name: string;
  patientCode?: string;
}

interface PatientContextType {
  selectedPatient: SelectedPatient | null;
  selectPatient: (patient: SelectedPatient) => void;
  clearPatient: () => void;
}

const PatientContext = createContext<PatientContextType>({
  selectedPatient: null,
  selectPatient: () => {},
  clearPatient: () => {},
});

export function PatientProvider({ children }: { children: ReactNode }) {
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(() => {
    try {
      const stored = sessionStorage.getItem('selectedPatient');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const selectPatient = useCallback((patient: SelectedPatient) => {
    setSelectedPatient(patient);
    sessionStorage.setItem('selectedPatient', JSON.stringify(patient));
  }, []);

  const clearPatient = useCallback(() => {
    setSelectedPatient(null);
    sessionStorage.removeItem('selectedPatient');
  }, []);

  return (
    <PatientContext.Provider value={{ selectedPatient, selectPatient, clearPatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export const usePatient = () => useContext(PatientContext);
