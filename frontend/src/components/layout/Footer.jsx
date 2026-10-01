import React from "react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-bg-surface border-t border-border-main text-center py-8">
      <p className="text-sm text-text-dim">
        {t("footer.copyright")} • <span className="font-medium opacity-80">v1.7.0</span>
      </p>
    </footer>
  );
};

export default Footer;