// Dummy data shared across the app

export const dummyUsers = [
  { id: 1, name: 'Alice Fernando', email: 'alice@student.com', password: 'student123', role: 'student' },
  { id: 2, name: 'Bob Perera', email: 'bob@student.com', password: 'student123', role: 'student' },
  {
    id: 3, name: 'Dr. Kamal Silva', email: 'kamal@conductor.com', password: 'conductor123', role: 'conductor',
    title: 'Senior Lecturer', university: 'University of Colombo',
    bio: 'PhD in Mathematics with over 15 years of university teaching experience. Specialises in Algebra, Calculus, and Organic Chemistry. Known for clear, structured explanations that make complex topics feel approachable.',
    subjects: ['Mathematics', 'Chemistry'],
    rating: 4.8, totalStudents: 320, classesHeld: 85,
  },
  {
    id: 4, name: 'Dr. Nimal Jayawardena', email: 'nimal@conductor.com', password: 'conductor123', role: 'conductor',
    title: 'Associate Professor', university: 'University of Peradeniya',
    bio: 'Expert in Physics and Biology with a passion for making complex concepts accessible to every student. Brings real-world applications and lab experiences into every kuppi session.',
    subjects: ['Physics', 'Biology'],
    rating: 4.7, totalStudents: 210, classesHeld: 62,
  },
];

export const dummyClasses = [
  {
    id: 1, conductorId: 3,
    title: 'Mathematics - Algebra Basics', conductor: 'Dr. Kamal Silva', subject: 'Mathematics',
    date: '2026-04-01', time: '10:00 AM', seats: 30, enrolled: 18, fee: 1500,
    location: 'Online (Zoom)', duration: '3 hours',
    description: 'Cover core algebra concepts from scratch — equations, inequalities, functions, and graphing. Ideal for first and second year students preparing for internal exams. Past paper questions are worked through at the end.',
  },
  {
    id: 2, conductorId: 4,
    title: 'Physics - Mechanics', conductor: 'Dr. Nimal Jayawardena', subject: 'Physics',
    date: '2026-04-03', time: '02:00 PM', seats: 25, enrolled: 25, fee: 1500,
    location: 'Lecture Hall 3, Faculty of Science', duration: '4 hours',
    description: 'In-depth revision of classical mechanics: Newton\'s laws, momentum, energy conservation, circular motion, and rotational dynamics. Includes problem-solving strategies for exam questions.',
  },
  {
    id: 3, conductorId: 3,
    title: 'Chemistry - Organic Chemistry', conductor: 'Dr. Kamal Silva', subject: 'Chemistry',
    date: '2026-04-05', time: '09:00 AM', seats: 20, enrolled: 10, fee: 1200,
    location: 'Online (Google Meet)', duration: '2.5 hours',
    description: 'Complete overview of organic chemistry mechanisms: substitution, elimination, addition reactions, and stereochemistry. Worked examples from past papers with detailed marking schemes.',
  },
  {
    id: 4, conductorId: 4,
    title: 'Biology - Cell Biology', conductor: 'Dr. Nimal Jayawardena', subject: 'Biology',
    date: '2026-04-07', time: '11:00 AM', seats: 35, enrolled: 30, fee: 1300,
    location: 'Biology Lab 2, Faculty of Science', duration: '3 hours',
    description: 'Comprehensive cell biology kuppi covering organelles, cell division (mitosis & meiosis), membrane transport, and cellular respiration. Diagrams and model answers provided.',
  },
  {
    id: 5, conductorId: 3,
    title: 'Mathematics - Differential Calculus', conductor: 'Dr. Kamal Silva', subject: 'Mathematics',
    date: '2026-04-10', time: '10:00 AM', seats: 25, enrolled: 12, fee: 1500,
    location: 'Online (Zoom)', duration: '3 hours',
    description: 'Differentiation rules, chain rule, implicit differentiation, related rates, and optimisation problems drawn from university past papers. Step-by-step solutions for every problem.',
  },
  {
    id: 6, conductorId: 4,
    title: 'Physics - Electromagnetism', conductor: 'Dr. Nimal Jayawardena', subject: 'Physics',
    date: '2026-04-12', time: '03:00 PM', seats: 30, enrolled: 8, fee: 1800,
    location: 'Physics Lab 1, Faculty of Science', duration: '4 hours',
    description: 'Electric fields, magnetic fields, Faraday\'s law, Maxwell\'s equations, and electromagnetic waves explained with practical demonstrations and numerical examples.',
  },
];

export const dummyAnnouncements = [
  {
    id: 1, conductorId: 3, pinned: true,
    title: 'April Class Schedule is Now Live!',
    body: 'All April kuppi sessions are open for registration. Check available classes now.',
    description: 'All April kuppi sessions are now open for registration. Early enrollment is recommended as seats fill very fast. Browse the full class list on the home page and secure your spot before they run out. New classes are being added weekly!',
    image: null,
    date: '2026-03-22', startDate: '2026-03-22', endDate: '2026-04-15',
  },
  {
    id: 2, conductorId: 3, pinned: false,
    title: 'Chemistry Class — Early Bird Discount',
    body: 'First 5 students to register for Organic Chemistry get a 20% fee reduction.',
    description: 'First 5 students to register for the Organic Chemistry session will receive a 20% fee reduction — pay only Rs. 960 instead of Rs. 1200. Offer is valid until April 5th. Register now from the class list below.',
    image: null,
    date: '2026-03-22', startDate: '2026-03-22', endDate: '2026-04-05',
  },
  {
    id: 3, conductorId: 4, pinned: false,
    title: 'New Physics Lab Session — Electromagnetism',
    body: 'Hands-on electromagnetism lab session added on April 12th. Limited seats!',
    description: 'A new electromagnetism lab session with hands-on experiments and live demonstrations has been scheduled for April 12th at Physics Lab 1. Strictly limited to 30 students. Register early to guarantee your place in the lab!',
    image: null,
    date: '2026-03-23', startDate: '2026-03-23', endDate: '2026-04-12',
  },
  {
    id: 4, conductorId: 4, pinned: false,
    title: 'Platform Welcome — Getting Started Guide',
    body: 'Welcome to KuppiConnect! The platform is now live for all students.',
    description: 'Welcome to KuppiConnect! This notice has now expired. Thank you to all early adopters who joined in March. We continue to grow with new conductors and sessions added each week.',
    image: null,
    date: '2026-03-01', startDate: '2026-03-01', endDate: '2026-03-23', // EXPIRED
  },
];

export const dummyContent = [
  { id: 1, classId: 1, title: 'Algebra Basics - Lecture Notes', type: 'PDF', url: '#', uploadedBy: 'Dr. Kamal Silva', uploadedAt: '2026-03-20' },
  { id: 2, classId: 1, title: 'Algebra Practice Problems', type: 'PDF', url: '#', uploadedBy: 'Dr. Kamal Silva', uploadedAt: '2026-03-21' },
  { id: 3, classId: 3, title: 'Organic Chemistry - Module 1', type: 'Video', url: '#', uploadedBy: 'Dr. Kamal Silva', uploadedAt: '2026-03-22' },
];

export const dummyReviews = [
  { id: 1, classId: 1, studentName: 'Alice Fernando', rating: 5, comment: 'Excellent explanations! Very clear and well-paced.', date: '2026-03-23' },
  { id: 2, classId: 1, studentName: 'Bob Perera', rating: 4, comment: 'Good class, would recommend to others.', date: '2026-03-23' },
  { id: 3, classId: 3, studentName: 'Alice Fernando', rating: 5, comment: 'Best chemistry class I have attended.', date: '2026-03-22' },
];

// Enrollment records — maps classId → student details
export const dummyEnrollments = [
  { classId: 1, studentId: 1, studentName: 'Alice Fernando', email: 'alice@student.com', phone: '+94 77 111 2233', registeredAt: '2026-03-20' },
  { classId: 1, studentId: 2, studentName: 'Bob Perera',     email: 'bob@student.com',   phone: '+94 76 444 5566', registeredAt: '2026-03-21' },
  { classId: 2, studentId: 1, studentName: 'Alice Fernando', email: 'alice@student.com', phone: '+94 77 111 2233', registeredAt: '2026-03-21' },
  { classId: 3, studentId: 1, studentName: 'Alice Fernando', email: 'alice@student.com', phone: '+94 77 111 2233', registeredAt: '2026-03-22' },
  { classId: 3, studentId: 2, studentName: 'Bob Perera',     email: 'bob@student.com',   phone: '+94 76 444 5566', registeredAt: '2026-03-22' },
  { classId: 4, studentId: 2, studentName: 'Bob Perera',     email: 'bob@student.com',   phone: '+94 76 444 5566', registeredAt: '2026-03-22' },
  { classId: 5, studentId: 1, studentName: 'Alice Fernando', email: 'alice@student.com', phone: '+94 77 111 2233', registeredAt: '2026-03-23' },
  { classId: 5, studentId: 2, studentName: 'Bob Perera',     email: 'bob@student.com',   phone: '+94 76 444 5566', registeredAt: '2026-03-23' },
  { classId: 6, studentId: 1, studentName: 'Alice Fernando', email: 'alice@student.com', phone: '+94 77 111 2233', registeredAt: '2026-03-23' },
];


