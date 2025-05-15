import React, { createContext, useContext, useState } from 'react';
import { Grupo } from '../models/Group';

// export interface Grupo {
//   id: string;
//   nombre: string;
// }

interface GroupsContextType {
  grupos: Grupo[];
  setGrupos: React.Dispatch<React.SetStateAction<Grupo[]>>;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export const GroupsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  return (
    <GroupsContext.Provider value={{ grupos, setGrupos }}>
      {children}
    </GroupsContext.Provider>
  );
};

export const useGroups = (): GroupsContextType => {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error('useGroups debe usarse dentro de un GroupsProvider');
  }
  return context;
};
