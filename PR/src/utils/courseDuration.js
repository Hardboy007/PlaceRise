// Explicit duration (in years) for every course in universityStructure.js.
// Keyed by the exact course string used in Student.course, so there's no
// guessing via regex — every course has a known, correct duration.
const COURSE_DURATIONS = {
  // ── School of Engineering & Computing ──
  "B.Tech CSE": 4,
  "B.Tech AIML": 4,
  "B.Tech AI&DS": 4,
  "B.Tech CS": 4,
  "B.Tech DS": 4,
  "M.Tech CSE": 2,
  BCA: 3,
  "BCA DSs": 3,
  "BCA Full Stack": 3,
  "BCA Cyber Security": 3,
  "BCA AI&DS": 3,
  "B.Sc IT": 3,
  "B.Sc AI&DS": 3,
  MCA: 2,
  "MCA DS": 2,
  "MCA AI&DS": 2,
  "B.Tech CE": 4,
  "M.Tech CE": 2,
  "Diploma CE": 3,
  "B.Tech ME": 4,
  "M.Tech ME": 2,
  "Diploma ME": 3,
  "B.Tech Aerospace": 4,
  "B.Tech EEE": 4,
  "M.Tech EEE": 2,
  "Diploma EE": 3,
  "B.Tech ECE": 4,
  "M.Tech ECE": 2,

  // ── School of Management & Commerce ──
  BBA: 3,
  "BBA HR/Marketing/Finance/International Business": 3,
  "BBA (BA)": 3,
  "BBA (DM)": 3,
  "BBA AI&DS": 3,
  "BBA Fintech and Digital Banking": 3,
  "BBA Aviation": 3,
  BCom: 3,
  "BCom H": 3,
  MBA: 2,
  "MBA Business Analytics": 2,
  "MBA (DM)": 2,
  "MBA - Agribusiness": 2,
  "MBA AI&DS": 2,
  "Ph.D Management": 3,

  // ── School of Pharmacy & Research ──
  "B.Pharm": 4,
  "B.Pharm LE": 3,
  "Pharm.D": 6,
  "D.Pharm": 2,
  "M.Pharm": 2,
  "M.Pharm Pharmaceutics": 2,
  "M.Pharm Pharmacology": 2,
  "M.Sc Pharmaceutical Chemistry": 2,
  "Ph.D Pharmaceutical Sciences": 3,

  // ── School of Hotel Management & Tourism ──
  BHM: 3,
  "B.Sc Hospitality": 3,
  "BBA Tourism": 3,
  MHM: 2,

  // ── School of Agriculture ──
  "B.Sc.Hons.(Agri)": 4,
  "M.Sc Agri": 2,
  "M.Sc Agriculture Plant Pathology": 2,
  "M.Sc Genetics & Plant Breeding": 2,
  "M.Sc Horticulture": 2,
  "B.Sc (Hons.) Forestry": 4,

  // ── School of Animation, Design & Planning ──
  "M.Plan": 2,
  "B.Des UI/UX": 4,
  "B.Des Interior Design": 4,
  "B.Des Game Design & Animation": 4,
  "B.Des Graphic Design": 4,
  "B.Sc Animation, VFX & Gaming": 3,
  "M.Des UI/UX": 2,
  "M.Des Interior Design": 2,

  // ── Dev Bhoomi School of Architecture ──
  "B.Arch": 5,
  "Diploma Architecture": 3,

  // ── School of Journalism & Liberal Arts ──
  "B.A (Hons.) English": 3,
  "M.A English": 2,
  "B.Sc.(Fashion)": 3,
  "MA (Fashion D&M)": 2,
  BFA: 4,
  MFA: 2,
  BJMC: 3,
  MAJMC: 2,

  // ── School of Nursing ──
  "BSc Nursing": 4,

  // ── School of Allied Sciences ──
  "BSc Microbiology": 3,
  "MSc Microbiology": 2,
  "BSc Biotech": 3,
  "BTech Biotech": 4,
  "MSc Biotech": 2,
  "BSc Chemistry": 3,
  "MSc Chemistry": 2,
  "B.Sc Zoology": 3,
  "B.Sc Food Tech": 3,
  "M.Sc Food Tech": 2,
  "B.Sc Forensic": 3,
  "M.Sc Forensic": 2,
  "B.Sc Hons.(Maths)": 3,

  // ── Dev Bhoomi Medical College of Paramedical Sciences ──
  BHA: 3,
  Paramedical: 3,

  // ── School of Law ──
  LLB: 3,
  "BA LLB": 5,
  "BBA LLB": 5,
  "BCom LLB": 5,
};

// Falls back to 4 years only if a course somehow isn't in the table
// (e.g. new course added to universityStructure.js but this file wasn't
// updated) — logs a warning so it's easy to spot and fix.
export function getCourseDuration(course) {
  if (!course) return 4;
  const duration = COURSE_DURATIONS[course];
  if (duration === undefined) {
    console.warn(
      `getCourseDuration: no duration mapped for course "${course}", defaulting to 4`,
    );
    return 4;
  }
  return duration;
}

// Shifts the date back by 6 months before reading the year — this makes
// the "year" used in the calculation roll over on 1 July instead of
// 1 January, matching how Indian college academic sessions actually work
// (July–June), without changing anything on the Jan 1 boundary.
function getAcademicYearLabel(date = new Date()) {
  const month = date.getMonth(); // 0 = Jan ... 6 = July ... 11 = Dec
  const year = date.getFullYear();
  return month >= 6 ? year + 1 : year;
}

// Computes current year of study, clamped between 1 and the program's
// total duration (so a final-year MBA student never shows "Year 3").
export function getCurrentYear(batch, course) {
  if (!batch) return null;
  const duration = getCourseDuration(course);
  const academicYear = getAcademicYearLabel();
  const raw = academicYear - parseInt(batch) + duration;
  return Math.min(Math.max(raw, 1), duration);
}
