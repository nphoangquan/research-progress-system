import {
  PrismaClient,
  Role,
  TaskStatus,
  Priority,
  Prisma,
  DocumentStatus,
  DocumentCategory,
  AccessLevel
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_PREFERENCES = {
  theme: 'light',
  language: 'vi',
  timezone: 'Asia/Ho_Chi_Minh'
};

type SeededUsers = {
  admin: Prisma.UserGetPayload<{}>;
  lecturers: Prisma.UserGetPayload<{}>[];
  students: Prisma.UserGetPayload<{}>[];
};

type SeededProjects = {
  systemProject: Prisma.ProjectGetPayload<{}>;
  project1: Prisma.ProjectGetPayload<{}>;
  project2: Prisma.ProjectGetPayload<{}>;
  project3: Prisma.ProjectGetPayload<{}>;
};

async function cleanupDatabase(shouldReset: boolean) {
  if (!shouldReset) {
    console.log('ℹ️  Skipping data cleanup (set RESET_DATA=true to clean before seeding)');
    console.log('ℹ️  Existing data will be preserved. Duplicate entries may be skipped.');
    return;
  }

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
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Data cleaned');
}

async function ensureUser(info: {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  studentId?: string | null;
}) {
  const { email, password, fullName, role, studentId } = info;
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return prisma.user.update({
      where: { email },
      data: {
        fullName,
        role,
        studentId: studentId ?? null,
        emailVerified: true,
        preferences: DEFAULT_PREFERENCES
      }
    });
  }

  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      fullName,
      role,
      studentId: studentId ?? null,
      emailVerified: true,
      preferences: DEFAULT_PREFERENCES
    }
  });
}

async function seedUsers(): Promise<SeededUsers> {
  console.log('👥 Seeding users...');

  const admin = await ensureUser({
    email: 'admin@gmail.com',
    password: 'admin123',
    fullName: 'System Administrator',
    role: 'ADMIN'
  });

  const lecturer1 = await ensureUser({
    email: 'lecturer1@gmail.com',
    password: 'lecturer123',
    fullName: 'Dr. Nguyễn Văn A',
    role: 'LECTURER'
  });

  const lecturer2 = await ensureUser({
    email: 'lecturer2@gmail.com',
    password: 'lecturer123',
    fullName: 'Dr. Trần Thị B',
    role: 'LECTURER'
  });

  const students = await Promise.all([
    ensureUser({
      email: 'student1@gmail.com',
      password: 'student123',
      fullName: 'Lê Văn C',
      role: 'STUDENT',
      studentId: 'SV001'
    }),
    ensureUser({
      email: 'student2@gmail.com',
      password: 'student123',
      fullName: 'Phạm Thị D',
      role: 'STUDENT',
      studentId: 'SV002'
    }),
    ensureUser({
      email: 'student3@gmail.com',
      password: 'student123',
      fullName: 'Hoàng Văn E',
      role: 'STUDENT',
      studentId: 'SV003'
    }),
    ensureUser({
      email: 'student4@gmail.com',
      password: 'student123',
      fullName: 'Vũ Thị F',
      role: 'STUDENT',
      studentId: 'SV004'
    }),
    ensureUser({
      email: 'student5@gmail.com',
      password: 'student123',
      fullName: 'Đặng Văn G',
      role: 'STUDENT',
      studentId: 'SV005'
    })
  ]);

  console.log('✅ Users ready');

  return {
    admin,
    lecturers: [lecturer1, lecturer2],
    students
  };
}

async function ensureProject(data: Prisma.ProjectCreateInput) {
  if (data.id) {
    return prisma.project.upsert({
      where: { id: data.id },
      update: data,
      create: data
    });
  }

  const existing = await prisma.project.findFirst({
    where: { title: data.title }
  });

  if (existing) {
    return prisma.project.update({
      where: { id: existing.id },
      data
    });
  }

  return prisma.project.create({ data });
}

async function seedProjects(users: SeededUsers): Promise<SeededProjects> {
  console.log('🏗️  Seeding projects...');

  const [lecturer1, lecturer2] = users.lecturers;
  const [student1, student2, student3, student4, student5] = users.students;

  const systemProject = await ensureProject({
    id: 'system-library-project',
    title: 'Public Library',
    description:
      'System project for public documents, reference materials, templates, and guidelines',
    lecturer: { connect: { id: users.admin.id } },
    status: 'COMPLETED',
    startDate: new Date('2025-01-01'),
    endDate: null,
    progress: 100,
    isSystemProject: true
  });

  const project1 = await ensureProject({
    title: 'Nghiên cứu ứng dụng AI trong giáo dục',
    description:
      'Đề tài nghiên cứu về việc áp dụng trí tuệ nhân tạo vào quản lý và hỗ trợ giảng dạy trong các trường đại học.',
    lecturer: { connect: { id: lecturer1.id } },
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-12-31'),
    status: 'IN_PROGRESS',
    progress: 45
  });

  const project2 = await ensureProject({
    title: 'Phát triển hệ thống IoT cho nhà thông minh',
    description:
      'Xây dựng hệ thống quản lý và điều khiển thiết bị thông minh trong gia đình sử dụng công nghệ IoT.',
    lecturer: { connect: { id: lecturer1.id } },
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-11-30'),
    status: 'IN_PROGRESS',
    progress: 30
  });

  const project3 = await ensureProject({
    title: 'Phân tích dữ liệu lớn với Machine Learning',
    description:
      'Nghiên cứu và ứng dụng các thuật toán machine learning để phân tích và dự đoán xu hướng từ dữ liệu lớn.',
    lecturer: { connect: { id: lecturer2.id } },
    startDate: new Date('2025-01-10'),
    endDate: new Date('2025-10-31'),
    status: 'IN_PROGRESS',
    progress: 60
  });

  const assignments = [
    { projectId: project1.id, studentId: student1.id, role: 'LEAD' },
    { projectId: project1.id, studentId: student2.id, role: 'MEMBER' },
    { projectId: project1.id, studentId: student4.id, role: 'MEMBER' },
    { projectId: project2.id, studentId: student2.id, role: 'LEAD' },
    { projectId: project2.id, studentId: student5.id, role: 'MEMBER' },
    { projectId: project3.id, studentId: student3.id, role: 'LEAD' }
  ];

  for (const assignment of assignments) {
    await prisma.projectStudent.upsert({
      where: {
        projectId_studentId: {
          projectId: assignment.projectId,
          studentId: assignment.studentId
        }
      },
      update: { role: assignment.role },
      create: assignment
    });
  }

  console.log('✅ Projects ready');

  return { systemProject, project1, project2, project3 };
}

type SeedTaskInput = {
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date;
  completedAt?: Date;
};

async function ensureTask(input: SeedTaskInput) {
  const existing = await prisma.task.findFirst({
    where: {
      projectId: input.projectId,
      title: input.title
    }
  });

  const updateData: Prisma.TaskUpdateInput = {
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate ?? null,
    completedAt: input.completedAt ?? null,
    assignee: { connect: { id: input.assigneeId } }
  };

  if (existing) {
    await prisma.task.update({
      where: { id: existing.id },
      data: updateData
    });
    return existing;
  }

  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
      completedAt: input.completedAt ?? null,
      assignee: { connect: { id: input.assigneeId } },
      project: { connect: { id: input.projectId } }
    }
  });
}

async function seedTasks(projects: SeededProjects, users: SeededUsers) {
  console.log('🗒️  Seeding tasks...');
  const [student1, student2, student3, , student5] = users.students;

  await Promise.all([
    ensureTask({
      projectId: projects.project1.id,
      title: 'Nghiên cứu tài liệu tham khảo',
      description: 'Tìm hiểu các nghiên cứu liên quan về AI trong giáo dục',
      assigneeId: student1.id,
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      completedAt: new Date('2025-02-15')
    }),
    ensureTask({
      projectId: projects.project1.id,
      title: 'Thiết kế hệ thống',
      description: 'Thiết kế kiến trúc tổng thể của hệ thống',
      assigneeId: student1.id,
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      completedAt: new Date('2025-03-20')
    }),
    ensureTask({
      projectId: projects.project1.id,
      title: 'Xây dựng prototype',
      description: 'Phát triển phiên bản demo đầu tiên',
      assigneeId: student1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      dueDate: new Date('2025-06-30')
    }),
    ensureTask({
      projectId: projects.project1.id,
      title: 'Testing và đánh giá',
      description: 'Kiểm thử hệ thống và thu thập phản hồi',
      assigneeId: student1.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: new Date('2025-09-30')
    }),
    ensureTask({
      projectId: projects.project1.id,
      title: 'Hoàn thiện báo cáo',
      description: 'Viết báo cáo tốt nghiệp hoàn chỉnh',
      assigneeId: student1.id,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      dueDate: new Date('2025-12-15')
    }),
    ensureTask({
      projectId: projects.project2.id,
      title: 'Khảo sát yêu cầu người dùng',
      description: 'Thu thập và phân tích nhu cầu của người dùng',
      assigneeId: student2.id,
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      completedAt: new Date('2025-03-10')
    }),
    ensureTask({
      projectId: projects.project2.id,
      title: 'Thiết kế phần cứng',
      description: 'Lựa chọn và thiết kế các module IoT',
      assigneeId: student2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: new Date('2025-05-31')
    }),
    ensureTask({
      projectId: projects.project2.id,
      title: 'Phát triển ứng dụng mobile',
      description: 'Xây dựng app điều khiển trên điện thoại',
      assigneeId: student5.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: new Date('2025-08-30')
    }),
    ensureTask({
      projectId: projects.project2.id,
      title: 'Tích hợp hệ thống',
      description: 'Kết nối các module IoT với ứng dụng',
      assigneeId: student5.id,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      dueDate: new Date('2025-10-15')
    }),
    ensureTask({
      projectId: projects.project3.id,
      title: 'Thu thập dữ liệu',
      description: 'Tìm kiếm và thu thập các dataset phù hợp',
      assigneeId: student3.id,
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      completedAt: new Date('2025-02-28')
    }),
    ensureTask({
      projectId: projects.project3.id,
      title: 'Tiền xử lý dữ liệu',
      description: 'Làm sạch và chuẩn hóa dữ liệu',
      assigneeId: student3.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: new Date('2025-05-15')
    }),
    ensureTask({
      projectId: projects.project3.id,
      title: 'Xây dựng model ML',
      description: 'Phát triển và huấn luyện các mô hình machine learning',
      assigneeId: student3.id,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      dueDate: new Date('2025-07-30')
    }),
    ensureTask({
      projectId: projects.project3.id,
      title: 'Đánh giá và tối ưu',
      description: 'Đánh giá hiệu suất và tối ưu hóa model',
      assigneeId: student3.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: new Date('2025-09-15')
    })
  ]);

  console.log('✅ Tasks ready');
}

async function seedLabels(projects: SeededProjects, users: SeededUsers) {
  console.log('🏷️  Seeding labels...');
  const [lecturer1, lecturer2] = users.lecturers;

  const globalLabels = [
    { id: 'label-global-urgent', name: 'Urgent', color: '#EF4444' },
    { id: 'label-global-important', name: 'Important', color: '#F59E0B' },
    { id: 'label-global-research', name: 'Research', color: '#8B5CF6' },
    { id: 'label-global-docs', name: 'Documentation', color: '#10B981' }
  ];

  for (const label of globalLabels) {
    await prisma.label.upsert({
      where: { id: label.id },
      update: {
        color: label.color,
        createdBy: users.admin.id
      },
      create: {
        id: label.id,
        name: label.name,
        color: label.color,
        projectId: null,
        createdBy: users.admin.id
      }
    });
  }

  const projectLabels = [
    { projectId: projects.project1.id, createdBy: lecturer1.id, name: 'AI/ML', color: '#3B82F6' },
    { projectId: projects.project1.id, createdBy: lecturer1.id, name: 'Frontend', color: '#EC4899' },
    { projectId: projects.project1.id, createdBy: lecturer1.id, name: 'Backend', color: '#06B6D4' },
    { projectId: projects.project2.id, createdBy: lecturer1.id, name: 'Hardware', color: '#F97316' },
    { projectId: projects.project2.id, createdBy: lecturer1.id, name: 'Mobile App', color: '#6366F1' },
    { projectId: projects.project3.id, createdBy: lecturer2.id, name: 'Data Processing', color: '#84CC16' },
    { projectId: projects.project3.id, createdBy: lecturer2.id, name: 'Model Training', color: '#14B8A6' }
  ];

  for (const label of projectLabels) {
    await prisma.label.upsert({
      where: {
        projectId_name: {
          projectId: label.projectId,
          name: label.name
        }
      },
      update: {
        color: label.color,
        createdBy: label.createdBy
      },
      create: label
    });
  }

  console.log('✅ Labels ready');
}

async function ensureTaskLabels(projectId: string, taskTitle: string, labelNames: string[]) {
  const task = await prisma.task.findFirst({ where: { projectId, title: taskTitle } });
  if (!task) return;

  for (const labelName of labelNames) {
    const label = await prisma.label.findFirst({
      where: {
        OR: [
          { name: labelName, projectId: null },
          { name: labelName, projectId }
        ]
      }
    });

    if (!label) continue;

    await prisma.taskLabel.upsert({
      where: {
        taskId_labelId: {
          taskId: task.id,
          labelId: label.id
        }
      },
      update: {},
      create: {
        taskId: task.id,
        labelId: label.id
      }
    });
  }
}

async function seedTaskLabels(projects: SeededProjects) {
  console.log('🔖 Assigning labels to tasks...');

  await Promise.all([
    ensureTaskLabels(projects.project1.id, 'Nghiên cứu tài liệu tham khảo', ['Research', 'Important', 'AI/ML']),
    ensureTaskLabels(projects.project1.id, 'Thiết kế hệ thống', ['Important', 'AI/ML', 'Backend']),
    ensureTaskLabels(projects.project1.id, 'Xây dựng prototype', ['Urgent', 'AI/ML', 'Frontend', 'Backend']),
    ensureTaskLabels(projects.project1.id, 'Testing và đánh giá', ['Frontend', 'Backend']),
    ensureTaskLabels(projects.project1.id, 'Hoàn thiện báo cáo', ['Urgent', 'Important', 'Documentation']),
    ensureTaskLabels(projects.project2.id, 'Khảo sát yêu cầu người dùng', ['Research', 'Important']),
    ensureTaskLabels(projects.project2.id, 'Thiết kế phần cứng', ['Urgent', 'Important', 'Hardware']),
    ensureTaskLabels(projects.project2.id, 'Phát triển ứng dụng mobile', ['Mobile App']),
    ensureTaskLabels(projects.project2.id, 'Tích hợp hệ thống', ['Urgent', 'Hardware', 'Mobile App']),
    ensureTaskLabels(projects.project3.id, 'Thu thập dữ liệu', ['Research', 'Important']),
    ensureTaskLabels(projects.project3.id, 'Tiền xử lý dữ liệu', ['Urgent', 'Data Processing']),
    ensureTaskLabels(projects.project3.id, 'Xây dựng model ML', ['Urgent', 'Important', 'Model Training']),
    ensureTaskLabels(projects.project3.id, 'Đánh giá và tối ưu', ['Model Training', 'Documentation'])
  ]);

  console.log('✅ Task labels ready');
}

type SeedDocumentInput = {
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  description?: string;
  status?: DocumentStatus;
  category?: DocumentCategory;
  accessLevel?: AccessLevel;
  isPublic?: boolean;
};

async function ensureDocument(input: SeedDocumentInput) {
  const existing = await prisma.document.findFirst({
    where: {
      projectId: input.projectId,
      fileName: input.fileName
    }
  });

  const updateData: Prisma.DocumentUpdateInput = {
    fileUrl: input.fileUrl,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    description: input.description ?? null,
    status: input.status ?? DocumentStatus.PENDING,
    category: input.category ?? DocumentCategory.PROJECT,
    accessLevel: input.accessLevel ?? AccessLevel.RESTRICTED,
    isPublic: input.isPublic ?? false,
    uploader: { connect: { id: input.uploadedBy } }
  };

  if (existing) {
    await prisma.document.update({
      where: { id: existing.id },
      data: updateData
    });
    return existing;
  }

  return prisma.document.create({
    data: {
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      description: input.description ?? null,
      status: input.status ?? DocumentStatus.PENDING,
      category: input.category ?? DocumentCategory.PROJECT,
      accessLevel: input.accessLevel ?? AccessLevel.RESTRICTED,
      isPublic: input.isPublic ?? false,
      project: { connect: { id: input.projectId } },
      uploader: { connect: { id: input.uploadedBy } }
    }
  });
}

async function seedDocuments(projects: SeededProjects, users: SeededUsers) {
  console.log('📄 Seeding documents...');
  const [student1, student2, , , student5] = users.students;
  const [lecturer1] = users.lecturers;

  await Promise.all([
    ensureDocument({
      projectId: projects.project1.id,
      fileName: 'CV.docx',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample_cv.docx',
      fileSize: 65123,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedBy: student1.id,
      description: 'CVVVVVVVVVV',
      status: DocumentStatus.PENDING
    }),
    ensureDocument({
      projectId: projects.project1.id,
      fileName: 'CV.pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample_cv.pdf',
      fileSize: 214123,
      mimeType: 'application/pdf',
      uploadedBy: student1.id,
      description: 'AAA',
      status: DocumentStatus.APPROVED
    }),
    ensureDocument({
      projectId: projects.project1.id,
      fileName: 'quy_trinh_core_noneAl.txt',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/workflow.txt',
      fileSize: 4496,
      mimeType: 'text/plain',
      uploadedBy: lecturer1.id,
      description: 'Workflow AI',
      status: DocumentStatus.PENDING
    }),
    ensureDocument({
      projectId: projects.project2.id,
      fileName: 'IoT_Design.pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/iot_design.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      uploadedBy: student2.id,
      description: 'IoT System Design Document',
      status: DocumentStatus.REJECTED
    }),
    ensureDocument({
      projectId: projects.systemProject.id,
      fileName: 'Research_Paper_Template.docx',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/research_template.docx',
      fileSize: 45000,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedBy: users.admin.id,
      description: 'Mẫu báo cáo nghiên cứu khoa học chuẩn cho sinh viên',
      status: DocumentStatus.APPROVED,
      category: DocumentCategory.TEMPLATE,
      accessLevel: AccessLevel.STUDENT,
      isPublic: true
    }),
    ensureDocument({
      projectId: projects.systemProject.id,
      fileName: 'Thesis_Guidelines.pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/thesis_guidelines.pdf',
      fileSize: 2500000,
      mimeType: 'application/pdf',
      uploadedBy: users.admin.id,
      description: 'Hướng dẫn viết luận văn tốt nghiệp - Quy định của khoa',
      status: DocumentStatus.APPROVED,
      category: DocumentCategory.GUIDELINE,
      accessLevel: AccessLevel.STUDENT,
      isPublic: true
    }),
    ensureDocument({
      projectId: projects.systemProject.id,
      fileName: 'Machine_Learning_Reference.pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1234567890/ml_reference.pdf',
      fileSize: 5000000,
      mimeType: 'application/pdf',
      uploadedBy: users.admin.id,
      description: 'Tài liệu tham khảo về Machine Learning cơ bản',
      status: DocumentStatus.APPROVED,
      category: DocumentCategory.REFERENCE,
      accessLevel: AccessLevel.STUDENT,
      isPublic: true
    })
  ]);

  console.log('✅ Documents ready');
}

async function ensureNotification(data: Prisma.NotificationCreateManyInput) {
  await prisma.notification.createMany({
    data,
    skipDuplicates: true
  });
}

async function seedNotifications(projects: SeededProjects, users: SeededUsers) {
  console.log('🔔 Seeding notifications...');
  const [student1, student2, student3, , student5] = users.students;
  const [lecturer1, lecturer2] = users.lecturers;

  const notificationData: Prisma.NotificationCreateManyInput[] = [
    {
      userId: student1.id,
      projectId: projects.project1.id,
      type: 'DEADLINE_APPROACHING',
      title: 'Deadline sắp đến',
      message: 'Task "Xây dựng prototype" sẽ đến hạn vào ngày 30/06/2025',
      isRead: false
    },
    {
      userId: student2.id,
      projectId: projects.project1.id,
      type: 'COMMENT_ADDED',
      title: 'Giảng viên đã nhận xét',
      message: 'Dr. Nguyễn Văn A đã thêm nhận xét về báo cáo tiến độ của team',
      isRead: false
    },
    {
      userId: lecturer1.id,
      projectId: projects.project1.id,
      type: 'TASK_COMPLETED',
      title: 'Sinh viên hoàn thành task',
      message: 'Lê Văn C đã hoàn thành task "Thiết kế hệ thống"',
      isRead: true
    },
    {
      userId: student2.id,
      projectId: projects.project2.id,
      type: 'DEADLINE_APPROACHING',
      title: 'Deadline sắp đến',
      message: 'Task "Thiết kế phần cứng" sẽ đến hạn vào ngày 31/05/2025',
      isRead: false
    },
    {
      userId: student5.id,
      projectId: projects.project2.id,
      type: 'TASK_ASSIGNED',
      title: 'Task mới được giao',
      message: 'Bạn đã được giao task "Phát triển ứng dụng mobile"',
      isRead: false
    },
    {
      userId: student3.id,
      projectId: projects.project3.id,
      type: 'TASK_COMPLETED',
      title: 'Hoàn thành task',
      message: 'Bạn đã hoàn thành task "Thu thập dữ liệu"',
      isRead: true
    },
    {
      userId: lecturer2.id,
      projectId: projects.project3.id,
      type: 'PROJECT_STATUS_CHANGED',
      title: 'Cập nhật tiến độ',
      message: 'Hoàng Văn E đã cập nhật tiến độ project lên 60%',
      isRead: false
    }
  ];

  await prisma.notification.createMany({ data: notificationData, skipDuplicates: true });

  console.log('✅ Notifications ready');
}

async function main() {
  console.log('🌱 Starting seed...');
  const RESET_DATA = process.env.RESET_DATA === 'true' || process.env.RESET_DATA === '1';

  await cleanupDatabase(RESET_DATA);

  const users = await seedUsers();
  const projects = await seedProjects(users);
  await seedTasks(projects, users);
  await seedLabels(projects, users);
  await seedTaskLabels(projects);
  await seedDocuments(projects, users);
  await seedNotifications(projects, users);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Demo accounts:');
  console.log('Admin:     admin@gmail.com / admin123');
  console.log('Lecturer:  lecturer1@gmail.com / lecturer123');
  console.log('Lecturer:  lecturer2@gmail.com / lecturer123');
  console.log('Student:   student1@gmail.com / student123 (Lead of Project 1)');
  console.log('Student:   student2@gmail.com / student123 (Member of Project 1, Lead of Project 2)');
  console.log('Student:   student3@gmail.com / student123 (Lead of Project 3)');
  console.log('Student:   student4@gmail.com / student123 (Member of Project 1)');
  console.log('Student:   student5@gmail.com / student123 (Member of Project 2)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

