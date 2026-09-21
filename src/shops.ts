export type ShopKind = "Asian grocery" | "American grocery" | "plant shop";

export type Shop = {
  name: string;
  kind: ShopKind;
  why: string;
  website: string;
  maps: string;
};

export type BuyChannel = "seed" | "grocery" | "nursery";

export type BuyPlace = {
  shop?: string;
  channel?: BuyChannel;
};

export const curatedShops: Shop[] = [
  {
    name: "H Mart",
    kind: "Asian grocery",
    why: "Asian greens, Thai basil, and bitter melon.",
    website: "https://www.hmart.com/store/cary-nc-27519/56106753-370a-42bd-b08f-1f87709ddfb2",
    maps: "https://www.google.com/maps/search/?api=1&query=H+Mart+1961+High+House+Rd+Cary+NC",
  },
  {
    name: "Harris Teeter",
    kind: "American grocery",
    why: "Everyday produce and common pot herbs.",
    website: "https://www.harristeeter.com/stores/grocery/nc/fuquay-varina/fuquay-crossing/097/00498",
    maps: "https://www.google.com/maps/search/?api=1&query=Harris+Teeter+1371+E+Broad+St+Fuquay-Varina+NC",
  },
  {
    name: "Logan's Garden Hut",
    kind: "plant shop",
    why: "Starts, shrubs, and trees for this Garden.",
    website: "https://www.logansgardenhut.com/",
    maps: "https://www.google.com/maps/search/?api=1&query=Logan%27s+Garden+Hut+1004+Old+Honeycutt+Road+Fuquay-Varina+NC",
  },
  {
    name: "Garden Supply Company",
    kind: "plant shop",
    why: "Trees, shrubs, and Bed soil from Cary for this Garden.",
    website: "https://www.gardensupplyco.com/",
    maps: "https://www.google.com/maps/search/?api=1&query=Garden+Supply+Company+1421+Old+Apex+Road+Cary+NC",
  },
  {
    name: "Fairview Garden Center",
    kind: "plant shop",
    why: "Trees and shrubs grown for this climate, a short drive up Holly Springs Road.",
    website: "https://fairviewgardencenter.com/",
    maps: "https://www.google.com/maps/search/?api=1&query=Fairview+Garden+Center+8224+Holly+Springs+Road+Raleigh+NC",
  },
];
