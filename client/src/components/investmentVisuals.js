const providers = [
  {
    match: /\bhdfc\b/i,
    name: "HDFC",
    bank: "hdfc-bank.svg",
    fund: "hdfc-mf.png",
  },
  { match: /\bsbi\b/i, name: "SBI", bank: "sbi-bank.svg", fund: "sbi-mf.png" },
  { match: /nippon/i, name: "Nippon India Mutual Fund", fund: "nippon.webp" },
  { match: /icici/i, name: "ICICI Prudential Mutual Fund", fund: "icici.svg" },
  {
    match: /aditya birla/i,
    name: "Aditya Birla Sun Life Mutual Fund",
    fund: "aditya-birla.webp",
  },
  { match: /\baxis\b/i, name: "Axis Mutual Fund", fund: "axis.svg" },
  { match: /\bkotak\b/i, name: "Kotak Mutual Fund", fund: "kotak.svg" },
  { match: /post office/i, name: "India Post", fund: "india-post.svg" },
  {
    match: /edelweiss/i,
    name: "Edelweiss Mutual Fund",
    fund: "edelweiss.png",
    dark: true,
  },
  { match: /\bgroww\b/i, name: "Groww", fund: "groww.png", symbol: true },
  { match: /\bpaytm\b/i, name: "Paytm", fund: "paytm.svg" },
];

// Distinct artwork for each product without a named provider. Match on names,
// not catalogue row numbers, so reordering the backend catalogue is harmless.
const productIcons = [
  { match: /mahila samman/i, icon: "mahila-samman" },
  { match: /public provident|\bppf\b/i, icon: "provident-fund" },
  {
    match: /national savings certificate|\bnsc\b/i,
    icon: "savings-certificate",
  },
  { match: /kisan vikas|\bkvp\b/i, icon: "kisan-vikas" },
  { match: /sukanya|\bssy\b/i, icon: "sukanya-savings" },
  { match: /senior citizens|\bscss\b/i, icon: "senior-savings" },
  { match: /rbi.*floating/i, icon: "floating-rate-bond" },
  { match: /goi savings bond/i, icon: "government-fixed-bond" },
  { match: /banking.*psu/i, icon: "banking-psu-fund" },
  { match: /corporate bond/i, icon: "corporate-bond-fund" },
  { match: /sovereign gold bond/i, icon: "sovereign-gold-bond" },
  { match: /balanced advantage|dynamic hybrid/i, icon: "balanced-hybrid-fund" },
  { match: /nps|national pension/i, icon: "pension-plan" },
];

export function investmentVisuals(suggestion) {
  const name = suggestion.name || "";
  const type = suggestion.type || "";
  const isBank = /bank fixed deposit/i.test(type);
  const logos = providers
    .filter((provider) => provider.match.test(name))
    .map((provider) => ({
      name:
        provider.name +
        (/^(HDFC|SBI)$/.test(provider.name)
          ? isBank
            ? " Bank"
            : " Mutual Fund"
          : ""),
      src: `/images/investments/${isBank ? provider.bank : provider.fund}`,
      dark: provider.dark,
      symbol: provider.symbol,
    }))
    .filter((provider) => !provider.src.endsWith("undefined"));
  const category = /gold/i.test(name + type)
    ? "gold"
    : /pension|nps/i.test(name + type)
      ? "pension"
      : /government|savings bond/i.test(type)
        ? "government"
        : isBank
          ? "bank"
          : "fund";
  const maturity = name.match(/bharat bond.*\b(20\d{2})\b/i)?.[1];
  const icon =
    maturity && ["2030", "2031", "2032", "2033"].includes(maturity)
      ? `bharat-bond-${maturity}`
      : productIcons.find((product) => product.match.test(name))?.icon ||
        category;
  return { logos, category, icon: `/images/investments/${icon}.svg` };
}
