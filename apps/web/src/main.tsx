import "./i18n";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@/hooks/data";

setAuthTokenGetter(() => localStorage.getItem("nf_token"));

(window as any).__reactMounted = true;
createRoot(document.getElementById("root")!).render(<App />);
