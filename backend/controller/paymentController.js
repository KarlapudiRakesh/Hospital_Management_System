// backend/controller/paymentController.js
import Stripe from "stripe";
import { config } from "dotenv";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";

config({ path: "./config/config.env" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helpful defaults if envs are missing
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL  = process.env.BACKEND_URL  || "http://localhost:4000";

// ---------------- Checkout ----------------
export const checkout = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      appointment_date,
      department,
      address,
      doctorId,
      patientId,

      // optional (not required; we still store via DB lookup)
      doctor_firstName,
      doctor_lastName,
    } = req.body;

    const missing =
      !firstName || !lastName || !email || !phone || !dob || !gender ||
      !appointment_date || !department || !address || !doctorId || !patientId;

    if (missing) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Appointment - ${department}` },
            unit_amount: 5000, // $50
          },
          quantity: 1,
        },
      ],
      // IMPORTANT: go back to backend first so we can save the appointment, then redirect to frontend
      success_url: `${BACKEND_URL}/api/v1/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/appointment`,
      metadata: {
        firstName,
        lastName,
        email,
        phone,
        dob,                // e.g. "2025-08-07"
        gender,
        appointment_date,   // e.g. "2025-09-04"
        department,
        address,
        doctorId,
        patientId,
        // optional extras
        ...(doctor_firstName ? { doctor_firstName } : {}),
        ...(doctor_lastName  ? { doctor_lastName  } : {}),
      },
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({ message: "Checkout failed", error: error.message });
  }
};

// ---------------- Payment Success -> Save appointment ----------------
export const paymentSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ message: "session_id is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return res.redirect(`${FRONTEND_URL}/appointment?status=failed`);
    }

    const m = session.metadata || {};
    console.log("✅ Stripe metadata:", m);

    // Always try to fetch doctor names from DB using doctorId
    let doctorFirstName = "";
    let doctorLastName = "";

    if (m.doctorId) {
      const doctor = await User.findById(m.doctorId).select("firstName lastName");
      if (doctor) {
        doctorFirstName = doctor.firstName || "";
        doctorLastName  = doctor.lastName || "";
      }
    }

    // Fallback to metadata if DB not found (handles edge cases)
    if (!doctorFirstName && m.doctor_firstName) doctorFirstName = m.doctor_firstName;
    if (!doctorLastName  && m.doctor_lastName)  doctorLastName  = m.doctor_lastName;

    if (!doctorFirstName || !doctorLastName) {
      // Your schema requires doctor.firstName/lastName -> stop if we couldn't resolve
      return res.status(400).json({ message: "Unable to resolve doctor name." });
    }

    // Build the document exactly as your schema expects (Date fields cast explicitly)
    const appointmentDoc = {
      firstName: m.firstName,
      lastName:  m.lastName,
      email:     m.email,
      phone:     m.phone,
      dob:       m.dob ? new Date(m.dob) : null,
      gender:    m.gender,
      appointment_date: m.appointment_date ? new Date(m.appointment_date) : null,
      department: m.department,
      address:    m.address,
      doctorId:   m.doctorId,
      patientId:  m.patientId,
      doctor: {
        firstName: doctorFirstName,
        lastName:  doctorLastName,
      },
      isPaid:    true,
      paymentId: session.payment_intent,
    };

    console.log("📝 Creating appointment:", appointmentDoc);
    await Appointment.create(appointmentDoc);

    // Redirect to frontend My Appointments
    return res.redirect(`${FRONTEND_URL}/myappointments?paid=true`);
  } catch (error) {
    console.error("Payment success error:", error);
    return res
      .status(500)
      .json({ message: "Payment success handling failed", error });
  }
};
