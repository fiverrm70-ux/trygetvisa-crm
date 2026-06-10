import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';

type CreateEmployeeInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
  isActive?: boolean;
};

type UpdateEmployeeInput = {
  name?: string;
  email?: string;
  phone?: string;
  role?: Role;
  isActive?: boolean;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      where: {
        role: {
          not: Role.CLIENT,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createEmployee(dto: CreateEmployeeInput) {
    if (dto.role === Role.CLIENT) {
      throw new BadRequestException(
        'Please create clients from Clients module',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Employee email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        role: dto.role,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateEmployee(id: number, dto: UpdateEmployeeInput) {
    const employee = await this.prisma.user.findFirst({
      where: {
        id,
        role: {
          not: Role.CLIENT,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (dto.role === Role.CLIENT) {
      throw new BadRequestException(
        'Please manage clients from Clients module',
      );
    }

    if (dto.email && dto.email !== employee.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (existingUser) {
        throw new BadRequestException('Employee email already exists');
      }
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async setEmployeeStatus(id: number, isActive: boolean) {
    const employee = await this.prisma.user.findFirst({
      where: {
        id,
        role: {
          not: Role.CLIENT,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async resetPassword(id: number, newPassword: string) {
    const employee = await this.prisma.user.findFirst({
      where: {
        id,
        role: {
          not: Role.CLIENT,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getEmployeeStats() {
    const [
      totalEmployees,
      leadsTeamCount,
      salesTeamCount,
      processTeamCount,
      activeEmployees,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          role: {
            not: Role.CLIENT,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          role: Role.LEADS_EXECUTIVE,
        },
      }),
      this.prisma.user.count({
        where: {
          role: Role.SALES_EXECUTIVE,
        },
      }),
      this.prisma.user.count({
        where: {
          role: Role.PROCESS_EXECUTIVE,
        },
      }),
      this.prisma.user.count({
        where: {
          isActive: true,
          role: {
            not: Role.CLIENT,
          },
        },
      }),
    ]);

    return {
      totalEmployees,
      leadsTeamCount,
      salesTeamCount,
      processTeamCount,
      activeEmployees,
    };
  }
}
