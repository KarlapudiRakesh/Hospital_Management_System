import React from "react";

const Biography = ({ imageUrl }) => {
  return (
    <div className="container biography flex flex-col md:flex-row items-center gap-10 p-8">
      {/* Left Side - Image */}
      <div className="banner flex-1">
        <img src={imageUrl} alt="who we are" className="rounded-2xl shadow-lg" />
      </div>

      {/* Right Side - Text */}
      <div className="banner flex-1 text-gray-800">
        <p className="text-gray-500 uppercase tracking-wide mb-2">Biography</p>
        <h3 className="text-2xl font-semibold mb-8">Who We Are</h3>

        <p className="mb-4">
          At CareWell Hospital, we are committed to providing
          accessible, reliable, and patient-centered healthcare. Our focus is
          on combining medical expertise with modern technology to deliver a
          smooth and transparent healthcare experience.
        </p>

        <p className="mb-4">
          We strive to make healthcare simpler and more efficient through:
        </p>

        <p className="mb-4">
          1. Easy and convenient appointment scheduling
        </p>

        <p className="mb-4">
          2. Secure management of patient records
        </p>

        <p className="mb-4">
          3. Safe and seamless digital payment options
        </p>

        <p className="mb-4">
          Our vision is to create a connected healthcare system where patients
          and doctors can interact with ease, supported by innovative solutions.
        </p>

        <p className="text-blue-600 font-medium">
          At CareWell, we believe healthcare is not just about treatment—it’s
          about care, compassion, and trust.
        </p>
     
        <h3 className="text-2xl font-semibold mb-8">HEALTH IS WEALTH !</h3>

      </div>
    </div>
  );
};

export default Biography;
