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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientsService } from './clients.service';

type CreateClientDto = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  isActive?: boolean;
};

type UpdateClientDto = {
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
};

type ResetPasswordDto = {
  newPassword: string;
};

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('')
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @Post('')
  createClient(@Body() body: CreateClientDto) {
    return this.clientsService.createClient(body);
  }

  @Patch(':id')
  updateClient(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateClientDto,
  ) {
    return this.clientsService.updateClient(id, body);
  }

  @Patch(':id/enable')
  enableClient(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.setClientStatus(id, true);
  }

  @Patch(':id/disable')
  disableClient(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.setClientStatus(id, false);
  }

  @Patch(':id/reset-password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ResetPasswordDto,
  ) {
    return this.clientsService.resetPassword(id, body.newPassword);
  }
}
