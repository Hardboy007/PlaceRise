import { useState } from "react";
import { useNavigate } from "react-router-dom";
import universityStructure from "../../data/universityStructure";
import {
  User,
  GraduationCap,
  Code,
  ChevronRight,
  ChevronLeft,
  Upload,
  Check,
} from "lucide-react";

const steps = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Academic", icon: GraduationCap },
  { id: 3, label: "Skills & Resume", icon: Code },
];

function StudentOnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [resumeFile, setResumeFile] = useState(null);

  const [formData, setFormData] = useState({
    // Personal
    fullName: "",
    dob: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    // Academic
    school: "",
    department: "",
    course: "",
    batch: "",
    cgpa: "",
    tenthMarks: "",
    twelfthMarks: "",
    backlogs: "0",
    // Skills
    skills: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    navigate("/student/dashboard");
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Background Orbs */}
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-blue-300/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />
      {/* Logo */}
      <div className="mb-8 text-center">
        <span
          className="text-2xl font-bold"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          <span className="text-[#1E293B]">Place</span>
          <span className="text-primary">Rise</span>
        </span>
        <p className="text-sm text-text-muted mt-1">
          Complete your profile to get started
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] border border-[#CBD5E1] overflow-hidden">
        {/* Top Color Strip */}
        <div className="h-1.5 w-full bg-linear-to-r from-[#1E293B] via-primary to-accent" />
        {/* Progress Header */}
        <div className="px-8 pt-8 pb-6 border-b border-background">
          <div className="flex items-center justify-between relative">
            {/* Line behind steps */}
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-[#E2E8F0] z-0" />
            <div
              className="absolute left-0 top-5 h-0.5 bg-primary z-0 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />

            {steps.map(({ id, label, icon: Icon }) => {
              const isCompleted = currentStep > id;
              const isActive = currentStep === id;
              return (
                <div key={id} className="flex flex-col items-center gap-2 z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${isCompleted ? "bg-primary" : isActive ? "bg-primary" : "bg-[#E2E8F0]"}
                  `}
                  >
                    {isCompleted ? (
                      <Check size={16} className="text-white" />
                    ) : (
                      <Icon
                        size={16}
                        className={isActive ? "text-white" : "text-[#94A3B8]"}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${isActive || isCompleted ? "text-[#1E293B]" : "text-[#94A3B8]"}`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-6">
          {/* Step 1 - Personal */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className="text-xl font-bold text-[#1E293B]"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Personal Details
                </h2>
                <p className="text-sm text-text-muted mt-1">
                  Tell us about yourself
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Full Name
                  </label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Address
                  </label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    City
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    State
                  </label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Academic */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className="text-xl font-bold text-[#1E293B]"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Academic Details
                </h2>
                <p className="text-sm text-text-muted mt-1">
                  Your academic information
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* School */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    School
                  </label>
                  <select
                    name="school"
                    value={formData.school}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        school: e.target.value,
                        department: "",
                        course: "",
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-white"
                  >
                    <option value="">Select School</option>
                    {universityStructure.map((s) => (
                      <option key={s.school} value={s.school}>
                        {s.school}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        department: e.target.value,
                        course: "",
                      });
                    }}
                    disabled={!formData.school}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-white disabled:opacity-50"
                  >
                    <option value="">Select Department</option>
                    {formData.school &&
                      universityStructure
                        .find((s) => s.school === formData.school)
                        ?.departments.map((d) => (
                          <option key={d.name} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Course */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Course
                  </label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    disabled={!formData.department}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-white disabled:opacity-50"
                  >
                    <option value="">Select Course</option>
                    {formData.department &&
                      universityStructure
                        .find((s) => s.school === formData.school)
                        ?.departments.find(
                          (d) => d.name === formData.department,
                        )
                        ?.courses.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Batch */}
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Batch Year
                  </label>
                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-white"
                  >
                    <option value="">Select Batch</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>

                {/* CGPA */}
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Current CGPA
                  </label>
                  <input
                    name="cgpa"
                    value={formData.cgpa}
                    onChange={handleChange}
                    placeholder="e.g. 8.5"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                {/* Backlogs */}
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Active Backlogs
                  </label>
                  <input
                    name="backlogs"
                    value={formData.backlogs}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                {/* 10th Marks */}
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    10th Marks (%)
                  </label>
                  <input
                    name="tenthMarks"
                    value={formData.tenthMarks}
                    onChange={handleChange}
                    placeholder="e.g. 85"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                {/* 12th Marks */}
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    12th Marks (%)
                  </label>
                  <input
                    name="twelfthMarks"
                    value={formData.twelfthMarks}
                    onChange={handleChange}
                    placeholder="e.g. 80"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Skills & Resume */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className="text-xl font-bold text-[#1E293B]"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Skills & Resume
                </h2>
                <p className="text-sm text-text-muted mt-1">
                  Almost done — last step
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Skills{" "}
                    <span className="text-[#94A3B8]">(comma separated)</span>
                  </label>
                  <input
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g. React, Node.js, Python, SQL"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                  {/* Skills Preview */}
                  {formData.skills && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills
                        .split(",")
                        .map((skill) => skill.trim())
                        .filter(Boolean)
                        .map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-[#EFF6FF] text-primary border border-[#BFDBFE]"
                          >
                            {skill}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Resume Upload */}
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Resume
                  </label>
                  <label
                    className={`flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                    ${resumeFile ? "border-primary bg-[#EFF6FF]" : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-primary hover:bg-[#EFF6FF]"}
                  `}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                    />
                    {resumeFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <Check size={18} className="text-white" />
                        </div>
                        <p className="text-sm font-medium text-primary">
                          {resumeFile.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center">
                          <Upload size={18} className="text-text-muted" />
                        </div>
                        <p className="text-sm font-medium text-[#1E293B]">
                          Upload your resume
                        </p>
                        <p className="text-xs text-text-muted">
                          PDF only · Max 5MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${
                currentStep === 1
                  ? "text-[#CBD5E1] cursor-not-allowed"
                  : "text-text-muted hover:bg-background"
              }`}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-2">
            {steps.map(({ id }) => (
              <div
                key={id}
                className={`rounded-full transition-all duration-300
                  ${currentStep === id ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-[#E2E8F0]"}
                `}
              />
            ))}
          </div>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
            >
              Complete Setup
              <Check size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentOnboardingPage;
