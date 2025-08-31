import React, { useEffect, useState } from "react";
import axios from "axios";

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);

  // 🔹 Function to fetch appointments
  const fetchAppointments = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/appointment/myappointments`,
        { withCredentials: true }
      );
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error(
        "Error fetching appointments:",
        error.response?.data?.message
      );
      setAppointments([]);
    }
  };

  // 🔹 Run once to fetch appointments
  useEffect(() => {
    fetchAppointments();
  }, []);

  // 🔹 Handle Stripe success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get("session_id");

    if (session_id) {
      axios
        .get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/payment/success?session_id=${session_id}`,
          { withCredentials: true }
        )
        .then((res) => {
          if (res.data) {
            console.log("✅ Appointment saved after payment");
            fetchAppointments(); // 🔄 refresh list immediately
            window.history.replaceState({}, document.title, "/myappointments"); 
            // removes ?session_id from URL
          }
        })
        .catch((err) => console.error("Payment success error:", err));
    }
  }, []);

  return (
    <div className="myappointments">
      <div className="banner">
        <h5>My Appointments</h5>
        {appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Date</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt._id}>
                  <td>
                    {appt.doctor && appt.doctor.firstName
                      ? `${appt.doctor.firstName} ${appt.doctor.lastName}`
                      : "—"}
                  </td>
                  <td>
                    {appt.appointment_date
                      ? appt.appointment_date.substring(0, 10)
                      : "—"}
                  </td>
                  <td>{appt.department || "—"}</td>
                  <td
                    className={
                      appt.status === "Pending"
                        ? "value-pending"
                        : appt.status === "Accepted"
                        ? "value-accepted"
                        : "value-rejected"
                    }
                  >
                    {appt.status || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
