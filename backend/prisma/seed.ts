import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (optional - careful in production!)
  await prisma.notification.deleteMany();
  await prisma.aIQuery.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectStudent.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@research.edu',
      passwordHash: await bcrypt.hash('admin123', 10),
      fullName: 'System Administrator',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user');

  // Create Lecturers
  const lecturer1 = await prisma.user.create({
    data: {
      email: 'lecturer1@research.edu',
      passwordHash: await bcrypt.hash('lecturer123', 10),
      fullName: 'Dr. Nguyễn Văn A',
      role: 'LECTURER',
    },
  });

  const lecturer2 = await prisma.user.create({
    data: {
      email: 'lecturer2@research.edu',
      passwordHash: await bcrypt.hash('lecturer123', 10),
      fullName: 'Dr. Trần Thị B',
      role: 'LECTURER',
    },
  });
  console.log('✅ Created 2 lecturers');

  // Create Students
  const student1 = await prisma.user.create({
    data: {
      email: 'student1@research.edu',
      passwordHash: await bcrypt.hash('student123', 10),
      fullName: 'Lê Văn C',
      role: 'STUDENT',
      studentId: 'SV001',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@research.edu',
      passwordHash: await bcrypt.hash('student123', 10),
      fullName: 'Phạm Thị D',
      role: 'STUDENT',
      studentId: 'SV002',
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'student3@research.edu',
      passwordHash: await bcrypt.hash('student123', 10),
      fullName: 'Hoàng Văn E',
      role: 'STUDENT',
      studentId: 'SV003',
    },
  });

  const student4 = await prisma.user.create({
    data: {
      email: 'student4@research.edu',
      passwordHash: await bcrypt.hash('student123', 10),
      fullName: 'Vũ Thị F',
      role: 'STUDENT',
      studentId: 'SV004',
    },
  });

  const student5 = await prisma.user.create({
    data: {
      email: 'student5@research.edu',
      passwordHash: await bcrypt.hash('student123', 10),
      fullName: 'Đặng Văn G',
      role: 'STUDENT',
      studentId: 'SV005',
    },
  });
  console.log('✅ Created 5 students');

  // Create Projects
  const project1 = await prisma.project.create({
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

  const project2 = await prisma.project.create({
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

  const project3 = await prisma.project.create({
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

  // Add students to projects
  await prisma.projectStudent.createMany({
    data: [
      // Project 1 - AI in Education (3 students - team project)
      {
        projectId: project1.id,
        studentId: student1.id,
        role: 'LEAD',
      },
      {
        projectId: project1.id,
        studentId: student2.id,
        role: 'MEMBER',
      },
      {
        projectId: project1.id,
        studentId: student4.id,
        role: 'MEMBER',
      },
      // Project 2 - IoT Smart Home (2 students)
      {
        projectId: project2.id,
        studentId: student2.id,
        role: 'LEAD',
      },
      {
        projectId: project2.id,
        studentId: student5.id,
        role: 'MEMBER',
      },
      // Project 3 - Big Data ML (single student)
      {
        projectId: project3.id,
        studentId: student3.id,
        role: 'LEAD',
      },
    ],
  });

  console.log('✅ Created 3 projects with student assignments');

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
    ],
  });

  console.log('✅ Created sample documents');

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
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

