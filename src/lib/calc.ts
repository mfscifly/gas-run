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
  // CAD/L, rounded to the same 3dp precision as cadEquivalentOfUsPrice above.
  // Derived from the two ROUNDED per-litre prices (not the raw difference),
  // and savingsCad is derived from this same rounded value, so a reader who
  // multiplies the displayed gap by the tank size by hand always lands on the
  // displayed total. Single source of truth for the "Gap x tank = total" line.
  perLitreSavingsCad: number;
};

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export function calculateSavings(args: {
  tankSizeL: number;
  usdPerGal: number;
  cadPerL: number;
  fxUsdToCad: number;
}): SavingsResult {
  const cadEquivalentOfUsPrice = round(
    usdPerGalToCadPerL(args.usdPerGal, args.fxUsdToCad),
    3,
  );
  const cadPerLRounded = round(args.cadPerL, 3);
  const perLitreSavingsCad = round(cadPerLRounded - cadEquivalentOfUsPrice, 3);
  const savingsCad = round(perLitreSavingsCad * args.tankSizeL, 2);
  return {
    savingsCad,
    worthIt: savingsCad > 0,
    cadEquivalentOfUsPrice,
    perLitreSavingsCad,
  };
}
