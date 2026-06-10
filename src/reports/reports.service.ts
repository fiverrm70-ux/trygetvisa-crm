import { Injectable } from '@nestjs/common';
import { LeadStatus, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardReport() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalLeads,
      newLeads,
      assignedToSales,
      followUp,
      callBack,
      paymentDone,
      saleCompleted,
      assignedToProcess,
      processRunning,
      processCompleted,
      totalEmployees,
      activeEmployees,
      leadsTeamCount,
      salesTeamCount,
      processTeamCount,
      presentToday,
    ] = await Promise.all([
      this.prisma.lead.count(),

      this.prisma.lead.count({
        where: { status: LeadStatus.NEW },
      }),

      this.prisma.lead.count({
        where: { status: LeadStatus.ASSIGNED_TO_SALES },
      }),

      this.prisma.lead.count({
        where: { status: LeadStatus.FOLLOW_UP },
      }),

      this.prisma.lead.count({
        where: { status: LeadStatus.CALL_BACK },
      }),

      this.prisma.lead.count({
        where: { status: LeadStatus.PAYMENT_DONE },
      }),

      this.prisma.lead.count({
        where: { status: LeadStatus.SALE_COMPLETED },
      }),

      this.prisma.lead.count({
        where: { status: LeadStatus.ASSIGNED_TO_PROCESS },
      }),

      this.prisma.lead.count({
        where: { status: LeadStatus.PROCESS_RUNNING },
      }),

      this.prisma.lead.count({
        where: { status: LeadStatus.PROCESS_COMPLETED },
      }),

      this.prisma.user.count(),

      this.prisma.user.count({
        where: { isActive: true },
      }),

      this.prisma.user.count({
        where: { role: Role.LEADS_EXECUTIVE },
      }),

      this.prisma.user.count({
        where: { role: Role.SALES_EXECUTIVE },
      }),

      this.prisma.user.count({
        where: { role: Role.PROCESS_EXECUTIVE },
      }),

      this.prisma.activityLog.groupBy({
        by: ['userId'],
        where: {
          type: 'LOGIN',
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
    ]);

    const conversionPercentage = totalLeads
      ? Math.round((paymentDone / totalLeads) * 100)
      : 0;

    const processCompletionPercentage =
      assignedToProcess + processRunning + processCompleted
        ? Math.round(
            (processCompleted /
              (assignedToProcess + processRunning + processCompleted)) *
              100,
          )
        : 0;

    return {
      leads: {
        totalLeads,
        newLeads,
        assignedToSales,
        followUp,
        callBack,
        paymentDone,
        saleCompleted,
        assignedToProcess,
        processRunning,
        processCompleted,
      },
      employees: {
        totalEmployees,
        activeEmployees,
        leadsTeamCount,
        salesTeamCount,
        processTeamCount,
      },
      attendance: {
        presentToday: presentToday.length,
        absentToday: Math.max(0, activeEmployees - presentToday.length),
      },
      performance: {
        conversionPercentage,
        processCompletionPercentage,
      },
    };
  }
}
