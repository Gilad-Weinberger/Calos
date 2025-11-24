import React, { createContext, useCallback, useContext, useState } from "react";
import { calculateAgeFromDate } from "../../../lib/utils/date-helpers";

export interface FormData {
  planTarget: "calisthenics" | "specific_exercise" | null;
  specificExercise: string;
  trainingFocus: "upper" | "lower" | "all" | null;
  maxReps: {
    pushups: number;
    pullups: number;
    dips: number;
    squats: number;
  };
  birthDate: Date | null;
  height: number | null;
  heightUnit: "cm" | "ft";
  weight: number | null;
  weightUnit: "kg" | "lbs";
  activityLevel: "beginner" | "intermediate" | "advanced" | null;
  currentWorkoutDays: number | null;
  workoutsPerWeek: number | null;
  availableDays: number[]; // Array of day indices (0=Sunday, 6=Saturday)
  startDate: Date | null;
}

interface CreatePlanAIFormContextType {
  currentStep: number;
  formData: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  validateStep: (step: number) => boolean;
  getFormData: () => FormData;
  hasUnsavedChanges: () => boolean;
  resetForm: () => void;
}

const getInitialFormData = (): FormData => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    planTarget: null,
    specificExercise: "",
    trainingFocus: null,
    maxReps: {
      pushups: 0,
      pullups: 0,
      dips: 0,
      squats: 0,
    },
    birthDate: null,
    height: null,
    heightUnit: "cm",
    weight: null,
    weightUnit: "kg",
    activityLevel: null,
    currentWorkoutDays: null,
    workoutsPerWeek: null,
    availableDays: [],
    startDate: today,
  };
};

const CreatePlanAIFormContext = createContext<
  CreatePlanAIFormContextType | undefined
>(undefined);

export const useCreatePlanAIForm = () => {
  const context = useContext(CreatePlanAIFormContext);
  if (!context) {
    throw new Error(
      "useCreatePlanAIForm must be used within CreatePlanAIFormProvider"
    );
  }
  return context;
};

interface CreatePlanAIFormProviderProps {
  children: React.ReactNode;
}

export const CreatePlanAIFormProvider: React.FC<
  CreatePlanAIFormProviderProps
> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(getInitialFormData);

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const validateStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          // Must select plan target; if "specific exercise", exercise name required
          if (!formData.planTarget) return false;
          if (
            formData.planTarget === "specific_exercise" &&
            !formData.specificExercise.trim()
          )
            return false;
          return true;

        case 2:
          // Training focus required
          return formData.trainingFocus !== null;

        case 3:
          // All max reps required, min 0, max 1000
          const { pushups, pullups, dips, squats } = formData.maxReps;
          return (
            pushups >= 0 &&
            pushups <= 1000 &&
            pullups >= 0 &&
            pullups <= 1000 &&
            dips >= 0 &&
            dips <= 1000 &&
            squats >= 0 &&
            squats <= 1000
          );

        case 4:
          // Age required (18-100), height required (>0), weight required (>0)
          if (!formData.birthDate) {
            return false;
          }

          const age = calculateAgeFromDate(formData.birthDate);

          return (
            age >= 18 &&
            age <= 100 &&
            formData.height !== null &&
            formData.height > 0 &&
            formData.weight !== null &&
            formData.weight > 0
          );

        case 5:
          // Activity level required
          return formData.activityLevel !== null;

        case 6:
          // Workouts per week required (1-7)
          return (
            formData.workoutsPerWeek !== null &&
            formData.workoutsPerWeek >= 1 &&
            formData.workoutsPerWeek <= 7
          );

        case 7:
          // Must select at least workoutsPerWeek number of days
          if (!formData.workoutsPerWeek) return false;
          return (
            formData.availableDays.length >= formData.workoutsPerWeek &&
            formData.availableDays.length > 0
          );

        case 8:
          // Start date required, must be today or future
          if (!formData.startDate) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = new Date(formData.startDate);
          startDate.setHours(0, 0, 0, 0);
          return startDate >= today;

        default:
          return false;
      }
    },
    [formData]
  );

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 8) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep) && currentStep < 8) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, validateStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const getFormData = useCallback(() => {
    return formData;
  }, [formData]);

  const hasUnsavedChanges = useCallback(() => {
    return (
      formData.planTarget !== null ||
      formData.specificExercise !== "" ||
      formData.trainingFocus !== null ||
      formData.maxReps.pushups > 0 ||
      formData.maxReps.pullups > 0 ||
      formData.maxReps.dips > 0 ||
      formData.maxReps.squats > 0 ||
      formData.birthDate !== null ||
      formData.height !== null ||
      formData.weight !== null ||
      formData.activityLevel !== null ||
      (formData.currentWorkoutDays !== null &&
        formData.currentWorkoutDays > 0) ||
      formData.workoutsPerWeek !== null ||
      formData.availableDays.length > 0 ||
      formData.startDate !== null
    );
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setCurrentStep(1);
  }, []);

  const value: CreatePlanAIFormContextType = {
    currentStep,
    formData,
    updateField,
    goToStep,
    nextStep,
    previousStep,
    validateStep,
    getFormData,
    hasUnsavedChanges,
    resetForm,
  };

  return (
    <CreatePlanAIFormContext.Provider value={value}>
      {children}
    </CreatePlanAIFormContext.Provider>
  );
};
