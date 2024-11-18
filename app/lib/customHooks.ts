import { useEffect, useRef, useCallback } from "react";

export const useConsoleLog = (variable: unknown) => {
  useEffect(() => {
    console.log(variable);
  }, [variable]);
};
