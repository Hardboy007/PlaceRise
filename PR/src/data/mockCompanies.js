const mockCompanies = [
  {
    id: 1, company: "Google", role: "Software Engineer", ctc: 25, lastDate: "10 May 2026",
    branches: ["CSE", "ECE"], cgpa: 7.5, location: "Bangalore", jobType: "Full Time",
    workDays: "5 days/week", shift: "Day Shift", experience: "0-2 Years",
    about: "Google LLC is an American multinational technology company focusing on search engine technology, online advertising, cloud computing, and more.",
    techStack: ["React", "Node.js", "Python", "GCP", "Kubernetes"],
    skills: ["DSA", "System Design", "React", "Node.js", "SQL"],
    perks: ["Health Insurance", "Work From Home", "Flexible Hours", "Stock Options"],
    selectionProcess: [
      { title: "Online Assessment", description: "Aptitude + Coding test on HackerRank. Duration: 90 mins.", type: "Online" },
      { title: "Technical Interview – Round 1", description: "DSA & problem solving. 45–60 mins.", type: "Technical" },
      { title: "Technical Interview – Round 2", description: "System design + project discussion. 45 mins.", type: "Technical" },
      { title: "HR Interview", description: "Culture fit, communication & CTC discussion. 30 mins.", type: "HR" },
    ]
  },
  {
    id: 2, company: "Google", role: "Backend Developer", ctc: 24, lastDate: "10 May 2026",
    branches: ["CSE"], cgpa: 7.5, location: "Hyderabad", jobType: "Full Time",
    workDays: "5 days/week", shift: "Day Shift", experience: "0-3 Years",
    about: "Google LLC is an American multinational technology company focusing on search engine technology, online advertising, cloud computing, and more.",
    techStack: ["Java", "Python", "GCP", "Kubernetes", "PostgreSQL"],
    skills: ["DSA", "System Design", "Java", "Microservices", "SQL"],
    perks: ["Health Insurance", "Work From Home", "Flexible Hours", "Stock Options"],
    selectionProcess: [
      { title: "Online Assessment", description: "Coding test focused on backend & algorithms. 90 mins.", type: "Online" },
      { title: "Technical Interview – Round 1", description: "Java, microservices & DSA. 60 mins.", type: "Technical" },
      { title: "Technical Interview – Round 2", description: "System design & database architecture. 45 mins.", type: "Technical" },
      { title: "HR Interview", description: "Culture fit & CTC discussion. 30 mins.", type: "HR" },
    ]
  },
  {
    id: 3, company: "Google", role: "Frontend Developer", ctc: 23, lastDate: "10 May 2026",
    branches: ["CSE"], cgpa: 7.0, location: "Pune", jobType: "Full Time",
    workDays: "5 days/week", shift: "Day Shift", experience: "0-2 Years",
    about: "Google LLC is an American multinational technology company focusing on search engine technology, online advertising, cloud computing, and more.",
    techStack: ["React", "TypeScript", "CSS", "Webpack"],
    skills: ["React", "TypeScript", "CSS", "Performance Optimization"],
    perks: ["Health Insurance", "Flexible Hours", "Stock Options"],
    selectionProcess: [
      { title: "Online Assessment", description: "UI/UX problem + JS coding challenge. 60 mins.", type: "Online" },
      { title: "Technical Interview – Round 1", description: "React, TypeScript & browser internals. 45 mins.", type: "Technical" },
      { title: "Technical Interview – Round 2", description: "Performance optimization & live coding. 45 mins.", type: "Technical" },
      { title: "HR Interview", description: "Culture fit & offer discussion. 30 mins.", type: "HR" },
    ]
  },
  {
    id: 4, company: "Amazon", role: "SDE Intern", ctc: 12, lastDate: "15 May 2026",
    branches: ["All"], cgpa: 6.0, location: "Bangalore", jobType: "Internship",
    workDays: "5 days/week", shift: "Day Shift", experience: "Freshers",
    about: "Amazon is an American multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence.",
    techStack: ["Java", "AWS", "DynamoDB", "Lambda"],
    skills: ["DSA", "Java", "AWS Basics", "Problem Solving"],
    perks: ["Health Insurance", "Meals", "Laptop Provided"],
    selectionProcess: [
      { title: "Online Assessment", description: "DSA + aptitude test on HireVue. 75 mins.", type: "Online" },
      { title: "Technical Interview", description: "DSA, Java & AWS basics. Leadership principles. 60 mins.", type: "Technical" },
      { title: "HR Interview", description: "Internship expectations & joining details. 20 mins.", type: "HR" },
    ]
  },
  {
    id: 5, company: "Microsoft", role: "Product Engineer", ctc: 22, lastDate: "20 May 2026",
    branches: ["ECE"], cgpa: 8.0, location: "Hyderabad", jobType: "Full Time",
    workDays: "5 days/week", shift: "Day Shift", experience: "0-2 Years",
    about: "Microsoft Corporation is an American multinational technology company producing computer software, consumer electronics, and personal computers.",
    techStack: ["C#", ".NET", "Azure", "TypeScript", "React"],
    skills: ["C#", "Azure", "System Design", "React"],
    perks: ["Health Insurance", "Stock Options", "Flexible Hours"],
    selectionProcess: [
      { title: "Online Assessment", description: "Coding + logical reasoning test. 90 mins.", type: "Online" },
      { title: "Technical Interview – Round 1", description: "C#, .NET & DSA problem solving. 60 mins.", type: "Technical" },
      { title: "Technical Interview – Round 2", description: "Azure architecture & system design. 45 mins.", type: "Technical" },
      { title: "HR Interview", description: "Behavioral + culture fit discussion. 30 mins.", type: "HR" },
    ]
  },
  {
    id: 6, company: "Infosys", role: "System Engineer", ctc: 8, lastDate: "18 May 2026",
    branches: ["CSE"], cgpa: 6.5, location: "Chennai", jobType: "Full Time",
    workDays: "5 days/week", shift: "Day Shift", experience: "Freshers",
    about: "Infosys Limited is an Indian multinational information technology company that provides business consulting, information technology and outsourcing services.",
    techStack: ["Java", "Spring Boot", "MySQL", "Angular"],
    skills: ["Java", "SQL", "Problem Solving", "Communication"],
    perks: ["Health Insurance", "Transport", "Meals"],
    selectionProcess: [
      { title: "Online Assessment", description: "Aptitude, verbal & basic coding test. 60 mins.", type: "Online" },
      { title: "Technical Interview", description: "Java, SQL & Spring Boot basics. 45 mins.", type: "Technical" },
      { title: "HR Interview", description: "Communication skills & joining formalities. 20 mins.", type: "HR" },
    ]
  },
  {
    id: 7, company: "TCS", role: "Business Analyst", ctc: 7, lastDate: "22 May 2026",
    branches: ["MBA"], cgpa: 6.0, location: "Mumbai", jobType: "Full Time",
    workDays: "5 days/week", shift: "Day Shift", experience: "Freshers",
    about: "Tata Consultancy Services is an Indian multinational information technology services and consulting company.",
    techStack: ["Excel", "Tableau", "SQL", "PowerBI"],
    skills: ["Analytics", "Communication", "Excel", "SQL"],
    perks: ["Health Insurance", "Transport"],
    selectionProcess: [
      { title: "Online Assessment", description: "Aptitude + verbal ability test. 60 mins.", type: "Online" },
      { title: "Case Study Round", description: "Business problem analysis & presentation. 45 mins.", type: "Case Study" },
      { title: "HR Interview", description: "Communication, aptitude & joining discussion. 30 mins.", type: "HR" },
    ]
  },
]

export default mockCompanies