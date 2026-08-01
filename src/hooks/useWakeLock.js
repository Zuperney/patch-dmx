import { useEffect, useRef, useState } from "react";

/* Mantém a tela acesa via Screen Wake Lock API. O sistema solta o lock
   quando a aba perde visibilidade; readquirimos ao voltar. */
export function useWakeLock() {
  const suportado = typeof navigator !== "undefined" && "wakeLock" in navigator;
  const [ativo, setAtivo] = useState(false);
  const lock = useRef(null);
  const querido = useRef(false);

  const pedir = async () => {
    try {
      lock.current = await navigator.wakeLock.request("screen");
      lock.current.addEventListener("release", () => setAtivo(false));
      setAtivo(true);
    } catch {
      setAtivo(false);
    }
  };

  const alternar = () => {
    if (querido.current) {
      querido.current = false;
      lock.current?.release();
      lock.current = null;
      setAtivo(false);
    } else {
      querido.current = true;
      pedir();
    }
  };

  useEffect(() => {
    const aoVoltar = () => {
      if (querido.current && document.visibilityState === "visible") pedir();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      lock.current?.release();
    };
  }, []);

  return { suportado, ativo, alternar };
}
