import { getCourseDuration, getCurrentYear } from './courseDuration'

export const getSemester = (batch, course) => {
  if (!batch) return null

  // getCurrentYear already sahi year calculate karta hai —
  // usi pe depend karo taaki dono consistent rahein
  const yearOfStudy = getCurrentYear(batch, course)
  if (!yearOfStudy) return null

  const currentMonth = new Date().getMonth() + 1
  const duration = getCourseDuration(course)

  // July se naya academic session — odd semester
  // January se June — even semester
  const semester = currentMonth >= 7
    ? (yearOfStudy * 2) - 1  // odd
    : (yearOfStudy * 2) - 2  // even

  return semester > 0 && semester <= duration * 2 ? semester : null
}