// backend/routes/paymentRouter.js
import express from "express";
import { checkout, paymentSuccess } from "../controller/paymentController.js";

const router = express.Router();

// Start checkout session
router.post("/checkout", checkout);

// Handle success after Stripe payment
router.get("/success", paymentSuccess);

export default router;
