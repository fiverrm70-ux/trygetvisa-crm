import { BadRequestException, Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

type AuthUser = {
  userId: number;
  email: string;
  role: string;
};

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async createActivity(user: AuthUser, type: ActivityType, note?: string) {
    const lastActivity = await this.prisma.activityLog.findFirst({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (type === ActivityType.BREAK_END) {
      if (!lastActivity || lastActivity.type !== ActivityType.BREAK_START) {
        throw new BadRequestException('Please start break first');
      }
    }

    if (type === ActivityType.LUNCH_END) {
      if (!lastActivity || lastActivity.type !== ActivityType.LUNCH_START) {
        throw new BadRequestException('Please start lunch first');
      }
    }

    if (type === ActivityType.LOGOUT) {
      if (!lastActivity || lastActivity.type === ActivityType.LOGOUT) {
        throw new BadRequestException('You are already logged out');
      }
    }

    return this.prisma.activityLog.create({
      data: {
        userId: user.userId,
        type,
        note,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  async getMyTodayActivity(user: AuthUser) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activities = await this.prisma.activityLog.findMany({
      where: {
        userId: user.userId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      date: todayStart,
      activities,
      summary: this.calculateSummary(activities),
    };
  }

  async getTodayAttendanceReport() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const employees = await this.prisma.user.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        activities: {
          where: {
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const rows = employees.map((employee) => {
      const summary = this.calculateSummary(employee.activities);

      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        isActive: employee.isActive,
        date: todayStart,
        activities: employee.activities,
        ...summary,
      };
    });

    const presentToday = rows.filter((row) => row.loginTime).length;
    const activeEmployees = rows.filter((row) => row.isActive).length;
    const absentToday = activeEmployees - presentToday;

    const totalWorkingMinutes = rows.reduce(
      (total, row) => total + row.workingMinutes,
      0,
    );

    return {
      stats: {
        presentToday,
        absentToday,
        activeEmployees,
        totalWorkingMinutes,
        totalWorkingHours: this.minutesToHours(totalWorkingMinutes),
      },
      rows,
    };
  }

  private calculateSummary(
    activities: {
      type: ActivityType;
      createdAt: Date;
    }[],
  ) {
    const login = activities.find(
      (activity) => activity.type === ActivityType.LOGIN,
    );

    const logout = [...activities]
      .reverse()
      .find((activity) => activity.type === ActivityType.LOGOUT);

    const breakMinutes = this.calculatePairMinutes(
      activities,
      ActivityType.BREAK_START,
      ActivityType.BREAK_END,
    );

    const lunchMinutes = this.calculatePairMinutes(
      activities,
      ActivityType.LUNCH_START,
      ActivityType.LUNCH_END,
    );

    const loginTime = login?.createdAt || null;
    const logoutTime = logout?.createdAt || null;

    const rawWorkingMinutes =
      loginTime && logoutTime
        ? Math.max(
            0,
            Math.floor(
              (logoutTime.getTime() - loginTime.getTime()) / (1000 * 60),
            ),
          )
        : loginTime
          ? Math.max(
              0,
              Math.floor((Date.now() - loginTime.getTime()) / (1000 * 60)),
            )
          : 0;

    const workingMinutes = Math.max(
      0,
      rawWorkingMinutes - breakMinutes - lunchMinutes,
    );

    return {
      loginTime,
      logoutTime,
      breakMinutes,
      lunchMinutes,
      workingMinutes,
      breakHours: this.minutesToHours(breakMinutes),
      lunchHours: this.minutesToHours(lunchMinutes),
      workingHours: this.minutesToHours(workingMinutes),
    };
  }

  private calculatePairMinutes(
    activities: {
      type: ActivityType;
      createdAt: Date;
    }[],
    startType: ActivityType,
    endType: ActivityType,
  ) {
    let totalMinutes = 0;
    let startTime: Date | null = null;

    activities.forEach((activity) => {
      if (activity.type === startType) {
        startTime = activity.createdAt;
      }

      if (activity.type === endType && startTime) {
        totalMinutes += Math.max(
          0,
          Math.floor(
            (activity.createdAt.getTime() - startTime.getTime()) / (1000 * 60),
          ),
        );

        startTime = null;
      }
    });

    return totalMinutes;
  }

  private minutesToHours(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
  }
}
