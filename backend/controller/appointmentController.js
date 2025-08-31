import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";

// 🔹 Step 1: Collect appointment details before payment
export const postAppointment = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    appointment_date,
    department,
    doctor_firstName,
    doctor_lastName,
    address,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !dob ||
    !gender ||
    !appointment_date ||
    !department ||
    !doctor_firstName ||
    !doctor_lastName ||
    !address
  ) {
    return next(new ErrorHandler("Please Fill All Details!", 400));
  }

  // ✅ Check doctor exists
  const isConflict = await User.find({
    firstName: doctor_firstName,
    lastName: doctor_lastName,
    role: "Doctor",
    doctorDepartment: department,
  });

  if (isConflict.length === 0) {
    return next(new ErrorHandler("Doctor not found", 404));
  }

  if (isConflict.length > 1) {
    return next(
      new ErrorHandler(
        "Doctors Conflict! Please Contact Through Email Or Phone!",
        400
      )
    );
  }

  const doctorId = isConflict[0]._id;
  const patientId = req.user._id;

  // ❌ Don’t save yet → wait for payment
  res.status(200).json({
    success: true,
    appointmentDetails: {
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      appointment_date,
      department,
      doctor: {
        firstName: doctor_firstName,
        lastName: doctor_lastName,
      },
      address,
      doctorId,
      patientId,
    },
    message: "Proceed to payment",
  });
});

// 🔹 Step 2: Create appointment after successful payment
export const createAppointmentAfterPayment = catchAsyncErrors(
  async (req, res, next) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      appointment_date,
      department,
      doctor,
      address,
      doctorId,
      patientId,
      paymentId,
    } = req.body;

    if (!doctor || !doctor.firstName || !doctor.lastName) {
      return next(new ErrorHandler("Doctor details missing!", 400));
    }

    const appointment = await Appointment.create({
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      appointment_date,
      department,
      doctor,
      address,
      doctorId,
      patientId,
      isPaid: true,
      paymentId,
    });

    res.status(201).json({
      success: true,
      appointment,
      message: "Appointment booked successfully!",
    });
  }
);

// 🔹 Admin: Get all appointments
export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find();
  res.status(200).json({
    success: true,
    appointments,
  });
});

// 🔹 Admin: Update status
export const updateAppointmentStatus = catchAsyncErrors(
  async (req, res, next) => {
    const { id } = req.params;
    let appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new ErrorHandler("Appointment not found!", 404));
    }
    appointment = await Appointment.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    res.status(200).json({
      success: true,
      message: "Appointment Status Updated!",
    });
  }
);

// 🔹 Admin: Delete appointment
export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Appointment Not Found!", 404));
  }
  await appointment.deleteOne();
  res.status(200).json({
    success: true,
    message: "Appointment Deleted!",
  });
});

// 🔹 Patient: Get own appointments
export const getMyAppointments = catchAsyncErrors(async (req, res, next) => {
  const patientId = req.user._id;
  const appointments = await Appointment.find({ patientId });
  res.status(200).json({
    success: true,
    appointments,
  });
});
