import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPageTitle } from "../utils/pageTitles";

const RouteTitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = getPageTitle(location.pathname);
  }, [location.pathname]);

  return null;
};

export default RouteTitleManager;
