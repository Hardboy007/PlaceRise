import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../utils/api";

const ScanAttendancePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState(() => (!token ? "Invalid QR code" : ""));
  const [studentName, setStudentName] = useState("");

  const markAttendance = async () => {
    try {
      const data = await api.post("/attendance/mark", { token });

      setSuccess(data.message || "Attendance Marked Successfully!");
      // FIX: backend ab studentName seedha bhejta hai, lekin fallback
      // bhi rakha hai agar kabhi record.studentId populated aaye
      setStudentName(data.studentName || data.record?.studentId?.name || "");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
      navigate(`/?redirect=/attendance?token=${token}`);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    markAttendance();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-3 sm:px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-6 md:mb-8">
          PlaceRise
        </h1>

        {loading && (
          <>
            <div className="animate-spin rounded-full h-10 w-10 sm:h-14 sm:w-14 border-4 border-blue-600 border-t-transparent mx-auto mb-4 sm:mb-5"></div>
            <h2 className="text-lg sm:text-xl font-semibold">
              Marking attendance...
            </h2>
          </>
        )}

        {!loading && success && (
          <>
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">✅</div>

            <h2 className="text-xl sm:text-2xl font-bold text-green-600">
              Attendance Marked Successfully!
            </h2>

            {studentName && (
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
                Welcome, <strong>{studentName}</strong>
              </p>
            )}

            <p className="mt-2 text-sm sm:text-base text-gray-700 break-words">
              {success}
            </p>

            <button
              onClick={() => navigate("/student/dashboard")}
              className="mt-6 sm:mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base py-2.5 sm:py-3 rounded-lg"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {!loading && error && (
          <>
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">⚠️</div>

            <div
              className={`p-3 sm:p-4 rounded-lg font-medium text-sm sm:text-base break-words ${
                error.toLowerCase().includes("already")
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {error}
            </div>

            {error.toLowerCase().includes("already") && (
              <p className="mt-3 text-sm sm:text-base text-gray-600">
                You already marked attendance for this session.
              </p>
            )}

            <button
              onClick={() => navigate("/student/dashboard")}
              className="mt-6 sm:mt-8 w-full bg-gray-800 hover:bg-gray-900 text-white text-sm sm:text-base py-2.5 sm:py-3 rounded-lg"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ScanAttendancePage;