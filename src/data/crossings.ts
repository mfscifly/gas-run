export type Province = "BC" | "AB" | "SK" | "MB" | "ON" | "QC" | "NB";

// StatCan surveys cities, not provinces, so prices are keyed to the surveyed
// market nearest each crossing rather than to its province. Ontario is the only
// province where this actually differs: Ottawa-Gatineau runs about 5 cents/L
// under Toronto, which is worth roughly $3 on a 60 L tank at Thousand Islands.
export type CaMarket =
  | "Vancouver"
  | "Calgary"
  | "Regina"
  | "Winnipeg"
  | "Toronto"
  | "ThunderBay"
  | "Ottawa"
  | "Montreal"
  | "SaintJohn";
export type UsState =
  | "WA"
  | "MT"
  | "ND"
  | "MN"
  | "MI"
  | "NY"
  | "VT"
  | "NH"
  | "ME";

export type Camera = {
  label: string;
  imageUrl: string;
  sourceUrl: string;
};

export type CameraSource = {
  label: string;
  url: string;
};

export type Crossing = {
  slug: string;
  name: string;
  province: Province;
  caMarket: CaMarket;      // StatCan market used for the Canadian price
  usState: UsState;
  cbpPortNumber: string | null;     // US-bound wait times (CBP feed)
  cbsaOffice: string | null;        // Canada-bound wait times (CBSA CSV "Customs Office")
  canadianTown: string;
  americanTown: string;
  cameras: Camera[];
  cameraSources: CameraSource[];
  notes?: string;
};

export type CaMarketPriceDefault = { cadPerL: number; updatedAt: string };
export type UsStatePriceDefault = { usdPerGal: number; updatedAt: string };

export const PROVINCE_LABELS: Record<Province, string> = {
  BC: "British Columbia",
  AB: "Alberta",
  SK: "Saskatchewan",
  MB: "Manitoba",
  ON: "Ontario",
  QC: "Quebec",
  NB: "New Brunswick",
};

export const CA_MARKET_LABELS: Record<CaMarket, string> = {
  Vancouver: "Vancouver",
  Calgary: "Calgary",
  Regina: "Regina",
  Winnipeg: "Winnipeg",
  Toronto: "Toronto",
  ThunderBay: "Thunder Bay",
  Ottawa: "Ottawa-Gatineau",
  Montreal: "Montreal",
  SaintJohn: "Saint John",
};

export const PROVINCE_ORDER: Province[] = [
  "BC",
  "AB",
  "SK",
  "MB",
  "ON",
  "QC",
  "NB",
];

const DRIVEBC = "https://www.drivebc.ca/cameras/";
const WSDOT_CAMS = "https://wsdot.com/travel/real-time/cameras";
const ON_511 = "https://511on.ca/cameras";
const NY_511 = "https://511ny.org/";
const MDOT_CAMS = "https://mdotjboss.state.mi.us/MiDrive/cameras";
const QC_511 = "https://www.quebec511.info/en/Carte/Default.aspx";
const NB_511 = "https://511.gnb.ca/en/cctv";
const AB_511 = "https://511.alberta.ca/list/cameras";
const SK_HOTLINE = "https://hotline.gov.sk.ca/map/";
const MB_511 = "https://www.manitoba511.ca/en/cctv";

// DriveBC retired images.drivebc.ca/bchighwaycam/pub/cameras/<id>.jpg. It still
// answers 200, but every id returns the same "no longer available" placeholder,
// so a dead feed renders as a valid image. Current stills come from
// /images/<id>.jpg on the main host (see /api/webcams/ -> links.imageDisplay).
const drivebcCam = (id: number, label: string): Camera => ({
  label,
  imageUrl: `https://www.drivebc.ca/images/${id}.jpg`,
  sourceUrl: `${DRIVEBC}${id}`,
});

const wsdotCam = (file: string, label: string): Camera => ({
  label,
  imageUrl: `https://images.wsdot.wa.gov/nw/${file}.jpg`,
  sourceUrl: WSDOT_CAMS,
});

const nyCam = (id: string, label: string): Camera => ({
  label,
  imageUrl: `https://nyssnapshot.com/${id}.png`,
  sourceUrl: NY_511,
});

export const CROSSINGS: Crossing[] = [
  {
    slug: "pacific-highway",
    name: "Pacific Highway",
    province: "BC",
    caMarket: "Vancouver",
    usState: "WA",
    cbpPortNumber: "300401",
    cbsaOffice: "Pacific Highway",
    canadianTown: "Surrey, BC",
    americanTown: "Blaine, WA",
    cameras: [
      drivebcCam(15, "BC side, Hwy 15 at Pacific Border Crossing"),
      wsdotCam("543vc00026", "WA side, SR 543 at the border"),
    ],
    cameraSources: [
      { label: "More on DriveBC", url: DRIVEBC },
      { label: "More on WSDOT", url: WSDOT_CAMS },
    ],
    notes: "Truck route; passenger lanes available.",
  },
  {
    slug: "peace-arch",
    name: "Peace Arch",
    province: "BC",
    caMarket: "Vancouver",
    usState: "WA",
    cbpPortNumber: "300402",
    cbsaOffice: "Douglas",
    canadianTown: "Surrey / White Rock, BC",
    americanTown: "Blaine, WA",
    cameras: [
      drivebcCam(13, "BC side, Hwy 99 at Peace Arch"),
      wsdotCam("005vc27650", "WA side, I-5 at MP 276.5"),
    ],
    cameraSources: [
      { label: "More on DriveBC", url: DRIVEBC },
      { label: "More on WSDOT", url: WSDOT_CAMS },
    ],
    notes: "Passenger only. No commercial vehicles.",
  },
  {
    slug: "point-roberts",
    name: "Point Roberts",
    province: "BC",
    caMarket: "Vancouver",
    usState: "WA",
    cbpPortNumber: "300403",
    cbsaOffice: "Boundary Bay",
    canadianTown: "Tsawwassen, BC",
    americanTown: "Point Roberts, WA",
    cameras: [],
    cameraSources: [
      { label: "DriveBC cameras", url: DRIVEBC },
      { label: "WSDOT cameras", url: WSDOT_CAMS },
    ],
    notes:
      "Pene-xclave; only useful if you live in Tsawwassen. No dedicated border cam.",
  },
  {
    slug: "sumas-huntingdon",
    name: "Sumas-Huntingdon",
    province: "BC",
    caMarket: "Vancouver",
    usState: "WA",
    cbpPortNumber: "300901",
    cbsaOffice: "Abbotsford-Huntingdon",
    canadianTown: "Abbotsford, BC",
    americanTown: "Sumas, WA",
    cameras: [
      drivebcCam(170, "BC side, Sumas-Huntingdon south"),
      wsdotCam("009vc09781", "WA side, SR 9 at the border"),
    ],
    cameraSources: [
      { label: "More on DriveBC", url: DRIVEBC },
      { label: "More on WSDOT", url: WSDOT_CAMS },
    ],
  },
  {
    slug: "lynden-aldergrove",
    name: "Lynden-Aldergrove",
    province: "BC",
    caMarket: "Vancouver",
    usState: "WA",
    cbpPortNumber: "302301",
    cbsaOffice: "Aldergrove",
    canadianTown: "Aldergrove, BC",
    americanTown: "Lynden, WA",
    cameras: [
      drivebcCam(169, "BC side, Aldergrove / Lynden south"),
      wsdotCam("539vc01510", "WA side, SR 539 near the border"),
    ],
    cameraSources: [
      { label: "More on DriveBC", url: DRIVEBC },
      { label: "More on WSDOT", url: WSDOT_CAMS },
    ],
  },

  {
    slug: "coutts-sweetgrass",
    name: "Coutts-Sweetgrass",
    province: "AB",
    caMarket: "Calgary",
    usState: "MT",
    cbpPortNumber: "331001",
    cbsaOffice: "Coutts",
    canadianTown: "Coutts, AB",
    americanTown: "Sweetgrass, MT",
    cameras: [],
    cameraSources: [
      { label: "511 Alberta cameras", url: AB_511 },
      { label: "MDT cameras", url: "https://www.mdt.mt.gov/travinfo/cameras/" },
    ],
    notes: "Main southern Alberta crossing, ~100 km south of Lethbridge.",
  },

  {
    slug: "north-portal",
    name: "North Portal-Portal",
    province: "SK",
    caMarket: "Regina",
    usState: "ND",
    cbpPortNumber: null,
    cbsaOffice: "North Portal",
    canadianTown: "North Portal, SK",
    americanTown: "Portal, ND",
    cameras: [],
    cameraSources: [
      { label: "Saskatchewan Highway Hotline", url: SK_HOTLINE },
      { label: "ND DOT cameras", url: "https://travel.dot.nd.gov/cctv" },
    ],
    notes: "CBP wait time not currently in feed; verify before relying on it.",
  },

  {
    slug: "emerson-pembina",
    name: "Emerson-Pembina",
    province: "MB",
    caMarket: "Winnipeg",
    usState: "ND",
    cbpPortNumber: "340101",
    cbsaOffice: "Emerson",
    canadianTown: "Emerson, MB",
    americanTown: "Pembina, ND",
    cameras: [],
    cameraSources: [
      { label: "Manitoba 511 cameras", url: MB_511 },
      { label: "ND DOT cameras", url: "https://travel.dot.nd.gov/cctv" },
    ],
    notes: "Manitoba's main southern crossing; 24/7.",
  },

  {
    slug: "fort-frances-international-falls",
    name: "Fort Frances-International Falls",
    province: "ON",
    caMarket: "ThunderBay",
    usState: "MN",
    cbpPortNumber: "360401",
    cbsaOffice: "Fort Frances Bridge",
    canadianTown: "Fort Frances, ON",
    americanTown: "International Falls, MN",
    cameras: [],
    cameraSources: [
      { label: "511 Ontario cameras", url: ON_511 },
      { label: "MnDOT 511", url: "https://511mn.org/" },
    ],
  },
  {
    slug: "sault-ste-marie",
    name: "Sault Ste. Marie International Bridge",
    province: "ON",
    caMarket: "ThunderBay",
    usState: "MI",
    cbpPortNumber: "380301",
    cbsaOffice: "Sault Ste. Marie",
    canadianTown: "Sault Ste. Marie, ON",
    americanTown: "Sault Ste. Marie, MI",
    cameras: [],
    cameraSources: [
      { label: "511 Ontario cameras", url: ON_511 },
      { label: "MDOT cameras", url: MDOT_CAMS },
    ],
  },
  {
    slug: "bluewater-bridge",
    name: "Blue Water Bridge",
    province: "ON",
    caMarket: "Toronto",
    usState: "MI",
    cbpPortNumber: "380201",
    cbsaOffice: "Blue Water Bridge",
    canadianTown: "Sarnia, ON",
    americanTown: "Port Huron, MI",
    cameras: [
      {
        label: "ON side, traffic exiting Canada",
        imageUrl: "https://wtbwb.ca/approach.jpg",
        sourceUrl: "https://bluewaterbridge.ca/traffic/",
      },
    ],
    cameraSources: [
      { label: "Blue Water Bridge cameras", url: "https://bluewaterbridge.ca/traffic/" },
      { label: "511 Ontario cameras", url: ON_511 },
      { label: "MDOT cameras", url: MDOT_CAMS },
    ],
  },
  {
    slug: "ambassador-bridge",
    name: "Ambassador Bridge",
    province: "ON",
    caMarket: "Toronto",
    usState: "MI",
    cbpPortNumber: "380001",
    cbsaOffice: "Ambassador Bridge",
    canadianTown: "Windsor, ON",
    americanTown: "Detroit, MI",
    cameras: [],
    cameraSources: [
      { label: "Ambassador Bridge live cams", url: "https://www.ambassadorbridge.com/bridge-condition/" },
      { label: "511 Ontario cameras", url: ON_511 },
      { label: "MDOT cameras", url: MDOT_CAMS },
    ],
    notes: "North America's busiest commercial crossing; bridge is privately owned, no public still images.",
  },
  {
    slug: "windsor-detroit-tunnel",
    name: "Detroit-Windsor Tunnel",
    province: "ON",
    caMarket: "Toronto",
    usState: "MI",
    cbpPortNumber: "380002",
    cbsaOffice: "Windsor and Detroit Tunnel",
    canadianTown: "Windsor, ON",
    americanTown: "Detroit, MI",
    cameras: [],
    cameraSources: [
      { label: "511 Ontario cameras", url: ON_511 },
      { label: "MDOT cameras", url: MDOT_CAMS },
    ],
    notes: "Passenger only.",
  },
  {
    slug: "peace-bridge",
    name: "Peace Bridge",
    province: "ON",
    caMarket: "Toronto",
    usState: "NY",
    cbpPortNumber: "090101",
    cbsaOffice: "Peace Bridge",
    canadianTown: "Fort Erie, ON",
    americanTown: "Buffalo, NY",
    cameras: [
      nyCam("TA_146", "NY side, I-190 approach to the bridge"),
    ],
    cameraSources: [
      { label: "Peace Bridge official cameras", url: "https://www.peacebridge.com/media-room/traffic-cameras/" },
      { label: "511 Ontario cameras", url: ON_511 },
      { label: "NY 511 cameras", url: NY_511 },
    ],
  },
  {
    slug: "rainbow-bridge",
    name: "Rainbow Bridge",
    province: "ON",
    caMarket: "Toronto",
    usState: "NY",
    cbpPortNumber: "090102",
    cbsaOffice: "Rainbow Bridge",
    canadianTown: "Niagara Falls, ON",
    americanTown: "Niagara Falls, NY",
    cameras: [
      nyCam("R5_102", "NY side, looking toward Canada"),
      nyCam("R5_103", "NY side, looking toward US"),
    ],
    cameraSources: [
      { label: "Niagara bridge traffic", url: "https://niagaratraffic.ca/bridge/" },
      { label: "511 Ontario cameras", url: ON_511 },
      { label: "NY 511 cameras", url: NY_511 },
    ],
    notes: "Passenger only.",
  },
  {
    slug: "lewiston-queenston",
    name: "Lewiston-Queenston Bridge",
    province: "ON",
    caMarket: "Toronto",
    usState: "NY",
    cbpPortNumber: "090104",
    cbsaOffice: "Queenston-Lewiston Bridge",
    canadianTown: "Queenston, ON",
    americanTown: "Lewiston, NY",
    cameras: [nyCam("R5_101", "NY side, US-bound approach")],
    cameraSources: [
      { label: "Niagara bridge traffic", url: "https://niagaratraffic.ca/bridge/" },
      { label: "511 Ontario cameras", url: ON_511 },
      { label: "NY 511 cameras", url: NY_511 },
    ],
  },
  {
    slug: "thousand-islands",
    name: "Thousand Islands Bridge",
    province: "ON",
    caMarket: "Ottawa",
    usState: "NY",
    cbpPortNumber: "070801",
    cbsaOffice: "Thousand Islands Bridge",
    canadianTown: "Lansdowne, ON",
    americanTown: "Alexandria Bay, NY",
    cameras: [],
    cameraSources: [
      { label: "511 Ontario cameras", url: ON_511 },
      { label: "NY 511 cameras", url: NY_511 },
    ],
  },

  {
    slug: "lacolle-champlain",
    name: "Saint-Bernard-de-Lacolle / Champlain",
    province: "QC",
    caMarket: "Montreal",
    usState: "NY",
    cbpPortNumber: "071201",
    cbsaOffice: "St-Bernard-de-Lacolle",
    canadianTown: "Lacolle, QC",
    americanTown: "Champlain, NY",
    cameras: [],
    cameraSources: [
      { label: "Quebec 511 cameras", url: QC_511 },
      { label: "NY 511 cameras", url: NY_511 },
    ],
    notes: "Quebec's main southern crossing, ~50 km south of Montreal.",
  },
  {
    slug: "stanstead-derby-line",
    name: "Stanstead / Derby Line (I-91)",
    province: "QC",
    caMarket: "Montreal",
    usState: "VT",
    cbpPortNumber: "020901",
    cbsaOffice: "Stanstead",
    canadianTown: "Stanstead, QC",
    americanTown: "Derby Line, VT",
    cameras: [],
    cameraSources: [
      { label: "Quebec 511 cameras", url: QC_511 },
      { label: "VT 511 cameras", url: "https://511vt.com/" },
    ],
  },
  {
    slug: "philipsburg-highgate-springs",
    name: "Philipsburg / Highgate Springs",
    province: "QC",
    caMarket: "Montreal",
    usState: "VT",
    cbpPortNumber: "021201",
    cbsaOffice: "St-Armand/Philipsburg",
    canadianTown: "Saint-Armand, QC",
    americanTown: "Highgate Springs, VT",
    cameras: [],
    cameraSources: [
      { label: "Quebec 511 cameras", url: QC_511 },
      { label: "VT 511 cameras", url: "https://511vt.com/" },
    ],
  },

  {
    slug: "st-stephen-calais",
    name: "St. Stephen / Calais (Ferry Point)",
    province: "NB",
    caMarket: "SaintJohn",
    usState: "ME",
    cbpPortNumber: "011501",
    cbsaOffice: "St. Stephen",
    canadianTown: "St. Stephen, NB",
    americanTown: "Calais, ME",
    cameras: [],
    cameraSources: [
      { label: "NB 511 cameras", url: NB_511 },
      { label: "Maine 511 cameras", url: "https://www.maine511.org/" },
    ],
  },
  {
    slug: "woodstock-houlton",
    name: "Woodstock / Houlton",
    province: "NB",
    caMarket: "SaintJohn",
    usState: "ME",
    cbpPortNumber: "010601",
    cbsaOffice: "Woodstock Road",
    canadianTown: "Woodstock, NB",
    americanTown: "Houlton, ME",
    cameras: [],
    cameraSources: [
      { label: "NB 511 cameras", url: NB_511 },
      { label: "Maine 511 cameras", url: "https://www.maine511.org/" },
    ],
  },
];

const CROSSING_BY_SLUG = new Map(CROSSINGS.map((c) => [c.slug, c]));

export function getCrossing(slug: string): Crossing | undefined {
  return CROSSING_BY_SLUG.get(slug);
}

export function crossingsByProvince(): Map<Province, Crossing[]> {
  const map = new Map<Province, Crossing[]>();
  for (const p of PROVINCE_ORDER) map.set(p, []);
  for (const c of CROSSINGS) map.get(c.province)!.push(c);
  return map;
}
