import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.holiday.findMany({
      orderBy: {
        date: 'asc',
      },
    });
  }

  findByYear(year: number) {
    return this.prisma.holiday.findMany({
      where: {
        year,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async create(data: { title: string; date: string; description?: string }) {
    const holidayDate = new Date(data.date);

    if (isNaN(holidayDate.getTime())) {
      throw new BadRequestException('Invalid holiday date');
    }

    return this.prisma.holiday.create({
      data: {
        title: data.title,
        date: holidayDate,
        description: data.description,
        year: holidayDate.getFullYear(),
      },
    });
  }

  async update(
    id: number,
    data: {
      title?: string;
      date?: string;
      description?: string;
      isActive?: boolean;
    },
  ) {
    const holiday = await this.prisma.holiday.findUnique({
      where: {
        id,
      },
    });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    const holidayDate = data.date ? new Date(data.date) : holiday.date;

    return this.prisma.holiday.update({
      where: {
        id,
      },
      data: {
        title: data.title,
        date: holidayDate,
        description: data.description,
        isActive: data.isActive,
        year: holidayDate.getFullYear(),
      },
    });
  }

  async remove(id: number) {
    const holiday = await this.prisma.holiday.findUnique({
      where: {
        id,
      },
    });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    await this.prisma.holiday.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Holiday deleted successfully',
    };
  }
}
