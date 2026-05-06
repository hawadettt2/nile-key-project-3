import type { TranslationKeys } from './i18n';

export interface Site {
  titleKey: TranslationKeys;
  descriptionKey: TranslationKeys;
  url: string;
}

export interface SiteCategory {
  id: string; // slug
  titleKey: TranslationKeys;
  descriptionKey: TranslationKeys;
  icon: string; // lucide icon name
  sites: Site[];
}

export const defaultSiteCategories: SiteCategory[] = [
  {
    id: 'sovereign-platforms',
    titleKey: 'sitesCategorySovereign',
    descriptionKey: 'sitesCategorySovereign', // Assuming same key for desc
    icon: 'Shield',
    sites: [
      {
        titleKey: 'siteNafezaTitle',
        descriptionKey: 'siteNafezaDesc',
        url: 'https://www.nafeza.gov.eg/ar',
      },
      {
        titleKey: 'siteCapqTitle',
        descriptionKey: 'siteCapqDesc',
        url: 'http://www.capq.gov.eg/arabic/Pages/default.aspx',
      },
      {
        titleKey: 'siteCargoXTitle',
        descriptionKey: 'siteCargoXDesc',
        url: 'https://cargox.io/',
      },
    ],
  },
  {
    id: 'market-intelligence',
    titleKey: 'sitesCategoryMarketIntel',
    descriptionKey: 'sitesCategoryMarketIntel',
    icon: 'Search',
    sites: [
      {
        titleKey: 'siteTradeMapTitle',
        descriptionKey: 'siteTradeMapDesc',
        url: 'https://www.trademap.org/',
      },
      {
        titleKey: 'siteTridgeTitle',
        descriptionKey: 'siteTridgeDesc',
        url: 'https://www.tridge.com/',
      },
      {
        titleKey: 'siteFreshPlazaTitle',
        descriptionKey: 'siteFreshPlazaDesc',
        url: 'https://www.freshplaza.com/',
      },
      {
        titleKey: 'siteHsCodesTitle',
        descriptionKey: 'siteHsCodesDesc',
        url: 'https://www.trade-tariff.service.gov.uk/find_commodity',
      },
    ],
  },
  {
    id: 'logistics-tools',
    titleKey: 'sitesCategoryLogistics',
    descriptionKey: 'sitesCategoryLogistics',
    icon: 'Truck',
    sites: [
      {
        titleKey: 'siteTradlinxTitle',
        descriptionKey: 'siteTradlinxDesc',
        url: 'https://www.tradlinx.com/container-tracking',
      },
      {
        titleKey: 'siteSearatesTitle',
        descriptionKey: 'siteSearatesDesc',
        url: 'https://www.searates.com/container-tracking/',
      },
       {
        titleKey: 'siteAirCargoNewsTitle',
        descriptionKey: 'siteAirCargoNewsDesc',
        url: 'https://www.aircargonews.net/',
      },
    ],
  },
    {
    id: 'agricultural-sites',
    titleKey: 'sitesCategoryAgricultural',
    descriptionKey: 'sitesCategoryAgriculturalDesc',
    icon: 'Sprout',
    sites: [
      {
        titleKey: 'siteAecTitle',
        descriptionKey: 'siteAecDesc',
        url: 'http://www.aecegypt.com/',
      },
       {
        titleKey: 'siteNfsaTitle',
        descriptionKey: 'siteNfsaDesc',
        url: 'https://www.nfsa.gov.eg/ar',
      },
      {
        titleKey: 'siteHeiaGuideTitle',
        descriptionKey: 'siteHeiaGuideDesc',
        url: 'https://www.heia.org.eg/',
      },
    ],
  },
  {
    id: 'technical-inspiration',
    titleKey: 'sitesCategoryTechnical',
    descriptionKey: 'sitesCategoryTechnical',
    icon: 'Code',
    sites: [
       {
        titleKey: 'siteProject44Title',
        descriptionKey: 'siteProject44Desc',
        url: 'https://www.project44.com/resources/api-documentation/ocean-shipping',
      },
      {
        titleKey: 'siteFirestoreBestPracticesTitle',
        descriptionKey: 'siteFirestoreBestPracticesDesc',
        url: 'https://firebase.google.com/docs/firestore/best-practices',
      },
      {
        titleKey: 'siteAgriErpTitle',
        descriptionKey: 'siteAgriErpDesc',
        url: 'https://www.sap.com/africa/industries/agribusiness.html',
      },
       {
        titleKey: 'siteDribbbleFarmerUiTitle',
        descriptionKey: 'siteDribbbleFarmerUiDesc',
        url: 'https://dribbble.com/tags/farmer',
      },
    ],
  },
];
