import type { Project } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'DATA ANALYSIS ON SMU STUDENTS',
    year: 2025,
    subtitle: 'Customer journey analysis and dashboarding',
    description: [
      'Conducted comprehensive customer journey analysis for SMU SCIS students using TheyDo, mapping 5-phase student lifecycle to identify critical pain points and service gaps.',
      'Integrated external datasets to validate findings and benchmark against industry trends.',
      'Created interactive dashboards in Tableau to visualise key issues and trends.',
      'Formulated data-driven recommendations including curriculum optimization and service delivery improvements.',
    ],
  },
  {
    id: 'proj-2',
    title: 'E-COMMERCE PLATFORM DEVELOPMENT',
    year: 2024,
    subtitle: 'Full-stack web application with React and Node.js',
    description: [
      'Engineered a scalable e-commerce platform using the MERN stack (MongoDB, Express, React, Node.js), featuring product catalogs, user authentication, and a shopping cart.',
      'Implemented a RESTful API for seamless communication between the frontend and backend services.',
      'Designed and developed a responsive user interface with React and Tailwind CSS, ensuring a high-quality user experience across all devices.',
      'Deployed the application on AWS using Docker and CI/CD pipelines, reducing deployment time by 40%.',
    ],
  },
  {
    id: 'proj-3',
    title: 'MACHINE LEARNING FOR FRAUD DETECTION',
    year: 2023,
    subtitle: 'Predictive modeling using Python and Scikit-learn',
    description: [
      'Developed a machine learning model to detect fraudulent transactions with 95% accuracy, using Python, Pandas, and Scikit-learn.',
      'Performed extensive feature engineering and data preprocessing on a dataset of over 1 million transactions.',
      'Trained and evaluated several classification models, including Logistic Regression, Random Forest, and Gradient Boosting, selecting the best-performing model for production.',
      'Presented findings to stakeholders, demonstrating the model\'s potential to save the company an estimated $500,000 annually.',
    ],
  },
   {
    id: 'proj-4',
    title: 'MOBILE APP FOR TASK MANAGEMENT',
    year: 2023,
    subtitle: 'Cross-platform development with React Native',
    description: [
      'Built a cross-platform task management application for iOS and Android using React Native and Firebase.',
      'Implemented real-time data synchronization across devices using Firebase Firestore.',
      'Integrated push notifications to alert users of upcoming deadlines and task updates.',
      'Published the application to both the Apple App Store and Google Play Store, achieving over 1,000 downloads in the first month.',
    ],
  },
];
