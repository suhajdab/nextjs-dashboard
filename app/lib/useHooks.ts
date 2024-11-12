import { useEffect } from "react";

export const useConsoleLog = (variable: unknown) => {
  useEffect(() => {
    console.log(variable);
  }, [variable]);
};
