import { useState } from "react";
import { investmentVisuals } from "./investmentVisuals";

function ProviderLogo({ provider, fallback }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`af-provider-logo ${provider.dark ? "af-provider-logo-dark" : ""} ${provider.symbol ? "af-provider-logo-symbol" : ""}`}
    >
      {failed ? (
        <span className="af-provider-fallback">
          <img src={fallback} alt="" width="24" height="24" />
          {provider.name}
        </span>
      ) : (
        <>
          <img
            src={provider.src}
            alt={`${provider.name} logo`}
            width="104"
            height="40"
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
          {provider.symbol && <span>{provider.name}</span>}
        </>
      )}
    </span>
  );
}

export default function InvestmentIdentity({ suggestion }) {
  const { logos, icon } = investmentVisuals(suggestion);
  return (
    <div className="af-investment-identity">
      {logos.length ? (
        logos.map((provider) => (
          <ProviderLogo
            key={provider.src}
            provider={provider}
            fallback={icon}
          />
        ))
      ) : (
        <img
          className="af-investment-category-art"
          src={icon}
          alt=""
          width="64"
          height="48"
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
