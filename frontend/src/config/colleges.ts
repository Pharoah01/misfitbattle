/**
 * List of colleges/institutions in Old Mahabalipuram Road (OMR), Chennai, Tamil Nadu, India
 */

export const COLLEGES = [
  'Sathyabama Institute of Science and Technology',
  'SRM Institute of Science and Technology',
  'Hindustan Institute of Technology and Science',
  'Vel Tech Rangarajan Dr. Sagunthala R&D Institute of Science and Technology',
  'Jeppiaar Engineering College',
  'Rajalakshmi Engineering College',
  'Rajalakshmi Institute of Technology',
  'St. Joseph\'s College of Engineering',
  'Jaya Engineering College',
  'Meenakshi College of Engineering',
  'Meenakshi Sundararajan Engineering College',
  'Panimalar Engineering College',
  'Panimalar Institute of Technology',
  'Sri Sairam Engineering College',
  'Sri Sairam Institute of Technology',
  'Easwari Engineering College',
  'Saveetha Engineering College',
  'Saveetha School of Engineering',
  'Bharath Institute of Higher Education and Research',
  'Dr. M.G.R. Educational and Research Institute',
  'Sree Sastha Institute of Engineering and Technology',
  'Dhanalakshmi Srinivasan College of Engineering and Technology',
  'Tagore Engineering College',
  'Adhiyamaan College of Engineering',
  'Other',
] as const;

export type College = typeof COLLEGES[number];

/**
 * Check if a college name is in the predefined list
 */
export const isValidCollege = (collegeName: string): boolean => {
  return COLLEGES.includes(collegeName as College);
};
