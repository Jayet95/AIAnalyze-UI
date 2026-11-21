import { createRoot } from "react-dom/client";
import { Dashboard } from "./features/aianalyze/dashboard";
import "./styles.css";
const root = document.getElementById("root");
if (root) createRoot(root).render(<Dashboard />);
