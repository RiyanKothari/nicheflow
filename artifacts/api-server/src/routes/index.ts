import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import businessRouter from "./business.js";
import clientsRouter from "./clients.js";
import bookingsRouter from "./bookings.js";
import invoicesRouter from "./invoices.js";
import inventoryRouter from "./inventory.js";
import tasksRouter from "./tasks.js";
import aiRouter from "./ai.js";
import onboardingRouter from "./onboarding.js";
import publicPageRouter from "./publicPage.js";
import settingsRouter from "./settings.js";
import notificationsRouter from "./notifications.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/business", businessRouter);
router.use("/clients", clientsRouter);
router.use("/bookings", bookingsRouter);
router.use("/invoices", invoicesRouter);
router.use("/inventory", inventoryRouter);
router.use("/tasks", tasksRouter);
router.use("/ai", aiRouter);
router.use("/onboarding", onboardingRouter);
router.use("/dashboard", businessRouter);
router.use("/public-page", publicPageRouter);
router.use("/settings", settingsRouter);
router.use("/notifications", notificationsRouter);

export default router;
