// src/stores/logSessionStore.ts
import { create } from "zustand";
import type { AiLogResponse, AlimentoDetectado } from "@/types/ai-log";

type LogStep = "idle"|"capturing"|"uploading"|"analyzing"|"confirming"|"saving"|"done"|"error";
type MealType = "breakfast"|"lunch"|"dinner"|"snack";
type LoggingMethod = "photo"|"natural_text"|"manual"|"barcode";

interface LogSessionState {
  step: LogStep; method: LoggingMethod | null; mealType: MealType;
  photoUri: string | null; photoStoragePath: string | null;
  textInput: string | null; barcodeValue: string | null;
  aiResult: AiLogResponse | null; editedAlimentos: AlimentoDetectado[] | null;
  errorMessage: string | null;
  startPhotoCapture: (mt: MealType) => void;
  startTextLog: (mt: MealType) => void;
  startManualSearch: (mt: MealType) => void;
  startBarcodeScan: (mt: MealType) => void;
  setStep: (s: LogStep) => void;
  setField: <K extends keyof LogSessionState>(key: K, value: LogSessionState[K]) => void;
  setPhotoUri: (uri: string) => void;
  setPhotoStoragePath: (path: string) => void;
  setTextInput: (text: string) => void;
  setBarcodeValue: (barcode: string) => void;
  setAiResult: (result: AiLogResponse) => void;
  updateAlimento: (index: number, updates: Partial<AlimentoDetectado>) => void;
  removeAlimento: (index: number) => void;
  setError: (message: string) => void;
  reset: () => void;
}

const init = { step:"idle" as LogStep,method:null,mealType:"lunch" as MealType,photoUri:null,photoStoragePath:null,textInput:null,barcodeValue:null,aiResult:null,editedAlimentos:null,errorMessage:null };

export const useLogSessionStore = create<LogSessionState>((set, get) => ({
  ...init,
  startPhotoCapture: (mt) => set({ ...init, step:"capturing", method:"photo", mealType:mt }),
  startTextLog: (mt) => set({ ...init, step:"capturing", method:"natural_text", mealType:mt }),
  startManualSearch: (mt) => set({ ...init, step:"idle", method:"manual", mealType:mt }),
  startBarcodeScan: (mt) => set({ ...init, step:"capturing", method:"barcode", mealType:mt }),
  setStep: (s) => set({ step: s }),
  setField: (key, value) => set({ [key]: value } as Pick<LogSessionState, typeof key>),
  setPhotoUri: (uri) => set({ photoUri: uri }),
  setPhotoStoragePath: (path) => set({ photoStoragePath: path }),
  setTextInput: (text) => set({ textInput: text }),
  setBarcodeValue: (barcode) => set({ barcodeValue: barcode }),
  setAiResult: (result) => set({ aiResult: result, editedAlimentos: [...result.alimentos], step: "confirming" }),
  updateAlimento: (index, updates) => {
    const c = get().editedAlimentos; if (!c) return;
    const u = [...c]; u[index] = { ...u[index], ...updates };
    if (updates.cantidad_gramos) {
      const o = get().aiResult?.alimentos[index];
      if (o) { const r = updates.cantidad_gramos / o.cantidad_gramos;
        u[index].calorias_estimadas = Math.round(o.calorias_estimadas * r);
        u[index].proteina_g = Math.round(o.proteina_g * r * 10) / 10;
        u[index].carbohidratos_g = Math.round(o.carbohidratos_g * r * 10) / 10;
        u[index].grasa_g = Math.round(o.grasa_g * r * 10) / 10;
      }
    }
    set({ editedAlimentos: u });
  },
  removeAlimento: (index) => { const c = get().editedAlimentos; if (c) set({ editedAlimentos: c.filter((_,i)=>i!==index) }); },
  setError: (message) => set({ step: "error", errorMessage: message }),
  reset: () => set(init),
}));
