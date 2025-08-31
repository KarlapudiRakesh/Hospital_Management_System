import express from "express";
import {
  deleteAppointment,
  getAllAppointments,
  postAppointment,
  createAppointmentAfterPayment,
  updateAppointmentStatus,
  getMyAppointments
} from "../controller/appointmentController.js";
import {
  isAdminAuthenticated,
  isPatientAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

// 🔹 Step 1: Collect details before payment
router.post("/post", isPatientAuthenticated, postAppointment);

// 🔹 Step 2: Save appointment after successful payment
router.post("/confirm", isPatientAuthenticated, createAppointmentAfterPayment);

// 🔹 Get all appointments (Admin only)
router.get("/getall", isAdminAuthenticated, getAllAppointments);

// 🔹 Update appointment status (Admin only)
router.put("/update/:id", isAdminAuthenticated, updateAppointmentStatus);

// 🔹 Delete appointment (Admin only)
router.delete("/delete/:id", isAdminAuthenticated, deleteAppointment);

// 🔹 Get my appointments (Patient only)
router.get("/myappointments", isPatientAuthenticated, getMyAppointments);

export default router;
