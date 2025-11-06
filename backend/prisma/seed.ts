import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if user wants to reset data (via environment variable)
  const RESET_DATA = process.env.RESET_DATA === 'true' || process.env.RESET_DATA === '1';
  
  if (RESET_DATA) {
    // Clean existing data (only if RESET_DATA=true)
    // Order matters: delete child records first to avoid foreign key constraints
    console.log('🧹 Cleaning existing data (RESET_DATA=true)...');
    await prisma.taskLabel.deleteMany();
    await prisma.label.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.taskAttachment.deleteMany();
    await prisma.aIQuery.deleteMany();
    await prisma.documentChunk.deleteMany();
    await prisma.document.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.filterPreset.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectStudent.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Data cleaned');
  } else {
    console.log('ℹ️  Skipping data cleanup (set RESET_DATA=true to clean before seeding)');
    console.log('ℹ️  Existing data will be preserved. Duplicate entries may be skipped.');
  }

  // Create Admin (skip if already exists)
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@research.edu' }
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@research.edu',
        passwordHash: await bcrypt.hash('admin123', 10),
        fullName: 'System Administrator',
        role: 'ADMIN',
      },
    });
    console.log('✅ Created admin user');
  } else {
    console.log('ℹ️  Admin user already exists, skipping...');
  }

  // Create System Project for public documents (skip if already exists)
  let systemProject = await prisma.project.findUnique({
    where: { id: 'system-library-project' }
  });

  if (!systemProject) {
    systemProject = await prisma.project.create({
      data: {
        id: 'system-library-project',
        title: 'Public Library',
        description: 'System project for public documents, reference materials, templates, and guidelines',
        lecturerId: admin.id,
        status: 'COMPLETED',
        startDate: new Date(),
        endDate: null,
        progress: 100,
        isSystemProject: true,
      },
    });
    console.log('✅ Created system project for public documents');
  } else {
    console.log('ℹ️  System project already exists, skipping...');
  }

  // Create Lecturers (skip if already exist)
  let lecturer1 = await prisma.user.findUnique({
    where: { email: 'lecturer1@research.edu' }
  });

  if (!lecturer1) {
    lecturer1 = await prisma.user.create({
      data: {
        email: 'lecturer1@research.edu',
        passwordHash: await bcrypt.hash('lecturer123', 10),
        fullName: 'Dr. Nguyễn Văn A',
        role: 'LECTURER',
      },
    });
  }

  let lecturer2 = await prisma.user.findUnique({
    where: { email: 'lecturer2@research.edu' }
  });

  if (!lecturer2) {
    lecturer2 = await prisma.user.create({
      data: {
        email: 'lecturer2@research.edu',
        passwordHash: await bcrypt.hash('lecturer123', 10),
        fullName: 'Dr. Trần Thị B',
        role: 'LECTURER',
      },
    });
  }

  if (!lecturer1 || !lecturer2) {
    console.log('✅ Created lecturers');
  } else {
    console.log('ℹ️  Lecturers already exist, skipping...');
  }

  // Create Students (skip if already exist)
  const studentEmails = [
    'student1@research.edu',
    'student2@research.edu',
    'student3@research.edu',
    'student4@research.edu',
    'student5@research.edu'
  ];

  const existingStudents = await prisma.user.findMany({
    where: {
      email: { in: studentEmails }
    }
  });

  const existingStudentEmails = new Set(existingStudents.map(s => s.email));

  const student1 = existingStudentEmails.has('student1@research.edu')
    ? existingStudents.find(s => s.email === 'student1@research.edu')!
    : await prisma.user.create({
        data: {
          email: 'student1@research.edu',
          passwordHash: await bcrypt.hash('student123', 10),
          fullName: 'Lê Văn C',
          role: 'STUDENT',
          studentId: 'SV001',
        },
      });

  const student2 = existingStudentEmails.has('student2@research.edu')
    ? existingStudents.find(s => s.email === 'student2@research.edu')!
    : await prisma.user.create({
        data: {
          email: 'student2@research.edu',
          passwordHash: await bcrypt.hash('student123', 10),
          fullName: 'Phạm Thị D',
          role: 'STUDENT',
          studentId: 'SV002',
        },
      });

  const student3 = existingStudentEmails.has('student3@research.edu')
    ? existingStudents.find(s => s.email === 'student3@research.edu')!
    : await prisma.user.create({
        data: {
          email: 'student3@research.edu',
          passwordHash: await bcrypt.hash('student123', 10),
          fullName: 'Hoàng Văn E',
          role: 'STUDENT',
          studentId: 'SV003',
        },
      });

  const student4 = existingStudentEmails.has('student4@research.edu')
    ? existingStudents.find(s => s.email === 'student4@research.edu')!
    : await prisma.user.create({
        data: {
          email: 'student4@research.edu',
          passwordHash: await bcrypt.hash('student123', 10),
          fullName: 'Vũ Thị F',
          role: 'STUDENT',
          studentId: 'SV004',
        },
      });

  const student5 = existingStudentEmails.has('student5@research.edu')
    ? existingStudents.find(s => s.email === 'student5@research.edu')!
    : await prisma.user.create({
        data: {
          email: 'student5@research.edu',
          passwordHash: await bcrypt.hash('student123', 10),
          fullName: 'Đặng Văn G',
          role: 'STUDENT',
          studentId: 'SV005',
        },
      });

  if (existingStudentEmails.size < studentEmails.length) {
    console.log('✅ Created students');
  } else {
    console.log('ℹ️  Students already exist, skipping...');
  }

  // Create Projects (skip if already exist - check by title)
  let project1 = await prisma.project.findFirst({
    where: { title: 'Nghiên cứu ứng dụng AI trong giáo dục' }
  });

  if (!project1) {
    project1 = await prisma.project.create({
      data: {
        title: 'Nghiên cứu ứng dụng AI trong giáo dục',
        description: 'Đề tài nghiên cứu về việc áp dụng trí tuệ nhân tạo vào quản lý và hỗ trợ giảng dạy trong các trường đại học.',
        lecturerId: lecturer1.id,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        status: 'IN_PROGRESS',
        progress: 45,
      },
    });
  }

  let project2 = await prisma.project.findFirst({
    where: { title: 'Phát triển hệ thống IoT cho nhà thông minh' }
  });

  if (!project2) {
    project2 = await prisma.project.create({
      data: {
        title: 'Phát triển hệ thống IoT cho nhà thông minh',
        description: 'Xây dựng hệ thống quản lý và điều khiển thiết bị thông minh trong gia đình sử dụng công nghệ IoT.',
        lecturerId: lecturer1.id,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-07-31'),
        status: 'IN_PROGRESS',
        progress: 30,
      },
    });
  }

  let project3 = await prisma.project.findFirst({
    where: { title: 'Phân tích dữ liệu lớn với Machine Learning' }
  });

  if (!project3) {
    project3 = await prisma.project.create({
      data: {
        title: 'Phân tích dữ liệu lớn với Machine Learning',
        description: 'Nghiên cứu và ứng dụng các thuật toán machine learning để phân tích và dự đoán xu hướng từ dữ liệu lớn.',
        lecturerId: lecturer2.id,
        startDate: new Date('2024-08-15'),
        endDate: new Date('2025-05-30'),
        status: 'IN_PROGRESS',
        progress: 60,
      },
    });
  }

  if (!project1 || !project2 || !project3) {
    console.log('✅ Created projects');
  } else {
    console.log('ℹ️  Projects already exist, skipping...');
  }

  // Add students to projects (skip if already exist)
  const existingProjectStudents = await prisma.projectStudent.findMany({
    where: {
      projectId: { in: [project1.id, project2.id, project3.id] }
    }
  });

  const projectStudentKeys = new Set(
    existingProjectStudents.map(ps => `${ps.projectId}-${ps.studentId}`)
  );

  const projectStudentData = [
    // Project 1 - AI in Education (3 students - team project)
    { projectId: project1.id, studentId: student1.id, role: 'LEAD' },
    { projectId: project1.id, studentId: student2.id, role: 'MEMBER' },
    { projectId: project1.id, studentId: student4.id, role: 'MEMBER' },
    // Project 2 - IoT Smart Home (2 students)
    { projectId: project2.id, studentId: student2.id, role: 'LEAD' },
    { projectId: project2.id, studentId: student5.id, role: 'MEMBER' },
    // Project 3 - Big Data ML (single student)
    { projectId: project3.id, studentId: student3.id, role: 'LEAD' },
  ];

  const newProjectStudents = projectStudentData.filter(
    ps => !projectStudentKeys.has(`${ps.projectId}-${ps.studentId}`)
  );

  if (newProjectStudents.length > 0) {
    await prisma.projectStudent.createMany({
      data: newProjectStudents,
    });
    console.log(`✅ Created ${newProjectStudents.length} project-student assignments`);
  } else {
    console.log('ℹ️  Project-student assignments already exist, skipping...');
  }

  // Create Tasks for Project 1
  await prisma.task.createMany({
    data: [
      {
        projectId: project1.id,
        title: 'Nghiên cứu tài liệu tham khảo',
        description: 'Tìm hiểu các nghiên cứu liên quan về AI trong giáo dục',
        assigneeId: student1.id,
        status: 'COMPLETED',
        priority: 'HIGH',
        completedAt: new Date('2024-10-15'),
      },
      {
        projectId: project1.id,
        title: 'Thiết kế hệ thống',
        description: 'Thiết kế kiến trúc tổng thể của hệ thống',
        assigneeId: student1.id,
        status: 'COMPLETED',
        priority: 'HIGH',
        completedAt: new Date('2024-11-20'),
      },
      {
        projectId: project1.id,
        title: 'Xây dựng prototype',
        description: 'Phát triển phiên bản demo đầu tiên',
        assigneeId: student1.id,
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date('2025-02-28'),
      },
      {
        projectId: project1.id,
        title: 'Testing và đánh giá',
        description: 'Kiểm thử hệ thống và thu thập phản hồi',
        assigneeId: student1.id,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2025-04-30'),
      },
      {
        projectId: project1.id,
        title: 'Hoàn thiện báo cáo',
        description: 'Viết báo cáo tốt nghiệp hoàn chỉnh',
        assigneeId: student1.id,
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date('2025-06-15'),
      },
    ],
  });

  // Create Tasks for Project 2
  await prisma.task.createMany({
    data: [
      {
        projectId: project2.id,
        title: 'Khảo sát yêu cầu người dùng',
        description: 'Thu thập và phân tích nhu cầu của người dùng',
        assigneeId: student2.id,
        status: 'COMPLETED',
        priority: 'HIGH',
        completedAt: new Date('2024-11-10'),
      },
      {
        projectId: project2.id,
        title: 'Thiết kế phần cứng',
        description: 'Lựa chọn và thiết kế các module IoT',
        assigneeId: student2.id,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2025-01-31'),
      },
      {
        projectId: project2.id,
        title: 'Phát triển ứng dụng mobile',
        description: 'Xây dựng app điều khiển trên điện thoại',
        assigneeId: student5.id,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2025-04-30'),
      },
      {
        projectId: project2.id,
        title: 'Tích hợp hệ thống',
        description: 'Kết nối các module IoT với ứng dụng',
        assigneeId: student5.id,
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date('2025-05-15'),
      },
    ],
  });

  // Create Tasks for Project 3
  await prisma.task.createMany({
    data: [
      {
        projectId: project3.id,
        title: 'Thu thập dữ liệu',
        description: 'Tìm kiếm và thu thập các dataset phù hợp',
        assigneeId: student3.id,
        status: 'COMPLETED',
        priority: 'HIGH',
        completedAt: new Date('2024-09-30'),
      },
      {
        projectId: project3.id,
        title: 'Tiền xử lý dữ liệu',
        description: 'Làm sạch và chuẩn hóa dữ liệu',
        assigneeId: student3.id,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2025-01-15'),
      },
      {
        projectId: project3.id,
        title: 'Xây dựng model ML',
        description: 'Phát triển và huấn luyện các mô hình machine learning',
        assigneeId: student3.id,
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date('2025-03-30'),
      },
      {
        projectId: project3.id,
        title: 'Đánh giá và tối ưu',
        description: 'Đánh giá hiệu suất và tối ưu hóa model',
        assigneeId: student3.id,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2025-05-15'),
      },
    ],
  });

  console.log('✅ Created tasks for all projects');

  // Get all created tasks for label assignment
  const allTasks = await prisma.task.findMany({
    where: {
      projectId: {
        in: [project1.id, project2.id, project3.id]
      }
    }
  });

  // Create Global Labels (Admin only)
  console.log('\n🏷️  Creating labels...');
  const globalLabel1 = await prisma.label.create({
    data: {
      name: 'Urgent',
      color: '#EF4444',
      projectId: null, // Global label
      createdBy: admin.id,
    },
  });

  const globalLabel2 = await prisma.label.create({
    data: {
      name: 'Important',
      color: '#F59E0B',
      projectId: null,
      createdBy: admin.id,
    },
  });

  const globalLabel3 = await prisma.label.create({
    data: {
      name: 'Research',
      color: '#8B5CF6',
      projectId: null,
      createdBy: admin.id,
    },
  });

  const globalLabel4 = await prisma.label.create({
    data: {
      name: 'Documentation',
      color: '#10B981',
      projectId: null,
      createdBy: admin.id,
    },
  });

  console.log('✅ Created 4 global labels');

  // Create Project-specific Labels for Project 1
  const project1Label1 = await prisma.label.create({
    data: {
      name: 'AI/ML',
      color: '#3B82F6',
      projectId: project1.id,
      createdBy: lecturer1.id,
    },
  });

  const project1Label2 = await prisma.label.create({
    data: {
      name: 'Frontend',
      color: '#EC4899',
      projectId: project1.id,
      createdBy: lecturer1.id,
    },
  });

  const project1Label3 = await prisma.label.create({
    data: {
      name: 'Backend',
      color: '#06B6D4',
      projectId: project1.id,
      createdBy: lecturer1.id,
    },
  });

  // Create Project-specific Labels for Project 2
  const project2Label1 = await prisma.label.create({
    data: {
      name: 'Hardware',
      color: '#F97316',
      projectId: project2.id,
      createdBy: lecturer1.id,
    },
  });

  const project2Label2 = await prisma.label.create({
    data: {
      name: 'Mobile App',
      color: '#6366F1',
      projectId: project2.id,
      createdBy: lecturer1.id,
    },
  });

  // Create Project-specific Labels for Project 3
  const project3Label1 = await prisma.label.create({
    data: {
      name: 'Data Processing',
      color: '#84CC16',
      projectId: project3.id,
      createdBy: lecturer2.id,
    },
  });

  const project3Label2 = await prisma.label.create({
    data: {
      name: 'Model Training',
      color: '#14B8A6',
      projectId: project3.id,
      createdBy: lecturer2.id,
    },
  });

  console.log('✅ Created project-specific labels');

  // Assign labels to tasks
  const project1Tasks = allTasks.filter(t => t.projectId === project1.id);
  const project2Tasks = allTasks.filter(t => t.projectId === project2.id);
  const project3Tasks = allTasks.filter(t => t.projectId === project3.id);

  // Project 1 tasks labels
  if (project1Tasks.length > 0) {
    await prisma.taskLabel.createMany({
      data: [
        // Task 1: Nghiên cứu tài liệu tham khảo
        { taskId: project1Tasks[0].id, labelId: globalLabel3.id }, // Research
        { taskId: project1Tasks[0].id, labelId: globalLabel2.id }, // Important
        { taskId: project1Tasks[0].id, labelId: project1Label1.id }, // AI/ML
        
        // Task 2: Thiết kế hệ thống
        { taskId: project1Tasks[1].id, labelId: globalLabel2.id }, // Important
        { taskId: project1Tasks[1].id, labelId: project1Label1.id }, // AI/ML
        { taskId: project1Tasks[1].id, labelId: project1Label3.id }, // Backend
        
        // Task 3: Xây dựng prototype
        { taskId: project1Tasks[2].id, labelId: globalLabel1.id }, // Urgent
        { taskId: project1Tasks[2].id, labelId: project1Label1.id }, // AI/ML
        { taskId: project1Tasks[2].id, labelId: project1Label2.id }, // Frontend
        { taskId: project1Tasks[2].id, labelId: project1Label3.id }, // Backend
        
        // Task 4: Testing và đánh giá
        { taskId: project1Tasks[3].id, labelId: project1Label2.id }, // Frontend
        { taskId: project1Tasks[3].id, labelId: project1Label3.id }, // Backend
        
        // Task 5: Hoàn thiện báo cáo
        { taskId: project1Tasks[4].id, labelId: globalLabel1.id }, // Urgent
        { taskId: project1Tasks[4].id, labelId: globalLabel2.id }, // Important
        { taskId: project1Tasks[4].id, labelId: globalLabel4.id }, // Documentation
      ],
    });
  }

  // Project 2 tasks labels
  if (project2Tasks.length > 0) {
    await prisma.taskLabel.createMany({
      data: [
        // Task 1: Khảo sát yêu cầu người dùng
        { taskId: project2Tasks[0].id, labelId: globalLabel3.id }, // Research
        { taskId: project2Tasks[0].id, labelId: globalLabel2.id }, // Important
        
        // Task 2: Thiết kế phần cứng
        { taskId: project2Tasks[1].id, labelId: globalLabel1.id }, // Urgent
        { taskId: project2Tasks[1].id, labelId: globalLabel2.id }, // Important
        { taskId: project2Tasks[1].id, labelId: project2Label1.id }, // Hardware
        
        // Task 3: Phát triển ứng dụng mobile
        { taskId: project2Tasks[2].id, labelId: project2Label2.id }, // Mobile App
        
        // Task 4: Tích hợp hệ thống
        { taskId: project2Tasks[3].id, labelId: globalLabel1.id }, // Urgent
        { taskId: project2Tasks[3].id, labelId: project2Label1.id }, // Hardware
        { taskId: project2Tasks[3].id, labelId: project2Label2.id }, // Mobile App
      ],
    });
  }

  // Project 3 tasks labels
  if (project3Tasks.length > 0) {
    await prisma.taskLabel.createMany({
      data: [
        // Task 1: Thu thập dữ liệu
        { taskId: project3Tasks[0].id, labelId: globalLabel3.id }, // Research
        { taskId: project3Tasks[0].id, labelId: globalLabel2.id }, // Important
        
        // Task 2: Tiền xử lý dữ liệu
        { taskId: project3Tasks[1].id, labelId: globalLabel1.id }, // Urgent
        { taskId: project3Tasks[1].id, labelId: project3Label1.id }, // Data Processing
        
        // Task 3: Xây dựng model ML
        { taskId: project3Tasks[2].id, labelId: globalLabel1.id }, // Urgent
        { taskId: project3Tasks[2].id, labelId: globalLabel2.id }, // Important
        { taskId: project3Tasks[2].id, labelId: project3Label2.id }, // Model Training
        
        // Task 4: Đánh giá và tối ưu
        { taskId: project3Tasks[3].id, labelId: project3Label2.id }, // Model Training
        { taskId: project3Tasks[3].id, labelId: globalLabel4.id }, // Documentation
      ],
    });
  }

  console.log('✅ Assigned labels to tasks');

  // Create sample documents
  console.log('\n📄 Creating sample documents...');
  
  const documents = await prisma.document.createMany({
    data: [
      {
        projectId: project1.id,
        fileName: 'CV.docx',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample_cv.docx',
        fileSize: 65123,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedBy: student1.id,
        description: 'CVVVVVVVVVV',
        status: 'PENDING',
      },
      {
        projectId: project1.id,
        fileName: 'CV.pdf',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample_cv.pdf',
        fileSize: 214123,
        mimeType: 'application/pdf',
        uploadedBy: student1.id,
        description: 'AAA',
        status: 'APPROVED',
      },
      {
        projectId: project1.id,
        fileName: 'quy_trinh_core_noneAl.txt',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/workflow.txt',
        fileSize: 4496,
        mimeType: 'text/plain',
        uploadedBy: lecturer1.id,
        description: 'Workflow Al',
        status: 'PENDING',
      },
      {
        projectId: project2.id,
        fileName: 'IoT_Design.pdf',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/iot_design.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        uploadedBy: student2.id,
        description: 'IoT System Design Document',
        status: 'REJECTED',
      },
      // System project documents (Public library)
      {
        projectId: systemProject.id,
        fileName: 'Research_Paper_Template.docx',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/research_template.docx',
        fileSize: 45000,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedBy: admin.id,
        description: 'Mẫu báo cáo nghiên cứu khoa học chuẩn cho sinh viên',
        status: 'APPROVED',
        category: 'TEMPLATE',
        accessLevel: 'STUDENT',
        isPublic: true,
      },
      {
        projectId: systemProject.id,
        fileName: 'Thesis_Guidelines.pdf',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/thesis_guidelines.pdf',
        fileSize: 2500000,
        mimeType: 'application/pdf',
        uploadedBy: admin.id,
        description: 'Hướng dẫn viết luận văn tốt nghiệp - Quy định của khoa',
        status: 'APPROVED',
        category: 'GUIDELINE',
        accessLevel: 'STUDENT',
        isPublic: true,
      },
      {
        projectId: systemProject.id,
        fileName: 'Machine_Learning_Reference.pdf',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/ml_reference.pdf',
        fileSize: 5000000,
        mimeType: 'application/pdf',
        uploadedBy: admin.id,
        description: 'Tài liệu tham khảo về Machine Learning cơ bản',
        status: 'APPROVED',
        category: 'REFERENCE',
        accessLevel: 'STUDENT',
        isPublic: true,
      },
    ],
  });

  console.log('✅ Created sample documents (including public library)');

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      // Project 1 notifications
      {
        userId: student1.id,
        projectId: project1.id,
        type: 'DEADLINE_APPROACHING',
        title: 'Deadline sắp đến',
        message: 'Task "Xây dựng prototype" sẽ đến hạn vào ngày 28/02/2025',
        isRead: false,
      },
      {
        userId: student2.id,
        projectId: project1.id,
        type: 'COMMENT_ADDED',
        title: 'Giảng viên đã nhận xét',
        message: 'Dr. Nguyễn Văn A đã thêm nhận xét về báo cáo tiến độ của team',
        isRead: false,
      },
      {
        userId: lecturer1.id,
        projectId: project1.id,
        type: 'TASK_COMPLETED',
        title: 'Sinh viên hoàn thành task',
        message: 'Lê Văn C đã hoàn thành task "Thiết kế hệ thống"',
        isRead: true,
      },
      // Project 2 notifications
      {
        userId: student2.id,
        projectId: project2.id,
        type: 'DEADLINE_APPROACHING',
        title: 'Deadline sắp đến',
        message: 'Task "Thiết kế phần cứng" sẽ đến hạn vào ngày 31/01/2025',
        isRead: false,
      },
      {
        userId: student5.id,
        projectId: project2.id,
        type: 'TASK_ASSIGNED',
        title: 'Task mới được giao',
        message: 'Bạn đã được giao task "Phát triển ứng dụng mobile"',
        isRead: false,
      },
      // Project 3 notifications
      {
        userId: student3.id,
        projectId: project3.id,
        type: 'TASK_COMPLETED',
        title: 'Hoàn thành task',
        message: 'Bạn đã hoàn thành task "Thu thập dữ liệu"',
        isRead: true,
      },
      {
        userId: lecturer2.id,
        projectId: project3.id,
        type: 'PROJECT_STATUS_CHANGED',
        title: 'Cập nhật tiến độ',
        message: 'Hoàng Văn E đã cập nhật tiến độ project lên 60%',
        isRead: false,
      },
    ],
  });

  console.log('✅ Created notifications');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Demo accounts:');
  console.log('Admin:     admin@research.edu / admin123');
  console.log('Lecturer:  lecturer1@research.edu / lecturer123');
  console.log('Lecturer:  lecturer2@research.edu / lecturer123');
  console.log('Student:   student1@research.edu / student123 (Lead of Project 1)');
  console.log('Student:   student2@research.edu / student123 (Member of Project 1, Lead of Project 2)');
  console.log('Student:   student3@research.edu / student123 (Lead of Project 3)');
  console.log('Student:   student4@research.edu / student123 (Member of Project 1)');
  console.log('Student:   student5@research.edu / student123 (Member of Project 2)');
  console.log('\n📊 Project assignments:');
  console.log('Project 1: AI in Education - 3 students (student1 LEAD, student2+4 MEMBERS)');
  console.log('Project 2: IoT Smart Home - 2 students (student2 LEAD, student5 MEMBER)');
  console.log('Project 3: Big Data ML - 1 student (student3 LEAD)');
  console.log('\n🏷️  Labels created:');
  console.log('Global labels: Urgent, Important, Research, Documentation');
  console.log('Project 1 labels: AI/ML, Frontend, Backend');
  console.log('Project 2 labels: Hardware, Mobile App');
  console.log('Project 3 labels: Data Processing, Model Training');
  console.log('\n💡 Usage tips:');
  console.log('  - Default: Seed script preserves existing data (skips duplicates)');
  console.log('  - To reset all data before seeding, run: RESET_DATA=true npx prisma db seed');
  console.log('  - Or use: npx prisma migrate reset (resets DB + runs seed automatically)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

