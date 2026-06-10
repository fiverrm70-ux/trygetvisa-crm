import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

type CreateEmployeeDto = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
  isActive?: boolean;
};

type UpdateEmployeeDto = {
  name?: string;
  email?: string;
  phone?: string;
  role?: Role;
  isActive?: boolean;
};

type ResetPasswordDto = {
  newPassword: string;
};

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('stats')
  getEmployeeStats() {
    return this.usersService.getEmployeeStats();
  }

  @Post()
  createEmployee(@Body() body: CreateEmployeeDto) {
    return this.usersService.createEmployee(body);
  }

  @Patch(':id')
  updateEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateEmployeeDto,
  ) {
    return this.usersService.updateEmployee(id, body);
  }

  @Patch(':id/enable')
  enableEmployee(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.setEmployeeStatus(id, true);
  }

  @Patch(':id/disable')
  disableEmployee(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.setEmployeeStatus(id, false);
  }

  @Patch(':id/reset-password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, body.newPassword);
  }
}
