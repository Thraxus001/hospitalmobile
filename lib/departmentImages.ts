export const DEPARTMENT_IMAGES: Record<string, any> = {
  Cardiology: require("../assets/icons/Cardiology.webp"),
  Dermatology: require("../assets/icons/Dermatology.webp"),
  ENT: require("../assets/icons/ENT.jpg"),
  "General Medicine": require("../assets/icons/General Medicine.webp"),
  Gynecology: require("../assets/icons/Gynecology.jpg"),
  Neurology: require("../assets/icons/Neurology.webp"),
  Oncology: require("../assets/icons/Oncology.webp"),
  Ophthalmology: require("../assets/icons/Ophthalmology.webp"),
  Orthopedics: require("../assets/icons/Orthopedics.webp"),
  Pediatrics: require("../assets/icons/Pediatrics.webp"),
};

export function getDepartmentImage(name?: string | null): any {
  if (!name) return null;
  const key = name.trim();
  if (DEPARTMENT_IMAGES[key]) return DEPARTMENT_IMAGES[key];
  const lower = key.toLowerCase();
  for (const [dept, img] of Object.entries(DEPARTMENT_IMAGES)) {
    const dLower = dept.toLowerCase();
    if (dLower === lower || lower.includes(dLower) || dLower.includes(lower)) {
      return img;
    }
  }
  return null;
}
