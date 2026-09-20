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
import { api } from "../../utils/api";
import { useEffect } from "react";
const steps = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Academic", icon: GraduationCap },
  { id: 3, label: "Skills & Resume", icon: Code },
];

function StudentOnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Personal
    fullName: "",
    dob: "",
    gender: "",
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

  useEffect(() => {
    document.title = "Fill your details — PlaceRise"
    const fetchStudentData = async () => {
      try {
        const data = await api.get("/students/me");
        if (data) {
          setFormData((prev) => ({
            ...prev,
            fullName: data.name || "",
            dob: data.dob || "",
            phone: data.phone || "",
            school: data.school || "",
            department: data.branch || "",
            course: data.course || "",
            batch: data.batch || "",
            cgpa: data.cgpa || "",
            tenthMarks: data.tenthMarks || "",
            twelfthMarks: data.twelfthMarks || "",
            backlogs: data.backlogs || "0",
          }));
        }
      } catch (err) {
        // First-time onboarding — student record may not be fully queryable yet, ignore.
        console.error("Prefill fetch failed:", err);
      }
    };
    fetchStudentData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const isStep1Valid = () => {
    return (
      formData.fullName && formData.dob && formData.phone && formData.gender
    );
  };

  const isStep2Valid = () => {
    return (
      formData.school &&
      formData.department &&
      formData.course &&
      formData.batch &&
      formData.cgpa &&
      formData.tenthMarks &&
      formData.twelfthMarks
    );
  };

  const isStep3Valid = () => {
    return formData.skills.trim().length > 0;
  };

  const isCurrentStepValid = () => {
    if (currentStep === 1) return isStep1Valid();
    if (currentStep === 2) return isStep2Valid();
    if (currentStep === 3) return isStep3Valid();
    return false;
  };
  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Uploads the selected resume file using the same endpoint the profile page uses.
  const uploadResume = async () => {
    if (!resumeFile) return;

    if (resumeFile.size > 5 * 1024 * 1024) {
      alert("Resume file size must be less than 5MB");
      return;
    }

    const resumeFormData = new FormData();
    resumeFormData.append("file", resumeFile);
    resumeFormData.append("source", "onboarding");

    try {
      const data = await api.post("/students/me/resume", resumeFormData);
      if (!data?.resumeUrl) {
        console.error("Resume upload failed:", data);
        alert(
          "Profile saved, but resume upload failed. You can upload it later from your profile page.",
        );
      }
    } catch (err) {
      console.error("Resume upload error:", err);
      alert(
        "Profile saved, but resume upload failed. You can upload it later from your profile page.",
      );
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const payload = {
      name: formData.fullName,
      dob: formData.dob,
      phone: formData.phone,
      gender: formData.gender,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      school: formData.school,
      branch: formData.department,
      course: formData.course,
      batch: formData.batch,
      cgpa: formData.cgpa,
      tenthMarks: formData.tenthMarks,
      twelfthMarks: formData.twelfthMarks,
      backlogs: formData.backlogs,
      skills: formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      await api.put("/students/me/onboard", payload);

      // Resume file was only sitting in local state until now — actually send it.
      if (resumeFile) {
        await uploadResume();
      }

      navigate("/student/dashboard");
    } catch (err) {
      console.error("Onboarding submit failed:", err);
      alert(
        "Something went wrong while saving your profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Background Orbs */}
      <div className="absolute top-4 right-0 w-40 h-40 sm:top-10 sm:right-10 sm:w-72 sm:h-72 rounded-full bg-[#1a3a8f]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-4 left-0 w-36 h-36 sm:bottom-10 sm:left-10 sm:w-56 sm:h-56 rounded-full bg-[#c0392b]/8 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-[#1a3a8f]/8 blur-2xl pointer-events-none" />
      {/* Logo */}
      <div className="mb-6 sm:mb-8 text-center">
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
      <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] border border-[#CBD5E1] overflow-hidden">
        {/* Top Color Strip */}
        <div className="flex h-[3px] w-full overflow-hidden">
          <div style={{ backgroundColor: "#0d1b5e", flex: 1 }} />
          <div style={{ backgroundColor: "#c0392b", flex: 1 }} />
          <div style={{ backgroundColor: "#f59e0b", flex: 1 }} />
        </div>
        {/* Progress Header */}
        <div className="px-4 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-6 border-b border-background">
          <div className="flex items-center justify-between relative">
            {/* Line behind steps */}
            <div className="absolute left-0 right-0 top-4 sm:top-5 h-0.5 bg-[#E2E8F0] z-0" />
            <div
              className="absolute left-0 top-4 sm:top-5 h-0.5 bg-[#1a3a8f] z-0 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />

            {steps.map(({ id, label, icon: Icon }) => {
              const isCompleted = currentStep > id;
              const isActive = currentStep === id;
              return (
                <div
                  key={id}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 z-10"
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300
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
                    className={`text-[10px] sm:text-xs font-medium text-center whitespace-nowrap ${isActive || isCompleted ? "text-[#1E293B]" : "text-[#94A3B8]"}`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-4 py-5 sm:px-8 sm:py-6">
          {/* Step 1 - Personal */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className="text-lg sm:text-xl font-bold text-[#1E293B]"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Personal Details
                </h2>
                <p className="text-sm text-text-muted mt-1">
                  Tell us about yourself
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
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
                <div>
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
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
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Parent / Guardian Email{" "}
                    <span className="text-[#94A3B8] font-normal"></span>
                  </label>
                  <input
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    placeholder="Parent's email address"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                  <p className="text-[10px] text-[#94A3B8] mt-1">
                    They'll be notified when you apply or get
                    shortlisted/selected.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Parent / Guardian Phone{" "}
                    <span className="text-[#94A3B8] font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="Parent's phone number"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-[#1E293B] block mb-1">
                    Parent / Guardian Name{" "}
                    <span className="text-[#94A3B8] font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    placeholder="Parent's Name"
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
                  className="text-lg sm:text-xl font-bold text-[#1E293B]"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Academic Details
                </h2>
                <p className="text-sm text-text-muted mt-1">
                  Your academic information
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* School */}
                <div className="sm:col-span-2">
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
                <div className="sm:col-span-2">
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
                <div className="sm:col-span-2">
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
                  className="text-lg sm:text-xl font-bold text-[#1E293B]"
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
                            className="px-3 py-1 rounded-full text-xs font-medium bg-[#eef1f9] text-[#1a3a8f] border border-[#c7d2ee]"
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
                    className={`flex flex-col items-center justify-center w-full h-32 sm:h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                    ${resumeFile ? "border-[#1a3a8f] bg-[#eef1f9]" : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#1a3a8f] hover:bg-[#eef1f9]"}
                  `}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.size > 5 * 1024 * 1024) {
                          alert("File size must be less than 5MB");
                          return;
                        }
                        setResumeFile(file);
                      }}
                    />
                    {resumeFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <Check size={18} className="text-white" />
                        </div>
                        <p className="max-w-[90%] text-sm font-medium text-primary truncate">
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
        <div className="px-4 pb-5 sm:px-8 sm:pb-8 flex items-center justify-between gap-2">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all
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
              disabled={!isCurrentStepValid()}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-colors shadow-[0_4px_12px_rgba(26,58,143,0.3)]
      ${isCurrentStepValid() ? "bg-[#1a3a8f] hover:bg-[#15307a]" : "bg-[#CBD5E1] cursor-not-allowed"}`}
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isCurrentStepValid() || submitting}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-colors shadow-[0_4px_12px_rgba(26,58,143,0.3)]
      ${isCurrentStepValid() && !submitting ? "bg-[#1a3a8f] hover:bg-[#15307a]" : "bg-[#CBD5E1] cursor-not-allowed"}`}
            >
              {submitting ? "Saving..." : "Complete Setup"}
              {!submitting && <Check size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentOnboardingPage;
