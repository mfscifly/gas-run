export const LITRES_PER_GALLON = 3.785411784;

export function gallonsToLitres(gallons: number): number {
  return gallons * LITRES_PER_GALLON;
}

export function litresToGallons(litres: number): number {
  return litres / LITRES_PER_GALLON;
}

export function usdPerGalToCadPerL(usdPerGal: number, fxUsdToCad: number): number {
  return (usdPerGal * fxUsdToCad) / LITRES_PER_GALLON;
}

export function cadPerLToUsdPerGal(cadPerL: number, fxUsdToCad: number): number {
  return (cadPerL / fxUsdToCad) * LITRES_PER_GALLON;
}

export type SavingsResult = {
  savingsCad: number;
  worthIt: boolean;
  cadEquivalentOfUsPrice: number;
};

export function calculateSavings(args: {
  tankSizeL: number;
  usdPerGal: number;
  cadPerL: number;
  fxUsdToCad: number;
}): SavingsResult {
  const cadEquivalentOfUsPrice = usdPerGalToCadPerL(args.usdPerGal, args.fxUsdToCad);
  const perLitreSavings = args.cadPerL - cadEquivalentOfUsPrice;
  const savingsCad = Math.round(perLitreSavings * args.tankSizeL * 100) / 100;
  return {
    savingsCad,
    worthIt: savingsCad > 0,
    cadEquivalentOfUsPrice: Math.round(cadEquivalentOfUsPrice * 1000) / 1000,
  };
}
