import { useEffect, useState } from "react";
import { FiGlobe } from "react-icons/fi";

export default function LanguageSelector() {
  const [lang, setLang] = useState("en");
  useEffect(() => {
    if (
      typeof window.google?.translate?.TranslateElement === "function" &&
      window.googleTranslateElementInit
    )
      window.googleTranslateElementInit();
  }, []);
  const handleLanguageChange = (event) => {
    const selectedLang = event.target.value;
    setLang(selectedLang);
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = selectedLang === "en" ? "" : selectedLang;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      if (selectedLang === "en") {
        document.cookie =
          "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" +
          window.location.hostname +
          "; path=/;";
        window.location.reload();
      }
    }
  };
  return (
    <label className="af-language">
      <FiGlobe aria-hidden="true" />
      <span className="af-sr-only">Choose language</span>
      <select value={lang} onChange={handleLanguageChange}>
        <option value="en">EN</option>
        <option value="hi">हिंदी</option>
        <option value="bn">বাংলা</option>
        <option value="te">తెలుగు</option>
        <option value="mr">मराठी</option>
        <option value="ta">தமிழ்</option>
        <option value="gu">ગુજરાતી</option>
        <option value="kn">ಕನ್ನಡ</option>
        <option value="ml">മലയാളം</option>
        <option value="pa">ਪੰਜਾਬੀ</option>
      </select>
    </label>
  );
}
