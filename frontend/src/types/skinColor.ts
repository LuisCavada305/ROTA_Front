export const SkinColor = {
  White: 'BR',
  Black: 'PR',
  Brown: 'PA',
  Yellow: 'AM',
  Indigenous: 'IN',
  Other: 'OU',
  NotSpecified: 'NS',
} as const;

export type SkinColor = typeof SkinColor[keyof typeof SkinColor];

export const skinColorOptions: { value: SkinColor; label: string }[] = [
  { value: SkinColor.Yellow,       label: 'Amarela' },
  { value: SkinColor.White,        label: 'Branca' },
  { value: SkinColor.Indigenous,   label: 'Indígena' },
  { value: SkinColor.Brown,        label: 'Parda' },
  { value: SkinColor.Black,        label: 'Preta' },
  { value: SkinColor.Other,        label: 'Outra' },
  { value: SkinColor.NotSpecified, label: 'Prefiro não responder' },
];
