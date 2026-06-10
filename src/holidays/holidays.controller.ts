import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { HolidaysService } from './holidays.service';

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  findAll() {
    return this.holidaysService.findAll();
  }

  @Get(':year')
  findByYear(@Param('year', ParseIntPipe) year: number) {
    return this.holidaysService.findByYear(year);
  }

  @Post()
  create(
    @Body()
    body: {
      title: string;
      date: string;
      description?: string;
    },
  ) {
    return this.holidaysService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      title?: string;
      date?: string;
      description?: string;
      isActive?: boolean;
    },
  ) {
    return this.holidaysService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.holidaysService.remove(id);
  }
}
