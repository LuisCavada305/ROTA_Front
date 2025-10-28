// types/sex.ts
export const Sex = {
  ManCis: 'MC',
  ManTrans: 'MT',
  WomanCis: 'WC',
  WomanTrans: 'WT',
  Other: 'OT',
  NotSpecified: 'NS',
} as const;

export type Sex = typeof Sex[keyof typeof Sex];

export const sexOptions: { value: Sex; label: string }[] = [
  {
    value: Sex.ManCis,
    label: 'Homem Cis (se identifica com o gênero masculino atribuído ao nascer)',
  },
  {
    value: Sex.ManTrans,
    label:
      'Homem Trans (se identifica com o gênero masculino e recebeu outra designação ao nascer)',
  },
  {
    value: Sex.WomanCis,
    label: 'Mulher Cis (se identifica com o gênero feminino atribuído ao nascer)',
  },
  {
    value: Sex.WomanTrans,
    label:
      'Mulher Trans (se identifica com o gênero feminino e recebeu outra designação ao nascer)',
  },
  {
    value: Sex.Other,
    label: 'Outro (outra identidade de gênero com a qual você se identifica)',
  },
  { value: Sex.NotSpecified, label: 'Prefiro não responder' },
];
