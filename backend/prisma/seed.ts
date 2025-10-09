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
  console.log('✅ Created 3 students');

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      title: 'Nghiên cứu ứng dụng AI trong giáo dục',
      description: 'Đề tài nghiên cứu về việc áp dụng trí tuệ nhân tạo vào quản lý và hỗ trợ giảng dạy trong các trường đại học.',
      studentId: student1.id,
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
      studentId: student2.id,
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
      studentId: student3.id,
      lecturerId: lecturer2.id,
      startDate: new Date('2024-08-15'),
      endDate: new Date('2025-05-30'),
      status: 'IN_PROGRESS',
      progress: 60,
    },
  });
  console.log('✅ Created 3 projects');

  // Create Tasks for Project 1
  await prisma.task.createMany({
    data: [
      {
        projectId: project1.id,
        title: 'Nghiên cứu tài liệu tham khảo',
        description: 'Tìm hiểu các nghiên cứu liên quan về AI trong giáo dục',
        assigneeId: student1.id,
        status: 'DONE',
        priority: 'HIGH',
        completedAt: new Date('2024-10-15'),
      },
      {
        projectId: project1.id,
        title: 'Thiết kế hệ thống',
        description: 'Thiết kế kiến trúc tổng thể của hệ thống',
        assigneeId: student1.id,
        status: 'DONE',
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
        status: 'DONE',
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
        assigneeId: student2.id,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2025-04-30'),
      },
    ],
  });

  console.log('✅ Created tasks');

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: student1.id,
        projectId: project1.id,
        type: 'DEADLINE_APPROACHING',
        title: 'Deadline sắp đến',
        message: 'Task "Xây dựng prototype" sẽ đến hạn vào ngày 28/02/2025',
        isRead: false,
      },
      {
        userId: student1.id,
        projectId: project1.id,
        type: 'COMMENT_ADDED',
        title: 'Giảng viên đã nhận xét',
        message: 'Dr. Nguyễn Văn A đã thêm nhận xét về báo cáo tiến độ của bạn',
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
    ],
  });

  console.log('✅ Created notifications');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Demo accounts:');
  console.log('Admin:     admin@research.edu / admin123');
  console.log('Lecturer:  lecturer1@research.edu / lecturer123');
  console.log('Student:   student1@research.edu / student123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

