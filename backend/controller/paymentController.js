import Stripe from "stripe";
import { config } from "dotenv";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";

config({ path: "./config/config.env" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// defaults if envs missing (keep these as you had)
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
      // optional (not required)
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
      // ⬇️ Stripe → backend first (save), then redirect to frontend
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
        ...(doctor_firstName ? { doctor_firstName } : {}),
        ...(doctor_lastName  ? { doctor_lastName  } : {}),
      },
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return res
      .status(500)
      .json({ message: "Checkout failed", error: error.message });
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

    // resolve doctor name (schema requires doctor.firstName/lastName)
    let doctorFirstName = "";
    let doctorLastName = "";

    if (m.doctorId) {
      const doctor = await User.findById(m.doctorId).select("firstName lastName");
      if (doctor) {
        doctorFirstName = doctor.firstName || "";
        doctorLastName  = doctor.lastName || "";
      }
    }
    if (!doctorFirstName && m.doctor_firstName) doctorFirstName = m.doctor_firstName;
    if (!doctorLastName  && m.doctor_lastName)  doctorLastName  = m.doctor_lastName;

    if (!doctorFirstName || !doctorLastName) {
      return res.status(400).json({ message: "Unable to resolve doctor name." });
    }

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

    // ⬇️ send the browser to your frontend page
    return res.redirect(`${FRONTEND_URL}/myappointments?status=success`);
  } catch (error) {
    console.error("Payment success error:", error);
    return res
      .status(500)
      .json({ message: "Payment success handling failed", error });
  }
};
