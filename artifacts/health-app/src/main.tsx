import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

requestAnimationFrame(() => {
  const splash = document.getElementById("app-splash");
  if (!splash) return;
  splash.classList.add("hide");
  splash.addEventListener("transitionend", () => splash.remove(), { once: true });
  setTimeout(() => splash.remove(), 800);
});
