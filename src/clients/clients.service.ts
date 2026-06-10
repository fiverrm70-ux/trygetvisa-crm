import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';

type CreateClientInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  isActive?: boolean;
};

type UpdateClientInput = {
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
};

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      where: {
        role: Role.CLIENT,
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
        clientLeads: {
          select: {
            id: true,
            fullName: true,
            contactNo: true,
            email: true,
            countryApplying: true,
            visaType: true,
            status: true,
            processDoneStatus: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const client = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.CLIENT,
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
        clientLeads: {
          select: {
            id: true,
            fullName: true,
            contactNo: true,
            email: true,
            countryApplying: true,
            visaType: true,
            status: true,
            processDoneStatus: true,
            assignedToProcess: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            processDocuments: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            processUpdateHistories: {
              orderBy: {
                createdAt: 'desc',
              },
              include: {
                processUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async createClient(dto: CreateClientInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Client email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        role: Role.CLIENT,
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

  async updateClient(id: number, dto: UpdateClientInput) {
    const client = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.CLIENT,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (dto.email && dto.email !== client.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (existingUser) {
        throw new BadRequestException('Client email already exists');
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

  async setClientStatus(id: number, isActive: boolean) {
    const client = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.CLIENT,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
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
    const client = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.CLIENT,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
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
}
