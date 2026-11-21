import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightCores, darkCores } from './theme';

const ThemeContext = createContext({
  modo: 'claro',
  cores: lightCores,
  setModo: () => {},
  alternarModo: () => {},
});

const CHAVE_TEMA = '@evolua/tema';

export function ThemeProvider({ children }) {
  const [modo, setModoState] = useState('claro');

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_TEMA).then((salvo) => {
      if (salvo === 'escuro' || salvo === 'claro') setModoState(salvo);
    }).catch(() => {});
  }, []);

  const setModo = async (novo) => {
    setModoState(novo);
    try {
      await AsyncStorage.setItem(CHAVE_TEMA, novo);
    } catch (e) {}
  };

  const alternarModo = () => setModo(modo === 'claro' ? 'escuro' : 'claro');

  const cores = modo === 'escuro' ? darkCores : lightCores;

  return (
    <ThemeContext.Provider value={{ modo, cores, setModo, alternarModo }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
