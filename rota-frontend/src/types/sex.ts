// types/sex.ts
export const Sex = {
  Male: 'M',
  Female: 'F',
  NotSpecified: 'N',
  Other: 'O',
} as const;

export type Sex = typeof Sex[keyof typeof Sex];

export const sexOptions: { value: Sex; label: string }[] = [
  { value: Sex.Male,         label: 'Masculino' },
  { value: Sex.Female,       label: 'Feminino' },
  { value: Sex.NotSpecified, label: 'Não especificado' },
  { value: Sex.Other,        label: 'Outro' },
];
