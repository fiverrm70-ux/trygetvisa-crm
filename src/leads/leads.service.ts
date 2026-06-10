import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DocumentStatus,
  LeadStatus,
  ProcessDoneStatus,
  Role,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AssignLeadDto, AssignLeadType } from './dto/assign-lead.dto';
import { BulkAssignLeadsDto } from './dto/bulk-assign-leads.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateProcessUpdateDto } from './dto/create-process-update.dto';
import { CreateSalesFollowUpDto } from './dto/create-sales-follow-up.dto';
import { UpdateProcessDocumentDto } from './dto/update-process-document.dto';
import * as bcrypt from 'bcryptjs';

type AuthUser = {
  userId: number;
  email: string;
  role: string;
};

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  private leadInclude() {
    return {
      createdBy: true,
      assignedToSales: true,
      assignedToProcess: true,
      client: true,
      followUps: {
        orderBy: {
          createdAt: 'desc' as const,
        },
        include: {
          salesUser: true,
        },
      },
      processDocuments: {
        orderBy: {
          createdAt: 'asc' as const,
        },
        include: {
          processUser: true,
        },
      },
      processUpdateHistories: {
        orderBy: {
          createdAt: 'desc' as const,
        },
        include: {
          processUser: true,
        },
      },
    };
  }

  async create(createLeadDto: CreateLeadDto, user: AuthUser) {
    return this.prisma.$transaction(async (tx) => {
      let clientId: number | undefined;

      const leadEmail = createLeadDto.email?.trim().toLowerCase();

      if (leadEmail) {
        const existingClient = await tx.user.findFirst({
          where: {
            email: leadEmail,
            role: Role.CLIENT,
          },
        });

        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const existingUser = await tx.user.findUnique({
            where: {
              email: leadEmail,
            },
          });

          if (!existingUser) {
            const rawPassword =
              createLeadDto.contactNo.length >= 6
                ? createLeadDto.contactNo.slice(-6)
                : createLeadDto.contactNo;

            const hashedPassword = await bcrypt.hash(rawPassword, 10);

            const client = await tx.user.create({
              data: {
                name: createLeadDto.fullName,
                email: leadEmail,
                phone: createLeadDto.contactNo,
                password: hashedPassword,
                role: Role.CLIENT,
                isActive: true,
              },
            });

            clientId = client.id;
          }
        }
      }

      const lead = await tx.lead.create({
        data: {
          fullName: createLeadDto.fullName,
          contactNo: createLeadDto.contactNo,
          email: createLeadDto.email,
          alternateEmail: createLeadDto.alternateEmail,

          dob: createLeadDto.dob ? new Date(createLeadDto.dob) : undefined,
          maritalStatus: createLeadDto.maritalStatus,
          marriageDate: createLeadDto.marriageDate
            ? new Date(createLeadDto.marriageDate)
            : undefined,

          educationLevel: createLeadDto.educationLevel,
          educationCourse: createLeadDto.educationCourse,

          job: createLeadDto.job,
          yearsOfExperience: createLeadDto.yearsOfExperience,
          business: createLeadDto.business,
          city: createLeadDto.city,

          countryApplying: createLeadDto.countryApplying,
          schengenCountry: createLeadDto.schengenCountry,
          nonSchengenCountry: createLeadDto.nonSchengenCountry,

          visaType: createLeadDto.visaType,
          applyingWithSpouse: createLeadDto.applyingWithSpouse,

          spouseDob: createLeadDto.spouseDob
            ? new Date(createLeadDto.spouseDob)
            : undefined,
          spouseEducationStatus: createLeadDto.spouseEducationStatus,
          spouseWorkExperience: createLeadDto.spouseWorkExperience,

          processingFees:
            createLeadDto.processingFees !== undefined &&
            createLeadDto.processingFees !== ''
              ? Number(createLeadDto.processingFees)
              : undefined,

          amountPaid:
            createLeadDto.amountPaid !== undefined &&
            createLeadDto.amountPaid !== ''
              ? Number(createLeadDto.amountPaid)
              : undefined,

          amountPending:
            createLeadDto.amountPending !== undefined &&
            createLeadDto.amountPending !== ''
              ? Number(createLeadDto.amountPending)
              : undefined,

          visaCopy: createLeadDto.visaCopy,
          visaStatus: createLeadDto.visaStatus,
          adminComment: createLeadDto.adminComment,

          ...(clientId
            ? {
                client: {
                  connect: {
                    id: clientId,
                  },
                },
              }
            : {}),

          createdBy: {
            connect: {
              id: user.userId,
            },
          },
        },
        include: this.leadInclude(),
      });

      return lead;
    });
  }

  findAll(user: AuthUser) {
    const role = user.role as Role;
    const include = this.leadInclude();

    if (role === Role.LEADS_EXECUTIVE) {
      return this.prisma.lead.findMany({
        where: {
          createdById: user.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include,
      });
    }

    if (role === Role.SALES_EXECUTIVE) {
      return this.prisma.lead.findMany({
        where: {
          assignedToSalesId: user.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include,
      });
    }

    if (role === Role.PROCESS_EXECUTIVE) {
      return this.prisma.lead.findMany({
        where: {
          assignedToProcessId: user.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include,
      });
    }

    if (role === Role.CLIENT) {
      return this.prisma.lead.findMany({
        where: {
          clientId: user.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include,
      });
    }

    return this.prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include,
    });
  }

  async assignLead(
    leadId: number,
    assignLeadDto: AssignLeadDto,
    user: AuthUser,
  ) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can assign leads');
    }

    const lead = await this.prisma.lead.findUnique({
      where: {
        id: leadId,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const employee = await this.prisma.user.findUnique({
      where: {
        id: assignLeadDto.employeeId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Account not found');
    }

    if (!employee.isActive) {
      throw new BadRequestException('Selected account is inactive');
    }

    if (assignLeadDto.type === AssignLeadType.SALES) {
      if (employee.role !== Role.SALES_EXECUTIVE) {
        throw new BadRequestException(
          'Selected employee is not sales executive',
        );
      }

      return this.prisma.lead.update({
        where: {
          id: leadId,
        },
        data: {
          assignedToSalesId: employee.id,
          status: LeadStatus.ASSIGNED_TO_SALES,
        },
        include: this.leadInclude(),
      });
    }

    if (assignLeadDto.type === AssignLeadType.PROCESS) {
      if (employee.role !== Role.PROCESS_EXECUTIVE) {
        throw new BadRequestException(
          'Selected employee is not process executive',
        );
      }

      return this.prisma.lead.update({
        where: {
          id: leadId,
        },
        data: {
          assignedToProcessId: employee.id,
          status: LeadStatus.ASSIGNED_TO_PROCESS,
          processDoneStatus: ProcessDoneStatus.PENDING,
        },
        include: this.leadInclude(),
      });
    }

    if (assignLeadDto.type === AssignLeadType.CLIENT) {
      if (employee.role !== Role.CLIENT) {
        throw new BadRequestException('Selected account is not a client');
      }

      return this.prisma.lead.update({
        where: {
          id: leadId,
        },
        data: {
          clientId: employee.id,
        },
        include: this.leadInclude(),
      });
    }

    throw new BadRequestException('Invalid assignment type');
  }

  async createSalesFollowUp(
    leadId: number,
    dto: CreateSalesFollowUpDto,
    user: AuthUser,
  ) {
    if (user.role !== Role.SALES_EXECUTIVE) {
      throw new ForbiddenException('Only sales executive can add follow-ups');
    }

    const lead = await this.prisma.lead.findUnique({
      where: {
        id: leadId,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.assignedToSalesId !== user.userId) {
      throw new ForbiddenException('This lead is not assigned to you');
    }

    let nextStatus: LeadStatus = LeadStatus.FOLLOW_UP;

    if (dto.disposition === 'CALL_BACK') {
      nextStatus = LeadStatus.CALL_BACK;
    }

    if (dto.disposition === 'PAYMENT_DONE') {
      nextStatus = LeadStatus.PAYMENT_DONE;
    }

    if (dto.disposition === 'SALE_COMPLETED') {
      nextStatus = LeadStatus.SALE_COMPLETED;
    }

    const followUp = await this.prisma.salesFollowUp.create({
      data: {
        leadId,
        salesUserId: user.userId,
        disposition: dto.disposition,
        notes: dto.notes,
        nextFollowUpDate: dto.nextFollowUpDate
          ? new Date(dto.nextFollowUpDate)
          : undefined,
      },
    });

    await this.prisma.lead.update({
      where: {
        id: leadId,
      },
      data: {
        status: nextStatus,
      },
    });

    return {
      message:
        nextStatus === LeadStatus.PAYMENT_DONE
          ? 'Payment done updated. Super admin can now move this lead to process.'
          : 'Follow-up saved successfully',
      followUp,
    };
  }

  async createProcessUpdate(
    leadId: number,
    dto: CreateProcessUpdateDto,
    user: AuthUser,
  ) {
    if (user.role !== Role.PROCESS_EXECUTIVE) {
      throw new ForbiddenException(
        'Only process executive can update process status',
      );
    }

    const lead = await this.prisma.lead.findUnique({
      where: {
        id: leadId,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.assignedToProcessId !== user.userId) {
      throw new ForbiddenException('This lead is not assigned to you');
    }

    const processDoneStatus = dto.processDoneStatus as ProcessDoneStatus;

    const nextStatus =
      processDoneStatus === ProcessDoneStatus.YES
        ? LeadStatus.PROCESS_COMPLETED
        : (dto.status as LeadStatus);

    const result = await this.prisma.$transaction(async (tx) => {
      const history = await tx.processUpdateHistory.create({
        data: {
          leadId,
          processUserId: user.userId,
          status: nextStatus,
          processDoneStatus,
          notes: dto.notes || '',
        },
      });

      const updatedLead = await tx.lead.update({
        where: {
          id: leadId,
        },
        data: {
          status: nextStatus,
          processDoneStatus,
          adminComment: dto.notes || lead.adminComment,
        },
        include: this.leadInclude(),
      });

      return {
        history,
        updatedLead,
      };
    });

    return {
      message:
        nextStatus === LeadStatus.PROCESS_COMPLETED
          ? 'Process completed successfully'
          : 'Process status updated successfully',
      history: result.history,
      lead: result.updatedLead,
    };
  }

  async updateProcessDocument(
    leadId: number,
    dto: UpdateProcessDocumentDto,
    user: AuthUser,
  ) {
    if (user.role !== Role.PROCESS_EXECUTIVE) {
      throw new ForbiddenException(
        'Only process executive can update process documents',
      );
    }

    const lead = await this.prisma.lead.findUnique({
      where: {
        id: leadId,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.assignedToProcessId !== user.userId) {
      throw new ForbiddenException('This lead is not assigned to you');
    }

    const existingDocument = await this.prisma.processDocument.findUnique({
      where: {
        leadId_documentName: {
          leadId,
          documentName: dto.documentName,
        },
      },
    });

    const hasNewFileUrl =
      typeof dto.fileUrl === 'string' && dto.fileUrl.trim().length > 0;

    const finalFileUrl = hasNewFileUrl
      ? dto.fileUrl?.trim()
      : existingDocument?.fileUrl || null;

    const document = await this.prisma.processDocument.upsert({
      where: {
        leadId_documentName: {
          leadId,
          documentName: dto.documentName,
        },
      },
      update: {
        ...(finalFileUrl ? { fileUrl: finalFileUrl } : {}),
        status: dto.status as DocumentStatus,
        remarks: dto.remarks || '',
        processUserId: user.userId,
      },
      create: {
        leadId,
        processUserId: user.userId,
        documentName: dto.documentName,
        fileUrl: finalFileUrl,
        status: dto.status as DocumentStatus,
        remarks: dto.remarks || '',
      },
    });

    return {
      message: 'Process document updated successfully',
      document,
    };
  }

  async bulkAssignAutoDistribute(
    bulkAssignDto: BulkAssignLeadsDto,
    user: AuthUser,
  ) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can bulk assign leads');
    }

    if (!bulkAssignDto.leadIds.length) {
      throw new BadRequestException('Please select at least one lead');
    }

    if (!bulkAssignDto.employeeIds.length) {
      throw new BadRequestException('Please select at least one employee');
    }

    const leads = await this.prisma.lead.findMany({
      where: {
        id: {
          in: bulkAssignDto.leadIds,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (leads.length !== bulkAssignDto.leadIds.length) {
      throw new BadRequestException('Some selected leads are invalid');
    }

    const employees = await this.prisma.user.findMany({
      where: {
        id: {
          in: bulkAssignDto.employeeIds,
        },
        isActive: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    if (employees.length !== bulkAssignDto.employeeIds.length) {
      throw new BadRequestException('Some selected employees are invalid');
    }

    if (bulkAssignDto.type === AssignLeadType.SALES) {
      const invalidEmployee = employees.find(
        (employee) => employee.role !== Role.SALES_EXECUTIVE,
      );

      if (invalidEmployee) {
        throw new BadRequestException(
          'All selected employees must be sales executives',
        );
      }
    }

    if (bulkAssignDto.type === AssignLeadType.PROCESS) {
      const invalidEmployee = employees.find(
        (employee) => employee.role !== Role.PROCESS_EXECUTIVE,
      );

      if (invalidEmployee) {
        throw new BadRequestException(
          'All selected employees must be process executives',
        );
      }
    }

    const assignments = leads.map((lead, index) => {
      const employee = employees[index % employees.length];

      return {
        lead,
        employee,
      };
    });

    const result = await this.prisma.$transaction(
      assignments.map(({ lead, employee }) => {
        if (bulkAssignDto.type === AssignLeadType.SALES) {
          return this.prisma.lead.update({
            where: {
              id: lead.id,
            },
            data: {
              assignedToSalesId: employee.id,
              status: LeadStatus.ASSIGNED_TO_SALES,
            },
          });
        }

        return this.prisma.lead.update({
          where: {
            id: lead.id,
          },
          data: {
            assignedToProcessId: employee.id,
            status: LeadStatus.ASSIGNED_TO_PROCESS,
            processDoneStatus: ProcessDoneStatus.PENDING,
          },
        });
      }),
    );

    const distribution = employees.map((employee) => ({
      employeeId: employee.id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      assignedCount: assignments.filter(
        (assignment) => assignment.employee.id === employee.id,
      ).length,
    }));

    return {
      message: 'Leads assigned successfully',
      totalAssigned: result.length,
      distribution,
    };
  }
}
