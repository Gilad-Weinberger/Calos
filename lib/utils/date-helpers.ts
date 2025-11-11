export const calculateAgeFromDate = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

export const shiftYearsFromToday = (years: number): Date => {
  const today = new Date();
  const shifted = new Date(
    today.getFullYear() + years,
    today.getMonth(),
    today.getDate()
  );
  return shifted;
};
