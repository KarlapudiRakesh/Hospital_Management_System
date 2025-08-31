
import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import { Context } from "../main"; 

const AppointmentForm = () => {
  const { user } = useContext(Context);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [department, setDepartment] = useState("Pediatrics");

  const [doctorId, setDoctorId] = useState("");
  const [doctorFirstName, setDoctorFirstName] = useState("");
  const [doctorLastName, setDoctorLastName] = useState("");
  const [address, setAddress] = useState("");

  const departmentsArray = [
    "Pediatrics",
    "Orthopedics",
    "Cardiology",
    "Neurology",
    "Oncology",
    "Radiology",
    "Physical Therapy",
    "Dermatology",
    "ENT",
  ];

  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/user/doctors`,
          { withCredentials: true }
        );
        setDoctors(data.doctors);
      } catch (err) {
        toast.error("Failed to load doctors");
      }
    };
    fetchDoctors();
  }, []);

  const handleAppointment = async (e) => {
    e.preventDefault();

    if (
      !firstName || !lastName || !email || !phone || !dob || !gender ||
      !appointmentDate || !department || !doctorId || !address
    ) {
      toast.error("Please fill all fields and select a doctor.");
      return;
    }

    try {
      const doc = doctors.find((d) => d._id === doctorId);
      const df = doc ? doc.firstName : doctorFirstName;
      const dl = doc ? doc.lastName : doctorLastName;

      const payload = {
        firstName,
        lastName,
        email,
        phone,
        dob,
        gender,
        appointment_date: appointmentDate,
        department,
        doctorFirstName: df,   
        doctorLastName: dl,    
        doctorId,
        patientId: user?._id || "",
        address,
      };

      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/payment/checkout`,
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (data?.url) {
        window.location.href = data.url; 
      } else {
        toast.error("Could not start payment. Try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to start payment");
    }
  };

  return (
    <div className="container form-component appointment-form">
      <h2>Appointment</h2>
      <form onSubmit={handleAppointment}>
        <div>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="number"
            placeholder="Mobile Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <input
            type="date"
            placeholder="Date of Birth"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>

        <div>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <input
            type="date"
            placeholder="Appointment Date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
          />
        </div>

        <div>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setDoctorId("");
              setDoctorFirstName("");
              setDoctorLastName("");
            }}
          >
            {departmentsArray.map((depart, index) => (
              <option value={depart} key={index}>
                {depart}
              </option>
            ))}
          </select>

          <select
            value={doctorId}
            onChange={(e) => {
              const id = e.target.value;
              setDoctorId(id);
              const sel = doctors.find((d) => d._id === id);
              if (sel) {
                setDoctorFirstName(sel.firstName);
                setDoctorLastName(sel.lastName);
              }
            }}
            disabled={!department}
          >
            <option value="">Select Doctor</option>
            {doctors
              .filter((d) => d.doctorDepartment === department)
              .map((d) => (
                <option key={d._id} value={d._id}>
                  {d.firstName} {d.lastName}
                </option>
              ))}
          </select>
        </div>

        <textarea
          rows="10"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
        />

        <button style={{ margin: "0 auto" }}>GET APPOINTMENT</button>
      </form>
    </div>
  );
};

export default AppointmentForm;
